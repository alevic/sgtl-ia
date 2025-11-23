import { IRota, IPontoRota, IViagem } from '../types';

/**
 * Valida se uma rota está corretamente configurada
 */
export function validarRota(rota: IRota): { valida: boolean; erros: string[] } {
    const erros: string[] = [];

    // Verificar se tem pelo menos 2 pontos (origem e destino)
    if (!rota.pontos || rota.pontos.length < 2) {
        erros.push('A rota deve ter pelo menos uma origem e um destino');
        return { valida: false, erros };
    }

    // Verificar se o primeiro ponto é ORIGEM
    if (rota.pontos[0].tipo !== 'ORIGEM') {
        erros.push('O primeiro ponto da rota deve ser do tipo ORIGEM');
    }

    // Verificar se o último ponto é DESTINO
    const ultimoPonto = rota.pontos[rota.pontos.length - 1];
    if (ultimoPonto.tipo !== 'DESTINO') {
        erros.push('O último ponto da rota deve ser do tipo DESTINO');
    }

    // Verificar se os pontos intermediários têm tipo correto
    for (let i = 1; i < rota.pontos.length - 1; i++) {
        if (rota.pontos[i].tipo !== 'PARADA_INTERMEDIARIA') {
            erros.push(`O ponto #${i + 1} deve ser do tipo PARADA_INTERMEDIARIA`);
        }
    }

    // Verificar se todos os pontos têm nome
    rota.pontos.forEach((ponto, idx) => {
        if (!ponto.nome || ponto.nome.trim() === '') {
            erros.push(`O ponto #${idx + 1} deve ter um nome`);
        }
    });

    // Verificar ordem dos horários
    if (!validarOrdemHorarios(rota.pontos)) {
        erros.push('Os horários dos pontos devem estar em ordem cronológica');
    }

    return {
        valida: erros.length === 0,
        erros
    };
}

/**
 * Valida se os horários dos pontos estão em ordem cronológica
 */
export function validarOrdemHorarios(pontos: IPontoRota[]): boolean {
    for (let i = 0; i < pontos.length - 1; i++) {
        const pontoAtual = pontos[i];
        const proximoPonto = pontos[i + 1];

        // Usar horário de partida do ponto atual (ou chegada se não tiver partida)
        const horarioAtual = pontoAtual.horario_partida || pontoAtual.horario_chegada;

        // Usar horário de chegada do próximo ponto (ou partida se não tiver chegada)
        const proximoHorario = proximoPonto.horario_chegada || proximoPonto.horario_partida;

        if (horarioAtual && proximoHorario) {
            const dataAtual = new Date(horarioAtual);
            const dataProxima = new Date(proximoHorario);

            if (dataAtual >= dataProxima) {
                return false;
            }
        }
    }

    return true;
}

/**
 * Calcula a duração estimada da rota em minutos
 */
export function calcularDuracaoRota(pontos: IPontoRota[]): number {
    if (pontos.length < 2) return 0;

    const origem = pontos[0];
    const destino = pontos[pontos.length - 1];

    const horarioInicio = origem.horario_partida || origem.horario_chegada;
    const horarioFim = destino.horario_chegada || destino.horario_partida;

    if (!horarioInicio || !horarioFim) return 0;

    const dataInicio = new Date(horarioInicio);
    const dataFim = new Date(horarioFim);

    const diferencaMs = dataFim.getTime() - dataInicio.getTime();
    return Math.round(diferencaMs / (1000 * 60)); // Converter para minutos
}

/**
 * Gera um nome descritivo para a rota baseado nos pontos
 */
export function gerarNomeRota(pontos: IPontoRota[]): string {
    if (pontos.length < 2) return '';

    const origem = pontos[0].nome;
    const destino = pontos[pontos.length - 1].nome;

    if (pontos.length === 2) {
        return `${origem} → ${destino}`;
    }

    const paradas = pontos.slice(1, pontos.length - 1);
    const nomeParadas = paradas.map(p => p.nome).join(', ');

    return `${origem} → ${destino} (via ${nomeParadas})`;
}

/**
 * Calcula os campos derivados da viagem baseado nas rotas configuradas
 * (origem, destino, datas, paradas) quando o sistema de rotas está ativo
 */
export function calcularCamposViagem(viagem: IViagem): IViagem {
    if (!viagem.usa_sistema_rotas) {
        return viagem;
    }

    const viagemAtualizada = { ...viagem };

    // Determinar qual rota usar para sincronização baseado no tipo de viagem
    let rotaPrincipal: IRota | undefined;

    if (viagem.tipo_viagem === 'IDA' || viagem.tipo_viagem === 'IDA_E_VOLTA') {
        rotaPrincipal = viagem.rota_ida;
    } else if (viagem.tipo_viagem === 'VOLTA') {
        rotaPrincipal = viagem.rota_volta;
    }

    if (rotaPrincipal && rotaPrincipal.pontos.length >= 2) {
        // Origem = primeiro ponto da rota
        viagemAtualizada.origem = rotaPrincipal.pontos[0].nome;

        // Destino = último ponto da rota
        viagemAtualizada.destino = rotaPrincipal.pontos[rotaPrincipal.pontos.length - 1].nome;

        // Paradas = pontos intermediários convertidos para IParada
        viagemAtualizada.paradas = rotaPrincipal.pontos
            .slice(1, -1) // Pegar apenas pontos intermediários
            .map(ponto => ({
                id: ponto.id,
                nome: ponto.nome,
                horario_chegada: ponto.horario_chegada || '',
                horario_partida: ponto.horario_partida || '',
                tipo: ponto.permite_embarque && ponto.permite_desembarque
                    ? 'EMBARQUE' as const
                    : ponto.permite_embarque
                        ? 'EMBARQUE' as const
                        : 'DESEMBARQUE' as const
            }));
    }

    return viagemAtualizada;
}

/**
 * Cria um ponto de rota vazio
 */
export function criarPontoRotaVazio(tipo: 'ORIGEM' | 'PARADA_INTERMEDIARIA' | 'DESTINO', ordem: number): IPontoRota {
    return {
        id: `ponto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        nome: '',
        ordem,
        tipo,
        permite_embarque: tipo !== 'DESTINO',
        permite_desembarque: tipo !== 'ORIGEM',
        observacoes: ''
    };
}

/**
 * Cria uma rota vazia
 */
export function criarRotaVazia(tipo: 'IDA' | 'VOLTA'): IRota {
    return {
        id: `rota_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tipo_rota: tipo,
        pontos: [
            criarPontoRotaVazio('ORIGEM', 0),
            criarPontoRotaVazio('DESTINO', 1)
        ],
        ativa: true
    };
}
