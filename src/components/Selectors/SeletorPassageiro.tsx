import React, { useState } from 'react';
import { ICliente } from '@/types';
import { User, Search, Check } from 'lucide-react';

interface SeletorPassageiroProps {
    clientes: ICliente[];
    clienteSelecionado?: ICliente | null;
    onSelecionarCliente?: (cliente: ICliente | null) => void;
    onNovoCliente?: () => void;
}

export const SeletorPassageiro: React.FC<SeletorPassageiroProps> = ({
    clientes,
    clienteSelecionado,
    onSelecionarCliente,
    onNovoCliente
}) => {
    const [busca, setBusca] = useState('');

    const clientesFiltrados = clientes.filter(c =>
        c.nome.toLowerCase().includes(busca.toLowerCase()) ||
        c.email.toLowerCase().includes(busca.toLowerCase()) ||
        (c.documento || '').includes(busca)
    );

    const handleSelecionarCliente = (cliente: ICliente) => {
        if (onSelecionarCliente) {
            if (clienteSelecionado?.id === cliente.id) {
                onSelecionarCliente(null);
            } else {
                onSelecionarCliente(cliente);
            }
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3">Selecionar Passageiro</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Busque e selecione um passageiro, depois escolha um assento no mapa ao lado</p>
            </div>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nome, email ou documento..."
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                {onNovoCliente && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onNovoCliente();
                        }}
                        title="Cadastrar Novo Cliente"
                        className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-sm transition-colors flex items-center justify-center min-w-[42px]"
                    >
                        <User size={20} />
                        <span className="hidden sm:inline-block ml-2 text-sm font-semibold">Novo</span>
                    </button>
                )}
            </div>
            {clienteSelecionado && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-sm p-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check size={16} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">{clienteSelecionado.nome}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Agora selecione um assento →</p>
                        </div>
                    </div>
                </div>
            )}
            <div className="max-h-96 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-700 rounded-sm p-2">
                {clientesFiltrados.length > 0 ? (
                    clientesFiltrados.map(cliente => {
                        const isSelected = clienteSelecionado?.id === cliente.id;
                        return (
                            <button
                                key={cliente.id}
                                onClick={() => handleSelecionarCliente(cliente)}
                                className={`w-full p-3 rounded-sm border transition-all text-left ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                        {isSelected ? <Check size={16} className="text-white" /> : <User size={16} className="text-slate-600 dark:text-slate-400" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-semibold ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-white'}`}>{cliente.nome}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{cliente.documento} • {cliente.email}</p>
                                    </div>
                                </div>
                            </button>
                        );
                    })
                ) : (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        <User size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhum cliente encontrado</p>
                    </div>
                )}
            </div>
        </div>
    );
};
