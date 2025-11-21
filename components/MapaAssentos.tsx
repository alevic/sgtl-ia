import React, { useState } from 'react';
import { IAssento, IVeiculo, AssentoStatus } from '../types';
import {
    Plus, Trash2, RotateCcw, Save, AlertCircle,
    Armchair, User, XCircle, CheckCircle2
} from 'lucide-react';

interface MapaAssentosProps {
    veiculo: IVeiculo & {
        km_atual?: number;
        ano?: number;
        capacidade_passageiros?: number;
    };
    onSave?: (assentos: IAssento[]) => void;
}

export const MapaAssentos: React.FC<MapaAssentosProps> = ({ veiculo, onSave }) => {
    const [andarAtivo, setAndarAtivo] = useState<1 | 2>(1);
    const [assentos, setAssentos] = useState<IAssento[]>(
        veiculo.mapa_assentos || gerarMapaPadrao(veiculo)
    );
    const [modoEdicao, setModoEdicao] = useState(false);

    const assentosAndarAtual = assentos.filter(a => a.andar === andarAtivo);

    // Encontrar dimensões do grid
    const maxX = Math.max(...assentosAndarAtual.map(a => a.posicao_x), 4);
    const maxY = Math.max(...assentosAndarAtual.map(a => a.posicao_y), 12);

    const handleToggleAssento = (x: number, y: number) => {
        if (!modoEdicao) return;

        const assentoExistente = assentos.find(
            a => a.andar === andarAtivo && a.posicao_x === x && a.posicao_y === y
        );

        if (assentoExistente) {
            // Remove assento
            setAssentos(assentos.filter(a => a.id !== assentoExistente.id));
        } else {
            // Adiciona assento
            const novoNumero = String(assentos.length + 1).padStart(2, '0');
            const novoAssento: IAssento = {
                id: `A${Date.now()}`,
                numero: novoNumero,
                andar: andarAtivo,
                posicao_x: x,
                posicao_y: y,
                tipo: 'CONVENCIONAL',
                status: AssentoStatus.LIVRE
            };
            setAssentos([...assentos, novoAssento]);
        }
    };

    const handleLimparAndar = () => {
        if (confirm(`Deseja limpar todos os assentos do ${andarAtivo === 1 ? 'térreo' : 'andar superior'}?`)) {
            setAssentos(assentos.filter(a => a.andar !== andarAtivo));
        }
    };

    const handleResetarMapa = () => {
        if (confirm('Deseja resetar todo o mapa para o padrão?')) {
            setAssentos(gerarMapaPadrao(veiculo));
        }
    };

    const handleSalvar = () => {
        const totalAssentos = assentos.length;
        const capacidade = veiculo.capacidade_passageiros || 0;

        if (totalAssentos !== capacidade) {
            if (!confirm(
                `Atenção: Você configurou ${totalAssentos} assentos, mas a capacidade cadastrada é ${capacidade}. Deseja salvar mesmo assim?`
            )) {
                return;
            }
        }

        onSave?.(assentos);
        setModoEdicao(false);
        alert('Mapa de assentos salvo com sucesso!');
    };

    const totalAssentosConfigurados = assentos.length;
    const assentosTerreo = assentos.filter(a => a.andar === 1).length;
    const assentosSuperior = assentos.filter(a => a.andar === 2).length;

    return (
        <div className="space-y-6">
            {/* Header com Estatísticas */}
            <div className="flex justify-between items-start">
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Total Configurado</p>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalAssentosConfigurados}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Térreo</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{assentosTerreo}</p>
                    </div>
                    {veiculo.is_double_deck && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                            <p className="text-xs text-purple-700 dark:text-purple-300 mb-1">Superior</p>
                            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{assentosSuperior}</p>
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    {modoEdicao ? (
                        <>
                            <button
                                onClick={() => setModoEdicao(false)}
                                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg font-semibold transition-colors"
                            >
                                <XCircle size={18} className="inline mr-2" />
                                Cancelar
                            </button>
                            <button
                                onClick={handleSalvar}
                                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition-colors"
                            >
                                <Save size={18} className="inline mr-2" />
                                Salvar Mapa
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setModoEdicao(true)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors"
                        >
                            <Plus size={18} className="inline mr-2" />
                            Modo Edição
                        </button>
                    )}
                </div>
            </div>

            {/* Alerta de Validação */}
            {veiculo.capacidade_passageiros && totalAssentosConfigurados !== veiculo.capacidade_passageiros && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle size={20} className="text-orange-600 dark:text-orange-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-1">
                                Atenção: Número de Assentos Divergente
                            </p>
                            <p className="text-sm text-orange-700 dark:text-orange-300">
                                Capacidade cadastrada: <strong>{veiculo.capacidade_passageiros}</strong> |
                                Assentos configurados: <strong>{totalAssentosConfigurados}</strong>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Seletor de Andar (para Double Deck) */}
            {veiculo.is_double_deck && (
                <div className="flex gap-2">
                    <button
                        onClick={() => setAndarAtivo(1)}
                        className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${andarAtivo === 1
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                    >
                        <Armchair size={18} />
                        Térreo ({assentosTerreo} assentos)
                    </button>
                    <button
                        onClick={() => setAndarAtivo(2)}
                        className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${andarAtivo === 2
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                    >
                        <Armchair size={18} />
                        Andar Superior ({assentosSuperior} assentos)
                    </button>
                </div>
            )}

            {/* Grid de Assentos */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="mb-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-green-500 rounded"></div>
                            <span className="text-sm text-slate-600 dark:text-slate-400">Livre</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-red-500 rounded"></div>
                            <span className="text-sm text-slate-600 dark:text-slate-400">Ocupado</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-slate-300 dark:bg-slate-600 rounded"></div>
                            <span className="text-sm text-slate-600 dark:text-slate-400">Vazio (clique para adicionar)</span>
                        </div>
                    </div>

                    {modoEdicao && (
                        <div className="flex gap-2">
                            <button
                                onClick={handleLimparAndar}
                                className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                            >
                                <Trash2 size={14} className="inline mr-1" />
                                Limpar Andar
                            </button>
                            <button
                                onClick={handleResetarMapa}
                                className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded text-sm font-medium hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                            >
                                <RotateCcw size={14} className="inline mr-1" />
                                Resetar Tudo
                            </button>
                        </div>
                    )}
                </div>

                {/* Grid Visual */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border-2 border-dashed border-slate-300 dark:border-slate-600">
                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${maxX + 1}, minmax(0, 1fr))` }}>
                        {Array.from({ length: (maxY + 1) * (maxX + 1) }).map((_, index) => {
                            const y = Math.floor(index / (maxX + 1));
                            const x = index % (maxX + 1);

                            const assento = assentos.find(
                                a => a.andar === andarAtivo && a.posicao_x === x && a.posicao_y === y
                            );

                            const isCorredorCentral = x === Math.floor((maxX + 1) / 2);

                            return (
                                <div
                                    key={`${x}-${y}`}
                                    onClick={() => handleToggleAssento(x, y)}
                                    className={`
                    aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all
                    ${isCorredorCentral
                                            ? 'bg-transparent cursor-default'
                                            : modoEdicao
                                                ? 'cursor-pointer hover:ring-2 hover:ring-blue-400'
                                                : 'cursor-default'
                                        }
                    ${assento
                                            ? assento.status === AssentoStatus.OCUPADO
                                                ? 'bg-red-500 text-white'
                                                : assento.status === AssentoStatus.LIVRE
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-yellow-500 text-white'
                                            : isCorredorCentral
                                                ? ''
                                                : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                                        }
                  `}
                                >
                                    {isCorredorCentral ? (
                                        <span className="text-[10px] text-slate-400">|</span>
                                    ) : assento ? (
                                        <span>{assento.numero}</span>
                                    ) : modoEdicao ? (
                                        <Plus size={14} className="opacity-50" />
                                    ) : (
                                        ''
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Legenda de Frente/Traseira */}
                <div className="mt-4 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>← Traseira</span>
                    <span>Frente →</span>
                </div>
            </div>

            {/* Instruções */}
            {modoEdicao && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                                Modo de Edição Ativo
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Clique nas células vazias para adicionar assentos. Clique nos assentos existentes para removê-los.
                                O corredor central é fixo e não pode ter assentos.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Função auxiliar para gerar mapa padrão
function gerarMapaPadrao(veiculo: IVeiculo & { capacidade_passageiros?: number }): IAssento[] {
    const assentos: IAssento[] = [];
    const capacidade = veiculo.capacidade_passageiros || 46;
    const isDoubleDeck = veiculo.is_double_deck || false;

    // Layout padrão: 4 colunas (2 + corredor + 2), corredor na coluna 2
    const assentosPorAndar = isDoubleDeck ? Math.floor(capacidade / 2) : capacidade;

    const gerarAssentosAndar = (andar: 1 | 2, quantidade: number, offset: number) => {
        let contador = offset;
        let y = 0;

        while (contador < offset + quantidade) {
            // Lado esquerdo (colunas 0 e 1)
            if (contador < offset + quantidade) {
                assentos.push({
                    id: `A${contador + 1}`,
                    numero: String(contador + 1).padStart(2, '0'),
                    andar,
                    posicao_x: 0,
                    posicao_y: y,
                    tipo: 'CONVENCIONAL',
                    status: AssentoStatus.LIVRE
                });
                contador++;
            }

            if (contador < offset + quantidade) {
                assentos.push({
                    id: `A${contador + 1}`,
                    numero: String(contador + 1).padStart(2, '0'),
                    andar,
                    posicao_x: 1,
                    posicao_y: y,
                    tipo: 'CONVENCIONAL',
                    status: AssentoStatus.LIVRE
                });
                contador++;
            }

            // Lado direito (colunas 3 e 4)
            if (contador < offset + quantidade) {
                assentos.push({
                    id: `A${contador + 1}`,
                    numero: String(contador + 1).padStart(2, '0'),
                    andar,
                    posicao_x: 3,
                    posicao_y: y,
                    tipo: 'CONVENCIONAL',
                    status: AssentoStatus.LIVRE
                });
                contador++;
            }

            if (contador < offset + quantidade) {
                assentos.push({
                    id: `A${contador + 1}`,
                    numero: String(contador + 1).padStart(2, '0'),
                    andar,
                    posicao_x: 4,
                    posicao_y: y,
                    tipo: 'CONVENCIONAL',
                    status: AssentoStatus.LIVRE
                });
                contador++;
            }

            y++;
        }
    };

    // Gerar assentos para térreo
    gerarAssentosAndar(1, assentosPorAndar, 0);

    // Gerar assentos para andar superior (se double deck)
    if (isDoubleDeck) {
        gerarAssentosAndar(2, capacidade - assentosPorAndar, assentosPorAndar);
    }

    return assentos;
}
