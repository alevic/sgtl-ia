import React from 'react';
import { IRota } from '../../types';
import { MapPin, Clock, ArrowRight, Navigation } from 'lucide-react';
import { calcularTemposRelativos } from '../../utils/rotaValidation';

interface VisualizadorRotaProps {
    rota: IRota;
    compact?: boolean;
}

export const VisualizadorRota: React.FC<VisualizadorRotaProps> = ({
    rota,
    compact = false
}) => {
    if (!rota) {
        return (
            <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-8 text-center text-slate-500 dark:text-slate-400">
                Rota não disponível
            </div>
        );
    }

    const formatarHorario = (horario?: string) => {
        if (!horario) return '--:--';
        const data = new Date(horario);
        if (isNaN(data.getTime())) return '--:--';
        return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatarData = (horario?: string) => {
        if (!horario) return '';
        const data = new Date(horario);
        if (isNaN(data.getTime())) return '';
        return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    const duracaoHoras = rota.duracao_estimada_minutos
        ? Math.floor(rota.duracao_estimada_minutos / 60)
        : 0;
    const duracaoMinutos = rota.duracao_estimada_minutos
        ? rota.duracao_estimada_minutos % 60
        : 0;

    if (compact) {
        // Versão compacta: apenas origem → destino com número de paradas
        if (!rota.pontos || rota.pontos.length < 2) {
            return <span className="text-red-500 text-sm">Rota inválida (sem pontos)</span>;
        }

        const origem = rota.pontos[0];
        const destino = rota.pontos[rota.pontos.length - 1];
        const numParadas = rota.pontos.length - 2;

        return (
            <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                        {origem.nome}
                    </span>
                </div>

                <ArrowRight size={16} className="text-slate-400" />

                {numParadas > 0 && (
                    <>
                        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                            {numParadas} parada{numParadas > 1 ? 's' : ''}
                        </span>
                        <ArrowRight size={16} className="text-slate-400" />
                    </>
                )}

                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                        {destino.nome}
                    </span>
                </div>

                {rota.duracao_estimada_minutos && rota.duracao_estimada_minutos > 0 && (
                    <div className="ml-auto flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <Clock size={14} />
                        <span>{duracaoHoras}h {duracaoMinutos}min</span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Navigation size={20} className="text-blue-600" />
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                        {rota.nome || 'Rota'}
                    </h4>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${rota.tipo_rota === 'IDA'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                    }`}>
                    {rota.tipo_rota}
                </span>
            </div>

            {/* Informações gerais */}
            {(rota.duracao_estimada_minutos || rota.distancia_total_km) && (
                <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                    {rota.duracao_estimada_minutos && rota.duracao_estimada_minutos > 0 && (
                        <div className="flex items-center gap-2">
                            <Clock size={16} />
                            <span>{duracaoHoras}h {duracaoMinutos}min</span>
                        </div>
                    )}
                    {rota.distancia_total_km && (
                        <div className="flex items-center gap-2">
                            <Navigation size={16} />
                            <span>{rota.distancia_total_km} km</span>
                        </div>
                    )}
                </div>
            )}

            {/* Timeline de pontos */}
            <div className="relative pl-4 space-y-8">
                {/* Linha vertical contínua */}
                <div className="absolute left-[22px] top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-700" />

                {Array.isArray(rota.pontos) && rota.pontos.map((ponto, index) => {
                    if (!ponto) return null;

                    const isOrigem = ponto.tipo === 'ORIGEM';
                    const isDestino = ponto.tipo === 'DESTINO';

                    // Não mostrar badge se o nome já contiver "Origem" ou "Destino"
                    const showBadge = !ponto.nome.toLowerCase().includes(ponto.tipo.toLowerCase());

                    return (
                        <div key={ponto.id || index} className="relative flex gap-4">
                            {/* Marcador na linha do tempo */}
                            <div className={`relative z-10 flex items-center justify-center w-4 h-4 rounded-full border-2 bg-white dark:bg-slate-800 mt-1.5 ${isOrigem ? 'border-green-500' :
                                isDestino ? 'border-red-500' :
                                    'border-blue-500'
                                }`}>
                                <div className={`w-2 h-2 rounded-full ${isOrigem ? 'bg-green-500' :
                                    isDestino ? 'bg-red-500' :
                                        'bg-blue-500'
                                    }`} />
                            </div>

                            {/* Conteúdo do ponto */}
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-base font-bold text-slate-800 dark:text-slate-200">
                                                {ponto.nome}
                                            </span>
                                            {showBadge && (
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isOrigem ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    isDestino ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                    }`}>
                                                    {isOrigem ? 'Origem' : isDestino ? 'Destino' : 'Parada'}
                                                </span>
                                            )}
                                        </div>

                                        {ponto.observacoes && (
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                {ponto.observacoes}
                                            </p>
                                        )}
                                    </div>

                                    {/* Horários / Tempos Relativos */}
                                    <div className="flex flex-col items-end gap-1 text-sm whitespace-nowrap">
                                        {/* Calcular tempos relativos para exibição */}
                                        {(() => {
                                            // Precisamos calcular aqui pois o objeto rota pode vir cru
                                            const pontosCalculados = calcularTemposRelativos(rota.pontos);
                                            const pontoCalculado = pontosCalculados[index];

                                            // Se tiver horário absoluto legado, mostra ele
                                            if (ponto.horario_chegada || ponto.horario_partida) {
                                                if (ponto.horario_chegada && !ponto.horario_chegada.includes('T')) { // Check integrity
                                                    // ... existing logic fallback ...
                                                }
                                            }

                                            return (
                                                <div className="flex flex-col items-end text-xs text-slate-500 gap-1">
                                                    {isOrigem && <span className="text-green-600 font-medium">Início da viagem</span>}

                                                    {!isOrigem && pontoCalculado.tempo_acumulado_minutos !== undefined && (
                                                        <span className="flex items-center gap-1" title="Tempo após o início">
                                                            <Clock size={12} className="text-slate-400" />
                                                            Chegada: +{Math.floor(pontoCalculado.tempo_acumulado_minutos / 60)}h {pontoCalculado.tempo_acumulado_minutos % 60}min
                                                        </span>
                                                    )}

                                                    {ponto.duracao_parada_minutos ? (
                                                        <span className="text-orange-600 font-medium">
                                                            Parada: {ponto.duracao_parada_minutos} min
                                                        </span>
                                                    ) : null}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Permissões */}
                                {ponto.tipo === 'PARADA_INTERMEDIARIA' && (ponto.permite_embarque || ponto.permite_desembarque) && (
                                    <div className="flex gap-2 mt-2">
                                        {ponto.permite_embarque && (
                                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-green-200 text-green-700 bg-green-50 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
                                                Embarque
                                            </span>
                                        )}
                                        {ponto.permite_desembarque && (
                                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-red-200 text-red-700 bg-red-50 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                                                Desembarque
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
