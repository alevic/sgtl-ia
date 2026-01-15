import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IFretamento, IClienteCorporativo, Moeda, FretamentoStatus, FretamentoStatusLabel } from '../types';
import { Bus, Building2, Calendar, DollarSign, FileText, CheckCircle, Loader } from 'lucide-react';
import { chartersService } from '../services/chartersService';
import { clientsService } from '../services/clientsService';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const configs: Record<string, { color: string }> = {
        [FretamentoStatus.REQUEST]: { color: 'slate' },
        [FretamentoStatus.QUOTED]: { color: 'yellow' },
        [FretamentoStatus.CONFIRMED]: { color: 'green' },
        [FretamentoStatus.IN_PROGRESS]: { color: 'blue' },
        [FretamentoStatus.COMPLETED]: { color: 'green' },
        [FretamentoStatus.CANCELLED]: { color: 'red' },
        // Legacy fallbacks
        'SOLICITACAO': { color: 'slate' },
        'PENDING': { color: 'slate' },
        'ORCAMENTO_ENVIADO': { color: 'yellow' },
        'CONFIRMADO': { color: 'green' },
        'APPROVED': { color: 'green' },
        'EM_ANDAMENTO': { color: 'blue' },
        'CONCLUIDO': { color: 'green' },
        'CANCELADO': { color: 'red' },
        'REJECTED': { color: 'red' }
    };

    const config = configs[status] || configs[FretamentoStatus.REQUEST];

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${config.color}-100 dark:bg-${config.color}-900/30 text-${config.color}-700 dark:text-${config.color}-300`}>
            {FretamentoStatusLabel[status as FretamentoStatus] || (status as string)}
        </span>
    );
};

export const Fretamento: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [fretamentos, setFretamentos] = useState<IFretamento[]>([]);
    const [clientes, setClientes] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [chartersData, clientsData] = await Promise.all([
                chartersService.getAll(),
                clientsService.getAll()
            ]);
            setFretamentos(chartersData);
            setClientes(clientsData);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCliente = (clienteId: string) => {
        return clientes.find(c => c.id === clienteId);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Fretamento B2B</h1>
                    <p className="text-slate-500 dark:text-slate-400">Gestão de aluguel de frota para empresas</p>
                </div>
                <button
                    onClick={() => navigate('/admin/fretamento/novo')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    <FileText size={18} />
                    Nova Solicitação
                </button>
            </div>

            {/* Clientes Corporativos - Placeholder or Filtered List */}
            {/* For now, showing a summary or just listing charters is better as clients list might be huge */}

            {/* Lista de Fretamentos */}
            <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Solicitações de Fretamento</h2>
                <div className="grid gap-4">
                    {fretamentos.length === 0 ? (
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                            <Bus size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                            <p className="text-slate-500 dark:text-slate-400">Nenhuma solicitação encontrada</p>
                        </div>
                    ) : (
                        fretamentos.map((fretamento: any) => {
                            const cliente = getCliente(fretamento.client_id);

                            // Backend fields mapping
                            const origem = fretamento.origin_city ? `${fretamento.origin_city}, ${fretamento.origin_state}` : fretamento.origem;
                            const destino = fretamento.destination_city ? `${fretamento.destination_city}, ${fretamento.destination_state}` : fretamento.destino;
                            const dataInicio = fretamento.departure_date || fretamento.data_inicio;
                            const dataFim = fretamento.return_date || fretamento.data_fim;
                            const valorTotal = fretamento.quote_price || fretamento.valor_total || 0;

                            return (
                                <div key={fretamento.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                                                <Bus size={24} className="text-orange-600 dark:text-orange-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                                    {origem} → {destino}
                                                </h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {fretamento.company_name || cliente?.nome || fretamento.contact_name}
                                                </p>
                                            </div>
                                        </div>
                                        <StatusBadge status={fretamento.status} />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Tipo</p>
                                            <p className="font-semibold text-slate-800 dark:text-white">
                                                {/* Backend doesn't explicitly store PONTUAL/RECORRENTE in the main table unless in description or notes, defaulting to Pontual */}
                                                Pontual
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Data Início</p>
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} className="text-blue-600" />
                                                <p className="font-semibold text-slate-800 dark:text-white">
                                                    {new Date(dataInicio).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Data Fim</p>
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} className="text-red-600" />
                                                <p className="font-semibold text-slate-800 dark:text-white">
                                                    {dataFim ? new Date(dataFim).toLocaleDateString('pt-BR') : '--'}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Valor Total</p>
                                            <div className="flex items-center gap-2">
                                                <DollarSign size={16} className="text-green-600" />
                                                <p className="font-bold text-green-600 dark:text-green-400">
                                                    {fretamento.moeda || 'R$'} {Number(valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {fretamento.description && (
                                        <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Descrição</p>
                                            <p className="text-sm text-slate-700 dark:text-slate-300">{fretamento.description}</p>
                                        </div>
                                    )}

                                    <div className="flex gap-2 mt-4">
                                        {(fretamento.status === FretamentoStatus.REQUEST || fretamento.status === 'PENDING' || fretamento.status === 'SOLICITACAO') && (
                                            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors">
                                                Enviar Orçamento
                                            </button>
                                        )}
                                        {(fretamento.status === FretamentoStatus.QUOTED || fretamento.status === 'ORCAMENTO_ENVIADO') && (
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
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
