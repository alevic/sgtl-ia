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
        if (assento.status === AssentoStatus.BLOQUEADO || assento.disabled) return 'bloqueado';
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
        <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-6 border border-slate-100 dark:border-slate-700 max-w-md mx-auto">
            <div className="border border-slate-100 dark:border-slate-700 rounded-xl p-6 bg-slate-50/50 dark:bg-slate-800/50">
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

                {/* Frente do ônibus - Agora dentro da estrutura para alinhar com o grid */}
                <div className="flex flex-col items-center mb-6">
                    <div className="w-20 h-2 bg-slate-300 dark:bg-slate-600 rounded-full mb-1 opacity-50"></div>
                    <div className="w-16 h-8 bg-slate-200 dark:bg-slate-700/50 rounded-lg flex items-center justify-center border border-slate-300/50 dark:border-slate-600/50">
                        <BusIcon size={18} className="text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">
                        Frente do Ônibus
                    </p>
                </div>

                {/* Grid de assentos */}
                <div className="flex justify-center mb-8 overflow-x-auto pb-2">
                    <div
                        className="grid gap-y-2 gap-x-2"
                        style={{
                            gridTemplateColumns: `repeat(${allX.length + 1}, auto)`,
                            justifyContent: 'center'
                        }}
                    >
                        {Array.from({ length: maxY + 1 }).map((_, y) => {
                            // Determine a posição do corredor.
                            // Se o número de colunas de assento for ímpar, o corredor fica no meio.
                            // Se for par, ele fica após a primeira metade.
                            const corridorIdx = Math.ceil(allX.length / 2);

                            return (
                                <React.Fragment key={y}>
                                    {Array.from({ length: allX.length + 1 }).map((_, i) => {
                                        // Corredor
                                        if (i === corridorIdx) {
                                            return (
                                                <div key={`cor-${y}-${i}`} className="w-8 h-12 flex items-center justify-center">
                                                    <span className="text-slate-300 dark:text-slate-600 font-bold text-xs">
                                                        {y + 1}
                                                    </span>
                                                </div>
                                            );
                                        }

                                        // Assento
                                        // Ajusta o índice 'i' para corresponder ao 'allX' real, considerando o corredor
                                        const xIdx = i < corridorIdx ? i : i - 1;
                                        const xVal = allX[xIdx];
                                        const assento = assentosPorAndar.find(a => a.posicao_y === y && a.posicao_x === xVal);

                                        if (!assento) {
                                            return <div key={`empty-${y}-${i}`} className="w-12 h-12"></div>;
                                        }

                                        const status = getAssentoStatus(assento);
                                        const style = SEAT_STYLES[assento.tipo] || { icon: Circle, label: assento.tipo };
                                        const Icon = status === 'bloqueado' ? Lock : style.icon;
                                        const preco = getPrecoAssento(assento.tipo);

                                        let buttonClasses = "relative w-12 h-12 rounded-xl transition-all duration-300 border-2 flex flex-col items-center justify-center gap-0.5 group/seat ";
                                        let textClasses = "text-[10px] font-bold ";
                                        let iconClasses = "w-3.5 h-3.5 ";

                                        if (status === 'selecionado') {
                                            buttonClasses += "bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/20 scale-105 z-10 ring-2 ring-blue-400/30";
                                            textClasses += "text-white";
                                            iconClasses += "text-white";
                                        } else if (status === 'reservado') {
                                            buttonClasses += "bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800 cursor-not-allowed";
                                            textClasses += "text-red-700 dark:text-red-400";
                                            iconClasses += "text-red-600 dark:text-red-400";
                                        } else if (status === 'bloqueado') {
                                            buttonClasses += "bg-slate-100 border-slate-200 dark:bg-slate-800 cursor-not-allowed opacity-50";
                                            textClasses += "text-slate-400 dark:text-slate-500";
                                            iconClasses += "text-slate-400 dark:text-slate-500";
                                        } else {
                                            buttonClasses += "bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 cursor-pointer shadow-sm hover:shadow-md active:scale-95";
                                            textClasses += "text-slate-700 dark:text-slate-300 group-hover/seat:text-green-600 dark:group-hover/seat:text-green-400";
                                            iconClasses += "text-slate-400 dark:text-slate-500 group-hover/seat:text-green-500 dark:group-hover/seat:text-green-400";
                                        }

                                        return (
                                            <button
                                                key={assento.id}
                                                onClick={() => handleClickAssento(assento)}
                                                disabled={status === 'reservado' || status === 'bloqueado'}
                                                className={buttonClasses}
                                                title={`${style.label} - R$ ${preco.toFixed(2)}`}
                                            >
                                                <Icon className={iconClasses} />
                                                <span className={textClasses}>
                                                    {status === 'bloqueado' ? '' : assento.numero}
                                                </span>
                                                {status === 'livre' && (
                                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-slate-800"></div>
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
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-4">
                    {/* Grupo Status */}
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 text-center">
                            Status
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-white border border-green-500"></div>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">Disponível</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-blue-600 border border-blue-700"></div>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">Selecionado</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-red-200 border border-red-400 dark:bg-red-900/40 dark:border-red-600"></div>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">Ocupado</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-slate-200 border border-slate-300 dark:bg-slate-700/50 dark:border-slate-600"></div>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">Bloqueado</span>
                            </div>
                        </div>
                    </div>

                    {/* Grupo Categorias */}
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 text-center">
                            Categorias Disponíveis
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            {tiposPresentes.map(tipo => {
                                const style = SEAT_STYLES[tipo] || { icon: Circle, label: tipo };
                                const Icon = style.icon;
                                return (
                                    <div key={tipo} className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded border border-green-500 bg-white dark:bg-slate-800 flex items-center justify-center">
                                            <Icon className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                                        </div>
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                            {style.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

