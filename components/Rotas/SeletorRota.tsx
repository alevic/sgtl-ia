import React, { useState, useMemo } from 'react';
import { Search, X, MapPin, Clock } from 'lucide-react';
import { IRota } from '../../types';
import { VisualizadorRota } from './VisualizadorRota';

interface SeletorRotaProps {
    rotas: IRota[];
    tipoFiltro: 'IDA' | 'VOLTA';
    rotaSelecionada?: IRota | null;
    onChange: (rota: IRota | null) => void;
}

export const SeletorRota: React.FC<SeletorRotaProps> = ({
    rotas,
    tipoFiltro,
    rotaSelecionada,
    onChange
}) => {
    const [busca, setBusca] = useState('');

    // Filtrar rotas por tipo e busca
    const rotasFiltradas = useMemo(() => {
        return rotas.filter(rota => {
            // Filtrar por tipo
            if (rota.tipo_rota !== tipoFiltro) return false;

            // Filtrar apenas rotas ativas
            if (!rota.ativa) return false;

            // Filtrar por busca
            if (busca.trim()) {
                const termoBusca = busca.toLowerCase();
                const origem = rota.pontos[0]?.nome.toLowerCase() || '';
                const destino = rota.pontos[rota.pontos.length - 1]?.nome.toLowerCase() || '';
                const nomeRota = rota.nome?.toLowerCase() || '';

                return origem.includes(termoBusca) ||
                    destino.includes(termoBusca) ||
                    nomeRota.includes(termoBusca);
            }

            return true;
        });
    }, [rotas, tipoFiltro, busca]);

    const handleSelecionar = (rota: IRota) => {
        if (rotaSelecionada?.id === rota.id) {
            onChange(null); // Desselecionar se clicar na mesma
        } else {
            onChange(rota);
        }
    };

    const limparSelecao = () => {
        onChange(null);
    };

    return (
        <div className="space-y-3">
            {/* Busca */}
            <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar por origem, destino ou nome..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
            </div>

            {/* Lista de rotas */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                {rotasFiltradas.length === 0 ? (
                    <div className="p-8 text-center">
                        <MapPin size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            {busca ? 'Nenhuma rota encontrada' : `Nenhuma rota de ${tipoFiltro} disponível`}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                            Cadastre rotas em "Rotas" no menu lateral
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-700 max-h-80 overflow-y-auto">
                        {rotasFiltradas.map((rota) => {
                            const estaSelecionada = rotaSelecionada?.id === rota.id;
                            const origem = rota.pontos[0];
                            const destino = rota.pontos[rota.pontos.length - 1];
                            const numParadas = rota.pontos.length - 2;

                            return (
                                <div
                                    key={rota.id}
                                    onClick={() => handleSelecionar(rota)}
                                    className={`p-4 cursor-pointer transition-colors ${estaSelecionada
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            {/* Nome da rota */}
                                            <h4 className={`font-semibold mb-1 truncate ${estaSelecionada
                                                    ? 'text-blue-700 dark:text-blue-400'
                                                    : 'text-slate-700 dark:text-slate-300'
                                                }`}>
                                                {rota.nome || `${origem?.nome} → ${destino?.nome}`}
                                            </h4>

                                            {/* Origem e Destino */}
                                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                                                <MapPin size={12} />
                                                <span className="truncate">
                                                    {origem?.nome} → {destino?.nome}
                                                </span>
                                            </div>

                                            {/* Informações adicionais */}
                                            <div className="flex flex-wrap gap-2 text-xs">
                                                {numParadas > 0 && (
                                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
                                                        {numParadas} parada{numParadas > 1 ? 's' : ''}
                                                    </span>
                                                )}
                                                {rota.duracao_estimada_minutos && (
                                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded flex items-center gap-1">
                                                        <Clock size={10} />
                                                        {Math.floor(rota.duracao_estimada_minutos / 60)}h{rota.duracao_estimada_minutos % 60}min
                                                    </span>
                                                )}
                                                {rota.distancia_total_km && (
                                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
                                                        {rota.distancia_total_km} km
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Radio button visual */}
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${estaSelecionada
                                                ? 'border-blue-600 bg-blue-600'
                                                : 'border-slate-300 dark:border-slate-600'
                                            }`}>
                                            {estaSelecionada && (
                                                <div className="w-2 h-2 rounded-full bg-white"></div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer com ação de limpar */}
            {rotaSelecionada && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                                Rota selecionada
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                                {rotaSelecionada.nome || `${rotaSelecionada.pontos[0]?.nome} → ${rotaSelecionada.pontos[rotaSelecionada.pontos.length - 1]?.nome}`}
                            </p>
                        </div>
                        <button
                            onClick={limparSelecao}
                            className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors flex items-center gap-1"
                        >
                            <X size={14} />
                            Limpar
                        </button>
                    </div>
                </div>
            )}

            {/* Preview da rota selecionada */}
            {rotaSelecionada && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    <div className="bg-slate-50 dark:bg-slate-900 px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Preview da Rota
                        </h4>
                    </div>
                    <div className="p-4">
                        <VisualizadorRota rota={rotaSelecionada} compact={false} />
                    </div>
                </div>
            )}
        </div>
    );
};
