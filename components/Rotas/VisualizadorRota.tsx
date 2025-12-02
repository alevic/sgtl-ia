import React from 'react';
import { IRota } from '../../types';
import { MapPin, Clock, ArrowRight, Navigation } from 'lucide-react';

interface VisualizadorRotaProps {
    rota: IRota;
    compact?: boolean;
}

export const VisualizadorRota: React.FC<VisualizadorRotaProps> = ({
    rota,
    compact = false
}) => {
    const formatarHorario = (horario?: string) => {
        if (!horario) return '--:--';
        const data = new Date(horario);
        return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatarData = (horario?: string) => {
        if (!horario) return '';
        const data = new Date(horario);
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
            <div className="space-y-3">
                {rota.pontos.map((ponto, index) => (
                    <div key={ponto.id} className="relative">
                        {/* Linha conectora */}
                        {index < rota.pontos.length - 1 && (
                            <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 to-blue-200 dark:from-blue-700 dark:to-blue-800"
                                style={{ height: 'calc(100% + 12px)' }} />
                        )}

                        <div className="flex items-start gap-4 relative z-10">
                            {/* Marcador */}
                            <div className="flex flex-col items-center pt-1">
                                <div className={`w-3 h-3 rounded-full border-2 ${ponto.tipo === 'ORIGEM'
                                    ? 'bg-green-500 border-green-600'
                                    : ponto.tipo === 'DESTINO'
                                        ? 'bg-red-500 border-red-600'
                                        : 'bg-blue-500 border-blue-600'
                                    }`} />
                            </div>

                            {/* Conteúdo */}
                            <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        {/* Tipo e nome */}
                                        <div className="flex items-center gap-2 mb-1">
                                            <MapPin size={16} className={
                                                ponto.tipo === 'ORIGEM'
                                                    ? 'text-green-600'
                                                    : ponto.tipo === 'DESTINO'
                                                        ? 'text-red-600'
                                                        : 'text-blue-600'
                                            } />
                                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                {ponto.nome}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${ponto.tipo === 'ORIGEM'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : ponto.tipo === 'DESTINO'
                                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                }`}>
                                                {ponto.tipo === 'ORIGEM' ? 'Origem' : ponto.tipo === 'DESTINO' ? 'Destino' : 'Parada'}
                                            </span>
                                        </div>

                                        {/* Horários */}
                                        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mt-2">
                                            {ponto.horario_chegada && (
                                                <div className="flex items-center gap-1">
                                                    <Clock size={14} />
                                                    <span>Chegada: <strong>{formatarHorario(ponto.horario_chegada)}</strong></span>
                                                    {formatarData(ponto.horario_chegada) && (
                                                        <span className="text-xs ml-1">({formatarData(ponto.horario_chegada)})</span>
                                                    )}
                                                </div>
                                            )}
                                            {ponto.horario_partida && (
                                                <div className="flex items-center gap-1">
                                                    <Clock size={14} />
                                                    <span>Partida: <strong>{formatarHorario(ponto.horario_partida)}</strong></span>
                                                    {formatarData(ponto.horario_partida) && (
                                                        <span className="text-xs ml-1">({formatarData(ponto.horario_partida)})</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Permissões */}
                                        {ponto.tipo === 'PARADA_INTERMEDIARIA' && (
                                            <div className="flex items-center gap-3 mt-2 text-xs">
                                                {ponto.permite_embarque && (
                                                    <span className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded">
                                                        ✓ Embarque
                                                    </span>
                                                )}
                                                {ponto.permite_desembarque && (
                                                    <span className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded">
                                                        ✓ Desembarque
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Observações */}
                                        {ponto.observacoes && (
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 italic">
                                                {ponto.observacoes}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
