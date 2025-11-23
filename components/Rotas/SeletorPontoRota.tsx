import React from 'react';
import { IPontoRota } from '../../types';
import { MapPin, Clock, CheckSquare } from 'lucide-react';

interface SeletorPontoRotaProps {
    ponto: IPontoRota;
    onChange: (ponto: IPontoRota) => void;
    readonly?: boolean;
}

export const SeletorPontoRota: React.FC<SeletorPontoRotaProps> = ({
    ponto,
    onChange,
    readonly = false
}) => {
    const handleChange = (campo: keyof IPontoRota, valor: any) => {
        onChange({ ...ponto, [campo]: valor });
    };

    const getTipoLabel = () => {
        switch (ponto.tipo) {
            case 'ORIGEM': return 'Origem';
            case 'DESTINO': return 'Destino';
            case 'PARADA_INTERMEDIARIA': return 'Parada';
            default: return ponto.tipo;
        }
    };

    const getTipoColor = () => {
        switch (ponto.tipo) {
            case 'ORIGEM': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
            case 'DESTINO': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
            case 'PARADA_INTERMEDIARIA': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
            default: return 'text-slate-600 bg-slate-50';
        }
    };

    return (
        <div className="space-y-4">
            {/* Tipo do Ponto */}
            <div className="flex items-center gap-2">
                <MapPin size={18} className={ponto.tipo === 'ORIGEM' ? 'text-green-600' : ponto.tipo === 'DESTINO' ? 'text-red-600' : 'text-blue-600'} />
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getTipoColor()}`}>
                    {getTipoLabel()}
                </span>
            </div>

            {/* Nome do Local */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Cidade / Local
                </label>
                <input
                    type="text"
                    value={ponto.nome}
                    onChange={(e) => handleChange('nome', e.target.value)}
                    placeholder="Ex: São Paulo, SP"
                    disabled={readonly}
                    className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
            </div>

            {/* Horários */}
            <div className="grid grid-cols-2 gap-3">
                {/* Horário de Chegada (não para origem) */}
                {ponto.tipo !== 'ORIGEM' && (
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                            <Clock size={14} />
                            Chegada
                        </label>
                        <input
                            type="datetime-local"
                            value={ponto.horario_chegada || ''}
                            onChange={(e) => handleChange('horario_chegada', e.target.value)}
                            disabled={readonly}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50"
                        />
                    </div>
                )}

                {/* Horário de Partida (não para destino) */}
                {ponto.tipo !== 'DESTINO' && (
                    <div className={ponto.tipo === 'ORIGEM' ? 'col-span-2' : ''}>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                            <Clock size={14} />
                            Partida
                        </label>
                        <input
                            type="datetime-local"
                            value={ponto.horario_partida || ''}
                            onChange={(e) => handleChange('horario_partida', e.target.value)}
                            disabled={readonly}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50"
                        />
                    </div>
                )}
            </div>

            {/* Permissões de Embarque/Desembarque (apenas para paradas intermediárias) */}
            {ponto.tipo === 'PARADA_INTERMEDIARIA' && (
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Operações Permitidas
                    </label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={ponto.permite_embarque}
                                onChange={(e) => handleChange('permite_embarque', e.target.checked)}
                                disabled={readonly}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                <CheckSquare size={16} className="text-green-600" />
                                Permite Embarque
                            </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={ponto.permite_desembarque}
                                onChange={(e) => handleChange('permite_desembarque', e.target.checked)}
                                disabled={readonly}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                <CheckSquare size={16} className="text-red-600" />
                                Permite Desembarque
                            </span>
                        </label>
                    </div>
                </div>
            )}

            {/* Observações */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Observações (opcional)
                </label>
                <textarea
                    value={ponto.observacoes || ''}
                    onChange={(e) => handleChange('observacoes', e.target.value)}
                    placeholder="Ex: Terminal Rodoviário Central"
                    disabled={readonly}
                    rows={2}
                    className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50"
                />
            </div>
        </div>
    );
};
