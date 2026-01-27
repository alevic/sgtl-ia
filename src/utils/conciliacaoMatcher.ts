import { ITransacaoBancaria, ITransacao, TipoTransacao } from '../../types';

interface MatchResult {
    transacaoBancaria: ITransacaoBancaria;
    sugestaoSistema?: ITransacao;
    score: number; // 0 a 100
}

export const findMatches = (
    transacoesBancarias: ITransacaoBancaria[],
    transacoesSistema: ITransacao[]
): MatchResult[] => {
    return transacoesBancarias.map(bancaria => {
        // Filtrar transações do sistema que podem ser candidatas
        // 1. Mesmo tipo (Crédito = Receita, Débito = Despesa)
        // 2. Não conciliadas (idealmente, mas por enquanto vamos checar todas)

        const candidatos = transacoesSistema.filter(sistema => {
            const tipoCompativel =
                (bancaria.tipo === 'CREDITO' && sistema.tipo === TipoTransacao.RECEITA) ||
                (bancaria.tipo === 'DEBITO' && sistema.tipo === TipoTransacao.DESPESA);

            return tipoCompativel;
        });

        // Encontrar o melhor match
        let melhorMatch: ITransacao | undefined;
        let melhorScore = 0;

        candidatos.forEach(sistema => {
            const score = calcularScore(bancaria, sistema);
            if (score > melhorScore) {
                melhorScore = score;
                melhorMatch = sistema;
            }
        });

        // Só sugerir se o score for alto o suficiente (ex: > 80)
        return {
            transacaoBancaria: bancaria,
            sugestaoSistema: melhorScore >= 80 ? melhorMatch : undefined,
            score: melhorScore
        };
    });
};

const calcularScore = (bancaria: ITransacaoBancaria, sistema: ITransacao): number => {
    let score = 0;

    // 1. Valor Exato (Peso: 60)
    // Precisamos lidar com floating point, então usamos uma margem muito pequena
    const diffValor = Math.abs(bancaria.valor - sistema.valor);
    if (diffValor < 0.01) {
        score += 60;
    } else {
        return 0; // Se o valor não bate, dificilmente é a mesma transação (a menos que seja parcial, mas isso é complexo)
    }

    // 2. Data Próxima (Peso: 40)
    // Aceitamos até 3 dias de diferença
    const dataBancaria = new Date(bancaria.data).getTime();
    const dataSistema = new Date(sistema.data_pagamento || sistema.data_vencimento || sistema.data_emissao).getTime();
    const diffDias = Math.abs(dataBancaria - dataSistema) / (1000 * 60 * 60 * 24);

    if (diffDias <= 0.5) { // Mesmo dia
        score += 40;
    } else if (diffDias <= 1) {
        score += 30;
    } else if (diffDias <= 3) {
        score += 15;
    } else {
        // Mais de 3 dias de diferença, penaliza
        score -= 10;
    }

    return score;
};
