import { IExtratoBancario, ITransacaoBancaria } from '../../types';

export const parseOFX = async (file: File): Promise<IExtratoBancario> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const content = e.target?.result as string;
            if (!content) {
                reject(new Error('Falha ao ler arquivo'));
                return;
            }

            try {
                const extrato = parseOFXContent(content);
                resolve(extrato);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsText(file);
    });
};

const parseOFXContent = (content: string): IExtratoBancario => {
    // Extração básica de dados usando Regex
    // Nota: Um parser XML completo seria ideal, mas OFX muitas vezes é SGML mal formatado

    const bancoMatch = content.match(/<BANKID>(.*?)(\r|\n|<)/);
    const agenciaMatch = content.match(/<BRANCHID>(.*?)(\r|\n|<)/);
    const contaMatch = content.match(/<ACCTID>(.*?)(\r|\n|<)/);

    // Saldos
    const saldoInicialMatch = content.match(/<LEDGERBAL>[\s\S]*?<BALAMT>(.*?)(\r|\n|<)/);

    // Transações
    const transacoes: ITransacaoBancaria[] = [];
    const transactionRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;

    let match;
    while ((match = transactionRegex.exec(content)) !== null) {
        const block = match[1];

        const idMatch = block.match(/<FITID>(.*?)(\r|\n|<)/);
        const dataMatch = block.match(/<DTPOSTED>(.*?)(\r|\n|<)/);
        const valorMatch = block.match(/<TRNAMT>(.*?)(\r|\n|<)/);
        const memoMatch = block.match(/<MEMO>(.*?)(\r|\n|<)/);
        const typeMatch = block.match(/<TRNTYPE>(.*?)(\r|\n|<)/);

        if (idMatch && dataMatch && valorMatch) {
            const valor = parseFloat(valorMatch[1].replace(',', '.'));
            const dataRaw = dataMatch[1].substring(0, 8); // YYYYMMDD
            const data = `${dataRaw.substring(0, 4)}-${dataRaw.substring(4, 6)}-${dataRaw.substring(6, 8)}`;

            transacoes.push({
                id: idMatch[1].trim(),
                data,
                valor: Math.abs(valor),
                descricao: memoMatch ? memoMatch[1].trim() : 'Sem descrição',
                tipo: valor < 0 ? 'DEBITO' : 'CREDITO',
                status: 'PENDENTE'
            });
        }
    }

    // Calcular saldo final baseado nas transações (simplificação)
    // Em um OFX real, buscaríamos <LEDGERBAL> no final também
    const saldoInicial = saldoInicialMatch ? parseFloat(saldoInicialMatch[1].replace(',', '.')) : 0;
    const totalTransacoes = transacoes.reduce((acc, t) => acc + (t.tipo === 'CREDITO' ? t.valor : -t.valor), 0);

    return {
        banco: bancoMatch ? bancoMatch[1].trim() : 'Desconhecido',
        agencia: agenciaMatch ? agenciaMatch[1].trim() : '',
        conta: contaMatch ? contaMatch[1].trim() : '',
        saldo_inicial: saldoInicial,
        saldo_final: saldoInicial + totalTransacoes,
        transacoes
    };
};
