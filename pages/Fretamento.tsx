import React, { useState } from 'react';
import { IFretamento, IClienteCorporativo, Moeda } from '../types';
import { Bus, Building2, Calendar, DollarSign, FileText, CheckCircle } from 'lucide-react';

const MOCK_CLIENTES: IClienteCorporativo[] = [
    {
        id: '1',
        razao_social: 'Tech Solutions Ltda',
        cnpj: '12.345.678/0001-90',
        contato_nome: 'Roberto Almeida',
        contato_email: 'roberto@techsolutions.com',
        contato_telefone: '(11) 3333-4444',
        credito_disponivel: 50000,
        dia_vencimento_fatura: 10
    }
];

const MOCK_FRETAMENTOS: IFretamento[] = [
    {
        id: '1',
        cliente_corporativo_id: '1',
        veiculo_id: 'V005',
        motorista_id: 'M001',
        origem: 'São Paulo, SP',
        destino: 'Santos, SP',
        data_inicio: '2023-10-20',
        data_fim: '2023-10-20',
        tipo: 'PONTUAL',
        status: 'CONFIRMADO',
        valor_total: 1500.00,
        moeda: Moeda.BRL,
        observacoes: 'Transporte de funcionários para evento corporativo'
    },
    {
        id: '2',
        cliente_corporativo_id: '1',
        origem: 'São Paulo, SP',
        destino: 'Campinas, SP',
        data_inicio: '2023-11-01',
        data_fim: '2024-01-31',
        tipo: 'RECORRENTE',
        status: 'ORCAMENTO_ENVIADO',
        valor_total: 45000.00,
        moeda: Moeda.BRL,
        observacoes: 'Transporte diário de funcionários - Segunda a Sexta'
    }
];

const StatusBadge: React.FC<{ status: IFretamento['status'] }> = ({ status }) => {
    const configs = {
        SOLICITACAO: { color: 'slate', label: 'Solicitação' },
        ORCAMENTO_ENVIADO: { color: 'yellow', label: 'Orçamento Enviado' },
        CONFIRMADO: { color: 'green', label: 'Confirmado' },
        EM_ANDAMENTO: { color: 'blue', label: 'Em Andamento' },
        CONCLUIDO: { color: 'green', label: 'Concluído' },
        CANCELADO: { color: 'red', label: 'Cancelado' }
    };

    const config = configs[status];

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${config.color}-100 dark:bg-${config.color}-900/30 text-${config.color}-700 dark:text-${config.color}-300`}>
            {config.label}
        </span>
    );
};

export const Fretamento: React.FC = () => {
    const [fretamentos] = useState<IFretamento[]>(MOCK_FRETAMENTOS);
    const [clientes] = useState<IClienteCorporativo[]>(MOCK_CLIENTES);

    const getCliente = (clienteId: string) => {
        return clientes.find(c => c.id === clienteId);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Fretamento B2B</h1>
                    <p className="text-slate-500 dark:text-slate-400">Gestão de aluguel de frota para empresas</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2">
                    <FileText size={18} />
                    Nova Solicitação
                </button>
            </div>

            {/* Clientes Corporativos */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Clientes Corporativos</h2>
                <div className="space-y-3">
                    {clientes.map((cliente) => (
                        <div key={cliente.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                    <Building2 size={20} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white">{cliente.razao_social}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        CNPJ: {cliente.cnpj} • {cliente.contato_nome}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500 dark:text-slate-400">Crédito Disponível</p>
                                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                    R$ {cliente.credito_disponivel.toLocaleString('pt-BR')}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Lista de Fretamentos */}
            <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Solicitações de Fretamento</h2>
                <div className="grid gap-4">
                    {fretamentos.map((fretamento) => {
                        const cliente = getCliente(fretamento.cliente_corporativo_id);

                        return (
                            <div key={fretamento.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                                            <Bus size={24} className="text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                                {fretamento.origem} → {fretamento.destino}
                                            </h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{cliente?.razao_social}</p>
                                        </div>
                                    </div>
                                    <StatusBadge status={fretamento.status} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Tipo</p>
                                        <p className="font-semibold text-slate-800 dark:text-white">
                                            {fretamento.tipo === 'PONTUAL' ? 'Pontual' : 'Recorrente'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Data Início</p>
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} className="text-blue-600" />
                                            <p className="font-semibold text-slate-800 dark:text-white">
                                                {new Date(fretamento.data_inicio).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Data Fim</p>
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} className="text-red-600" />
                                            <p className="font-semibold text-slate-800 dark:text-white">
                                                {new Date(fretamento.data_fim).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Valor Total</p>
                                        <div className="flex items-center gap-2">
                                            <DollarSign size={16} className="text-green-600" />
                                            <p className="font-bold text-green-600 dark:text-green-400">
                                                {fretamento.moeda} {fretamento.valor_total.toLocaleString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {fretamento.observacoes && (
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Observações</p>
                                        <p className="text-sm text-slate-700 dark:text-slate-300">{fretamento.observacoes}</p>
                                    </div>
                                )}

                                <div className="flex gap-2 mt-4">
                                    {fretamento.status === 'SOLICITACAO' && (
                                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors">
                                            Enviar Orçamento
                                        </button>
                                    )}
                                    {fretamento.status === 'ORCAMENTO_ENVIADO' && (
                                        <button className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                                            <CheckCircle size={16} />
                                            Confirmar Fretamento
                                        </button>
                                    )}
                                    <button className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold transition-colors">
                                        Ver Detalhes
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
