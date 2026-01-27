import React, { useState, useMemo } from 'react';
import { Search, X, Check, Users } from 'lucide-react';

export interface IMotoristaSelector {
    id: string;
    nome: string;
    cnh?: string;
    categoria_cnh?: string;
    status?: string;
}

interface SeletorMotoristaMultiploProps {
    motoristas: IMotoristaSelector[];
    selecionados: string[];
    onChange: (ids: string[]) => void;
    maxHeight?: string;
}

export const SeletorMotoristaMultiplo: React.FC<SeletorMotoristaMultiploProps> = ({
    motoristas,
    selecionados,
    onChange,
    maxHeight = '400px'
}) => {
    const [busca, setBusca] = useState('');

    const motoristasFiltrados = useMemo(() => {
        if (!busca.trim()) return motoristas;
        const termoBusca = busca.toLowerCase();
        return motoristas.filter(m =>
            m.nome.toLowerCase().includes(termoBusca) ||
            m.cnh?.toLowerCase().includes(termoBusca) ||
            m.categoria_cnh?.toLowerCase().includes(termoBusca)
        );
    }, [motoristas, busca]);

    const handleToggle = (id: string) => {
        if (selecionados.includes(id)) {
            onChange(selecionados.filter(selectedId => selectedId !== id));
        } else {
            onChange([...selecionados, id]);
        }
    };

    const handleToggleTodos = () => {
        if (selecionados.length === motoristas.length) {
            onChange([]);
        } else {
            onChange(motoristas.map(m => m.id));
        }
    };

    const limparSelecao = () => onChange([]);

    const todosSelecionados = selecionados.length === motoristas.length && motoristas.length > 0;
    const algunsSelecionados = selecionados.length > 0 && !todosSelecionados;

    return (
        <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                    placeholder="Buscar motorista..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
            </div>

            {/* Header com contador e ações */}
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={todosSelecionados}
                            ref={input => {
                                if (input) input.indeterminate = algunsSelecionados;
                            }}
                            onChange={handleToggleTodos}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="font-medium text-slate-700 dark:text-slate-300">Selecionar todos</span>
                    </label>
                    {selecionados.length > 0 && (
                        <button
                            onClick={limparSelecao}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1"
                        >
                            <X size={14} />
                            Limpar
                        </button>
                    )}
                </div>
                <span className="text-slate-500 dark:text-slate-400">{selecionados.length} de {motoristas.length}</span>
            </div>

            {/* Lista de motoristas */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-y-auto" style={{ maxHeight }}>
                {motoristasFiltrados.length === 0 ? (
                    <div className="p-8 text-center">
                        <Users size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            {busca ? 'Nenhum motorista encontrado' : 'Nenhum motorista disponível'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {motoristasFiltrados.map(motorista => {
                            const estaSelecionado = selecionados.includes(motorista.id);
                            return (
                                <label
                                    key={motorista.id}
                                    className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${estaSelecionado ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={estaSelecionado}
                                            onChange={() => handleToggle(motorista.id)}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        {estaSelecionado && (
                                            <Check
                                                size={12}
                                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white pointer-events-none"
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${estaSelecionado ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>{motorista.nome}</p>
                                        {(motorista.categoria_cnh || motorista.status) && (
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {motorista.categoria_cnh && (
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">CNH: {motorista.categoria_cnh}</span>
                                                )}
                                                {motorista.status && (
                                                    <span className={`text-xs px-1.5 py-0.5 rounded ${motorista.status === 'DISPONIVEL'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>{motorista.status}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer com resumo */}
            {selecionados.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                        <strong>{selecionados.length}</strong> motorista{selecionados.length > 1 ? 's' : ''} selecionado{selecionados.length > 1 ? 's' : ''}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                        {selecionados.slice(0, 3).map(id => {
                            const motorista = motoristas.find(m => m.id === id);
                            return motorista ? (
                                <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-xs">
                                    {motorista.nome}
                                </span>
                            ) : null;
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
