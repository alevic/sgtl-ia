import React, { useState } from 'react';
import { IAssento, IVeiculo, TipoAssento, AssentoStatus } from '../../types';
import { Bus as BusIcon, X, DollarSign } from 'lucide-react';

interface MapaAssentosReservaProps {
    veiculo: IVeiculo;
    assentosReservados: string[]; // Números dos assentos já reservados
    assentoSelecionado: { numero: string; tipo: TipoAssento; valor: number } | null;
    onSelecionarAssento: (assento: { numero: string; tipo: TipoAssento; valor: number } | null) => void;
}

export const MapaAssentosReserva: React.FC<MapaAssentosReservaProps> = ({
    veiculo,
    assentosReservados,
    assentoSelecionado,
    onSelecionarAssento
}) => {
    const [andarAtivo, setAndarAtivo] = useState<1 | 2>(1);

    const assentos = veiculo.mapa_assentos || [];
    const precos = veiculo.precos_assentos || {};

    // Verificar se tem preços configurados
    const temPrecos = Object.keys(precos).length > 0;

    const SEAT_COLORS: Record<TipoAssento, string> = {
        [TipoAssento.CONVENCIONAL]: 'bg-white dark:bg-slate-700',
        [TipoAssento.EXECUTIVO]: 'bg-blue-50 dark:bg-blue-900/20',
        [TipoAssento.SEMI_LEITO]: 'bg-green-50 dark:bg-green-900/20',
        [TipoAssento.LEITO]: 'bg-purple-50 dark:bg-purple-900/20',
        [TipoAssento.CAMA]: 'bg-orange-50 dark:bg-orange-900/20',
        [TipoAssento.CAMA_MASTER]: 'bg-rose-50 dark:bg-rose-900/20',
    };

    const SEAT_BORDER_COLORS: Record<TipoAssento, string> = {
        [TipoAssento.CONVENCIONAL]: 'border-slate-300 dark:border-slate-600',
        [TipoAssento.EXECUTIVO]: 'border-blue-300 dark:border-blue-700',
        [TipoAssento.SEMI_LEITO]: 'border-green-300 dark:border-green-700',
        [TipoAssento.LEITO]: 'border-purple-300 dark:border-purple-700',
        [TipoAssento.CAMA]: 'border-orange-300 dark:border-orange-700',
        [TipoAssento.CAMA_MASTER]: 'border-rose-300 dark:border-rose-700',
    };

    const getPrecoAssento = (tipo: TipoAssento): number => {
        return precos[tipo] || 0;
    };

    const handleClickAssento = (assento: IAssento) => {
        // Verificar se está reservado
        if (assentosReservados.includes(assento.numero)) {
            return;
        }

        // Se clicou no mesmo assento, desseleciona
        if (assentoSelecionado?.numero === assento.numero) {
            onSelecionarAssento(null);
            return;
        }

        // Seleciona novo assento
        onSelecionarAssento({
            numero: assento.numero,
            tipo: assento.tipo,
            valor: getPrecoAssento(assento.tipo)
        });
    };

    const getAssentoStatus = (assento: IAssento): 'livre' | 'reservado' | 'selecionado' => {
        if (assentoSelecionado?.numero === assento.numero) return 'selecionado';
        if (assentosReservados.includes(assento.numero)) return 'reservado';
        return 'livre';
    };

    const assentosPorAndar = assentos.filter(a => a.andar === andarAtivo);

    // Organizar assentos em grid
    const maxY = Math.max(...assentosPorAndar.map(a => a.posicao_y), 0);
    const maxX = Math.max(...assentosPorAndar.map(a => a.posicao_x), 0);

    const grid: (IAssento | 'corredor' | null)[][] = [];
    for (let y = 0; y <= maxY; y++) {
        const row: (IAssento | 'corredor' | null)[] = [];
        for (let x = 0; x <= maxX; x++) {
            const assento = assentosPorAndar.find(a => a.posicao_y === y && a.posicao_x === x);
            if (assento) {
                row.push(assento);
            } else if (x === Math.floor(maxX / 2)) {
                row.push('corredor');
            } else {
                row.push(null);
            }
        }
        grid.push(row);
    }

    if (!veiculo.mapa_configurado || assentos.length === 0) {
        return (
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-8 text-center border border-slate-200 dark:border-slate-700">
                <BusIcon size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                <p className="text-slate-500 dark:text-slate-400 mb-2">
                    Mapa de assentos não configurado para este veículo.
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                    Configure o mapa na página de detalhes do veículo.
                </p>
            </div>
        );
    }

    if (!temPrecos) {
        return (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-6 border border-amber-200 dark:border-amber-800">
                <p className="text-amber-800 dark:text-amber-300 mb-2 font-medium">
                    ⚠️ Preços não configurados
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                    Configure os preços por tipo de assento na página do veículo antes de criar reservas.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Tabs para andares (se double deck) */}
            {veiculo.is_double_deck && (
                <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
                    <button
                        onClick={() => setAndarAtivo(1)}
                        className={`px-4 py-2 font-medium transition-colors border-b-2 ${andarAtivo === 1
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        Térreo
                    </button>
                    <button
                        onClick={() => setAndarAtivo(2)}
                        className={`px-4 py-2 font-medium transition-colors border-b-2 ${andarAtivo === 2
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        Superior
                    </button>
                </div>
            )}

            {/* Legenda */}
            <div className="flex flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded border-2 border-slate-300 bg-white dark:bg-slate-700"></div>
                    <span className="text-slate-600 dark:text-slate-400">Livre</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded border-2 border-red-400 bg-red-100 dark:bg-red-900/30"></div>
                    <span className="text-slate-600 dark:text-slate-400">Reservado</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded border-2 border-blue-500 bg-blue-200 dark:bg-blue-600"></div>
                    <span className="text-slate-600 dark:text-slate-400">Selecionado</span>
                </div>
            </div>

            {/* Frente do ônibus */}
            <div className="text-center">
                <div className="inline-block px-6 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg">
                    <p className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <BusIcon size={20} />
                        Frente do Ônibus
                    </p>
                </div>
            </div>

            {/* Grid de assentos */}
            <div className="overflow-x-auto pb-4">
                <div className="space-y-3 min-w-max flex flex-col items-center">
                    {grid.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex items-center gap-3">
                            {row.map((cell, colIndex) => {
                                if (cell === 'corredor') {
                                    return (
                                        <div key={colIndex} className="w-12 h-12 flex items-center justify-center">
                                            <div className="w-full h-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-800/30 border-x-2 border-dashed border-slate-200 dark:border-slate-700 rounded-sm">
                                                <span className="text-[9px] text-slate-300 dark:text-slate-600 font-bold tracking-widest rotate-90 select-none whitespace-nowrap">
                                                    CORREDOR
                                                </span>
                                            </div>
                                        </div>
                                    );
                                }

                                if (!cell) {
                                    return <div key={colIndex} className="w-12 h-12"></div>;
                                }

                                const assento = cell as IAssento;
                                const status = getAssentoStatus(assento);
                                const preco = getPrecoAssento(assento.tipo);

                                return (
                                    <button
                                        key={colIndex}
                                        onClick={() => handleClickAssento(assento)}
                                        disabled={status === 'reservado'}
                                        className={`relative w-12 h-12 rounded-lg transition-all duration-200 border-2 shadow-sm flex flex-col items-center justify-center ${status === 'selecionado'
                                            ? 'border-blue-500 bg-blue-200 dark:bg-blue-600 ring-2 ring-blue-400 scale-105'
                                            : status === 'reservado'
                                                ? 'border-red-400 bg-red-100 dark:bg-red-900/30 cursor-not-allowed opacity-50'
                                                : `${SEAT_COLORS[assento.tipo]} ${SEAT_BORDER_COLORS[assento.tipo]} hover:ring-2 hover:ring-blue-400 cursor-pointer`
                                            }`}
                                    >
                                        <span className={`text-xs font-bold ${status === 'selecionado'
                                            ? 'text-white'
                                            : 'text-slate-700 dark:text-slate-200'
                                            }`}>
                                            {assento.numero}
                                        </span>
                                        {preco > 0 && (
                                            <span className={`text-[9px] font-medium ${status === 'selecionado'
                                                ? 'text-white'
                                                : 'text-slate-500 dark:text-slate-400'
                                                }`}>
                                                R$ {preco}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Informação do assento selecionado */}
            {assentoSelecionado && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-1">
                                Assento Selecionado
                            </p>
                            <p className="font-bold text-slate-800 dark:text-white text-lg">
                                {assentoSelecionado.numero}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                {assentoSelecionado.tipo.replace('_', ' ')}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-1 text-green-700 dark:text-green-400">
                                <DollarSign size={18} />
                                <span className="text-2xl font-bold">
                                    {assentoSelecionado.valor.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => onSelecionarAssento(null)}
                        className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                        <X size={14} />
                        Limpar seleção
                    </button>
                </div>
            )}
        </div>
    );
};
