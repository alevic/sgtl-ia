import React, { useState } from 'react';
import { IClienteCorporativo, ICliente } from '../../types';
import { Building2, Search, Check, DollarSign, User } from 'lucide-react';

// Union type para aceitar ambos os tipos de cliente
export type ClienteFretamento = IClienteCorporativo | ICliente;

interface SeletorClienteProps {
    clientes: ClienteFretamento[];
    clienteSelecionado?: ClienteFretamento | null;
    onSelecionarCliente: (cliente: ClienteFretamento | null) => void;
}

export const SeletorCliente: React.FC<SeletorClienteProps> = ({
    clientes,
    clienteSelecionado,
    onSelecionarCliente
}) => {
    const [busca, setBusca] = useState('');

    // Helper para verificar se é PJ
    const isPJ = (cliente: ClienteFretamento): cliente is IClienteCorporativo => {
        return 'cnpj' in cliente;
    };

    const getNome = (c: ClienteFretamento) => isPJ(c) ? c.razao_social : c.nome;
    const getDocumento = (c: ClienteFretamento) => isPJ(c) ? c.cnpj : c.documento;
    const getContato = (c: ClienteFretamento) => isPJ(c) ? c.contato_nome : c.nome;
    const getEmail = (c: ClienteFretamento) => isPJ(c) ? c.contato_email : c.email;
    const getCredito = (c: ClienteFretamento) => isPJ(c) ? (c.credito_disponivel || 0) : ((c as ICliente).saldo_creditos || 0);

    const clientesFiltrados = clientes.filter(c => {
        const termo = busca.toLowerCase();
        const nome = getNome(c) || '';
        const documento = getDocumento(c) || '';
        const contato = getContato(c) || '';
        const email = getEmail(c) || '';

        return (
            nome.toLowerCase().includes(termo) ||
            documento.toLowerCase().includes(termo) ||
            contato.toLowerCase().includes(termo) ||
            email.toLowerCase().includes(termo)
        );
    });

    const handleSelecionarCliente = (cliente: ClienteFretamento) => {
        if (clienteSelecionado?.id === cliente.id) {
            onSelecionarCliente(null);
        } else {
            onSelecionarCliente(cliente);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Selecione o Cliente *
                </label>
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por Nome, Razão Social, Documento..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="w-full pl-10 pr-4 h-14 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Lista de Clientes */}
            <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-700 rounded-sm p-2">
                {clientesFiltrados.length > 0 ? (
                    clientesFiltrados.map((cliente) => {
                        const isSelected = clienteSelecionado?.id === cliente.id;
                        const ehPJ = isPJ(cliente);

                        return (
                            <button
                                key={cliente.id}
                                onClick={() => handleSelecionarCliente(cliente)}
                                className={`w-full p-3 rounded-sm border transition-all text-left ${isSelected
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isSelected
                                        ? 'bg-blue-600'
                                        : 'bg-slate-200 dark:bg-slate-700'
                                        }`}>
                                        {isSelected ? (
                                            <Check size={16} className="text-white" />
                                        ) : (
                                            ehPJ ?
                                                <Building2 size={16} className="text-slate-600 dark:text-slate-400" /> :
                                                <User size={16} className="text-slate-600 dark:text-slate-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className={`font-semibold ${isSelected
                                                ? 'text-blue-700 dark:text-blue-300'
                                                : 'text-slate-800 dark:text-white'
                                                }`}>
                                                {getNome(cliente)}
                                            </p>
                                            <div className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">
                                                <DollarSign size={12} />
                                                {getCredito(cliente).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                            {ehPJ ? 'CNPJ' : 'Doc'}: {getDocumento(cliente)} • {ehPJ ? 'Contato: ' + getContato(cliente) : getEmail(cliente)}
                                        </p>
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
