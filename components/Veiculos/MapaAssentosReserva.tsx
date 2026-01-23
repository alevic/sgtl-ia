import React, { useState } from 'react';
import { IAssento, IVeiculo, TipoAssento, AssentoStatus } from '../../types';
import { Bus as BusIcon, Circle, Star, Armchair, Moon, Bed, Crown, Lock } from 'lucide-react';

interface MapaAssentosReservaProps {
    veiculo: IVeiculo;
    assentosReservados: string[]; // Números dos assentos já reservados
    assentosSelecionados: { numero: string; tipo: TipoAssento; valor: number }[];
    onSelecionarAssento: (assento: { numero: string; tipo: TipoAssento; valor: number }) => void;
    precos?: Record<string, number> | Record<TipoAssento, number>; // Preços específicos da viagem
}

export const MapaAssentosReserva: React.FC<MapaAssentosReservaProps> = ({
    veiculo,
    assentosReservados,
    assentosSelecionados,
    onSelecionarAssento,
    precos: precosViagem
}) => {
    const [andarAtivo, setAndarAtivo] = useState<1 | 2>(1);

    const assentos = veiculo.mapa_assentos || [];
    // Use trip prices if available, otherwise vehicle prices
    const precos = precosViagem || veiculo.precos_assentos || {};

    // Verificar se tem preços configurados
    const temPrecos = Object.keys(precos).length > 0;

    // Definição de ícones e labels por tipo de assento
    const SEAT_STYLES: Record<TipoAssento, { icon: React.ElementType; label: string }> = {
        [TipoAssento.CONVENCIONAL]: { icon: Circle, label: 'Convencional' },
        [TipoAssento.EXECUTIVO]: { icon: Star, label: 'Executivo' },
        [TipoAssento.SEMI_LEITO]: { icon: Armchair, label: 'Semi-Leito' },
        [TipoAssento.LEITO]: { icon: Moon, label: 'Leito' },
        [TipoAssento.CAMA]: { icon: Bed, label: 'Cama' },
        [TipoAssento.CAMA_MASTER]: { icon: Crown, label: 'Cama Master' },
        [TipoAssento.BLOQUEADO]: { icon: Armchair, label: 'Bloqueado' },
    };

    const getPrecoAssento = (tipo: TipoAssento): number => {
        return Number((precos && precos[tipo]) || 0);
    };

    const handleClickAssento = (assento: IAssento) => {
        // Verificar se está reservado, bloqueado ou desabilitado
        if (assentosReservados.includes(assento.numero) ||
            assento.status === AssentoStatus.BLOQUEADO ||
            assento.disabled) {
            return;
        }

        // Emite o assento clicado para o pai gerenciar (adicionar/remover)
        onSelecionarAssento({
            numero: assento.numero,
            tipo: assento.tipo,
            valor: getPrecoAssento(assento.tipo)
        });
    };

    const getAssentoStatus = (assento: IAssento): 'livre' | 'reservado' | 'selecionado' | 'bloqueado' => {
        if (assentosSelecionados.some(s => s.numero === assento.numero)) return 'selecionado';
        if (assentosReservados.includes(assento.numero)) return 'reservado';
        if (assento.status === AssentoStatus.BLOQUEADO || assento.disabled || assento.tipo === TipoAssento.BLOQUEADO) return 'bloqueado';
        return 'livre';
    };

    const assentosPorAndar = assentos.filter(a => a.andar === andarAtivo);

    // Identificar tipos de assentos presentes neste andar para a legenda
    const tiposPresentes = Array.from(new Set(assentosPorAndar.map(a => a.tipo))) as TipoAssento[];

    // Identificar os valores únicos de X para mapear as colunas do grid
    const allX = assentosPorAndar
        .map(a => Number(a.posicao_x))
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort((a, b) => a - b);
    const maxY = Math.max(...assentosPorAndar.map(a => Number(a.posicao_y)), 0);


    // Se não tiver assentos, considera não configurado
    if (assentos.length === 0) {
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
        <div className="w-full">
            {/* Tabs para andares (se double deck) */}
            {veiculo.is_double_deck && (
                <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 mb-6 justify-center">
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

            {/* Frente do ônibus */}
            <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-2 bg-slate-300 dark:bg-slate-600 rounded-full mb-1 opacity-50"></div>
                <div className="w-16 h-8 bg-slate-200 dark:bg-slate-700/30 rounded-lg flex items-center justify-center border border-slate-300/30 dark:border-slate-600/30">
                    <BusIcon size={18} className="text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">
                    Frente do Ônibus
                </p>
            </div>

            {/* Grid de assentos */}
            <div className="flex justify-center mb-10 overflow-x-auto">
                <div
                    className="grid gap-y-3 gap-x-3 p-1"
                    style={{
                        gridTemplateColumns: `repeat(${allX.length + 1}, auto)`,
                        justifyContent: 'center',
                        minWidth: 'fit-content'
                    }}
                >
                    {Array.from({ length: maxY + 1 }).map((_, y) => {
                        const corridorIdx = Math.ceil(allX.length / 2);

                        return (
                            <React.Fragment key={y}>
                                {Array.from({ length: allX.length + 1 }).map((_, i) => {
                                    if (i === corridorIdx) {
                                        return (
                                            <div key={`cor-${y}-${i}`} className="w-8 h-12 flex items-center justify-center">
                                                <span className="text-slate-300 dark:text-slate-600 font-bold text-xs">
                                                    {y + 1}
                                                </span>
                                            </div>
                                        );
                                    }

                                    const xIdx = i < corridorIdx ? i : i - 1;
                                    const xVal = allX[xIdx];
                                    const assento = assentosPorAndar.find(a => a.posicao_y === y && a.posicao_x === xVal);

                                    if (!assento) {
                                        return <div key={`empty-${y}-${i}`} className="w-12 h-12"></div>;
                                    }

                                    const status = getAssentoStatus(assento);
                                    const style = SEAT_STYLES[assento.tipo] || { icon: Circle, label: assento.tipo };
                                    const Icon = style.icon;
                                    const preco = getPrecoAssento(assento.tipo);

                                    let buttonClasses = "relative w-12 h-12 rounded-xl transition-all duration-300 border-2 flex flex-col items-center justify-center gap-0.5 group/seat ";
                                    let textClasses = "text-[12px] font-bold ";
                                    let iconClasses = "w-3.5 h-3.5 ";

                                    if (status === 'selecionado') {
                                        buttonClasses += "bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/20 scale-105 z-10 ring-2 ring-blue-400/30";
                                        textClasses += "text-white";
                                        iconClasses += "text-white";
                                    } else if (status === 'reservado') {
                                        buttonClasses += "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800 cursor-not-allowed";
                                        textClasses += "text-red-700 dark:text-red-400";
                                        iconClasses += "text-red-600 dark:text-red-400";
                                    } else if (status === 'bloqueado') {
                                        buttonClasses += "bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 cursor-not-allowed opacity-80";
                                        textClasses += "text-slate-400 dark:text-slate-600";
                                        iconClasses += "text-slate-400 dark:text-slate-600";
                                    } else {
                                        buttonClasses += "bg-white dark:bg-slate-800/20 border-slate-200 dark:border-slate-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 cursor-pointer shadow-sm hover:shadow-md active:scale-95";
                                        textClasses += "text-slate-700 dark:text-slate-300 group-hover/seat:text-green-600 dark:group-hover/seat:text-green-400";
                                        iconClasses += "text-slate-400 dark:text-slate-500 group-hover/seat:text-green-500 dark:group-hover/seat:text-green-400";
                                    }

                                    const isStrangeLabel = assento.numero.startsWith('DISABLED_') || assento.numero.length > 5;

                                    return (
                                        <button
                                            key={assento.id}
                                            onClick={() => handleClickAssento(assento)}
                                            disabled={status === 'reservado' || status === 'bloqueado'}
                                            className={buttonClasses}
                                            title={status === 'bloqueado' ? 'Bloqueado' : `${style.label} - ${status === 'reservado' ? 'Reservado' : `R$ ${preco.toFixed(2)}`}`}
                                        >
                                            {status === 'bloqueado' ? (
                                                <Lock size={16} className="text-slate-400 dark:text-slate-600" />
                                            ) : (
                                                <>
                                                    <Icon className={iconClasses} />
                                                    <span className={textClasses}>
                                                        {isStrangeLabel ? '' : assento.numero}
                                                    </span>
                                                    {status === 'livre' && (
                                                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-slate-800"></div>
                                                    )}
                                                </>
                                            )}
                                        </button>
                                    );
                                })}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Legenda Dinâmica */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-700 space-y-6">
                {/* Grupo Status */}
                <div>
                    <p className="text-[12px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-3 text-center">
                        Legenda
                    </p>
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5 rounded bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 relative">
                                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full border border-white dark:border-slate-800"></div>
                            </div>
                            <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Livre</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5 rounded bg-blue-600 border-2 border-blue-500"></div>
                            <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Selecionado</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5 rounded bg-red-100 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800"></div>
                            <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Ocupado</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5 rounded bg-slate-100 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800"></div>
                            <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Bloqueado</span>
                        </div>
                    </div>
                </div>

                {/* Categorias */}
                <div className="flex flex-wrap justify-center gap-4">
                    {tiposPresentes.map(tipo => {
                        const style = SEAT_STYLES[tipo] || { icon: Circle, label: tipo };
                        const Icon = style.icon;
                        return (
                            <div key={tipo} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-100 dark:border-slate-800">
                                <Icon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                <span className="text-[12px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
                                    {style.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

