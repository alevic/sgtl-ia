import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Plus, Search, Download, Calendar, Filter, ArrowUpRight, ArrowDownRight, Eye
} from 'lucide-react';
import {
    ITransacao, TipoTransacao, StatusTransacao, CategoriaReceita, CategoriaDespesa,
    FormaPagamento, Moeda, CentroCusto, ClassificacaoContabil
} from '../types';
import { useApp } from '../context/AppContext';
import { TransactionActions } from '../components/Financeiro/TransactionActions';

export const Transacoes: React.FC = () => {
    const navigate = useNavigate();
    const { currentContext } = useApp();
    const [transacoes, setTransacoes] = useState<ITransacao[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filtros
    const [busca, setBusca] = useState('');
    const [filtroTipo, setFiltroTipo] = useState<TipoTransacao | 'TODAS'>('TODAS');
    const [filtroStatus, setFiltroStatus] = useState<StatusTransacao | 'TODAS'>('TODAS');
    const [filtroCentroCusto, setFiltroCentroCusto] = useState<CentroCusto | 'TODOS'>('TODOS');
    const [filtroClassificacao, setFiltroClassificacao] = useState<ClassificacaoContabil | 'TODAS'>('TODAS');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');

    const fetchTransacoes = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/finance/transactions`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Falha ao buscar transações');
            }

            const data = await response.json();
            setTransacoes(data);
        } catch (error) {
            console.error("Erro ao buscar transações:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTransacoes();
    }, [currentContext]);

    const transacoesFiltradas = useMemo(() => {
        return transacoes.filter(transacao => {
            const matchBusca = busca === '' ||
                transacao.descricao.toLowerCase().includes(busca.toLowerCase()) ||
                transacao.numero_documento?.toLowerCase().includes(busca.toLowerCase()) ||
                transacao.id.toLowerCase().includes(busca.toLowerCase());

            const matchTipo = filtroTipo === 'TODAS' || transacao.tipo === filtroTipo;
            const matchStatus = filtroStatus === 'TODAS' || transacao.status === filtroStatus;
            const matchCentroCusto = filtroCentroCusto === 'TODOS' || transacao.centro_custo === filtroCentroCusto;
            const matchClassificacao = filtroClassificacao === 'TODAS' || transacao.classificacao_contabil === filtroClassificacao;

            let matchData = true;
            if (dataInicio && dataFim) {
                const dataEmissao = new Date(transacao.data_emissao);
                // Adjust comparison to compare Dates only, ignoring time components of the transacao if needed
                // But generally direct comparison works if we set start to 00:00 and end to 23:59

                // Fix: Parse input dates as Local Time
                // When input type="date" returns "2023-12-13", new Date("2023-12-13") is UTC midnight (previous day 21h).
                // We need to construct local date.
                const [iY, iM, iD] = dataInicio.split('-').map(Number);
                const start = new Date(iY, iM - 1, iD, 0, 0, 0);

                const [fY, fM, fD] = dataFim.split('-').map(Number);
                const end = new Date(fY, fM - 1, fD, 23, 59, 59, 999);

                matchData = dataEmissao >= start && dataEmissao <= end;
            }

            return matchBusca && matchTipo && matchStatus && matchData && matchCentroCusto && matchClassificacao;
        }).sort((a, b) => new Date(b.data_emissao).getTime() - new Date(a.data_emissao).getTime());
    }, [transacoes, busca, filtroTipo, filtroStatus, dataInicio, dataFim, filtroCentroCusto, filtroClassificacao]);

    const resumo = useMemo(() => {
        const receitas = transacoesFiltradas
            .filter(t => t.tipo === TipoTransacao.RECEITA)
            .reduce((sum, t) => sum + Number(t.valor), 0);

        const despesas = transacoesFiltradas
            .filter(t => t.tipo === TipoTransacao.DESPESA)
            .reduce((sum, t) => sum + Number(t.valor), 0);

        const saldo = receitas - despesas;

        return { receitas, despesas, saldo, total: transacoesFiltradas.length };
    }, [transacoesFiltradas]);

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    };

    const getStatusBadge = (status: StatusTransacao) => {
        const styles = {
            [StatusTransacao.PAGA]: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            [StatusTransacao.PENDENTE]: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            [StatusTransacao.VENCIDA]: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            [StatusTransacao.CANCELADA]: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
            [StatusTransacao.PARCIALMENTE_PAGA]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        };

        return (
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${styles[status]}`}>
                {status}
            </span>
        );
    };

    const getTipoBadge = (tipo: TipoTransacao) => {
        if (tipo === TipoTransacao.RECEITA) {
            return (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded text-xs font-semibold flex items-center gap-1">
                    <ArrowUpRight size={12} />
                    RECEITA
                </span>
            );
        }
        return (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded text-xs font-semibold flex items-center gap-1">
                <ArrowDownRight size={12} />
                DESPESA
            </span>
        );
    };

    const handleExport = () => {
        console.log('Exportando transações:', transacoesFiltradas);
        alert('Função de exportação será implementada em breve!');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/admin/financeiro')}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Transações Financeiras</h1>
                        <p className="text-slate-500 dark:text-slate-400">Histórico completo de receitas e despesas</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/admin/financeiro/transacoes/nova')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    <Plus size={18} />
                    Nova Transação
                </button>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Receitas</span>
                        <ArrowUpRight size={18} className="text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(resumo.receitas)}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Despesas</span>
                        <ArrowDownRight size={18} className="text-red-600 dark:text-red-400" />
                    </div>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(resumo.despesas)}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Saldo</span>
                        <Calendar size={18} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className={`text-xl font-bold ${resumo.saldo >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(resumo.saldo)}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Transações</span>
                        <Filter size={18} className="text-slate-600 dark:text-slate-400" />
                    </div>
                    <p className="text-xl font-bold text-slate-800 dark:text-white">
                        {resumo.total}
                    </p>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Busca */}
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por descrição, ID ou documento..."
                                value={busca}
                                onChange={e => setBusca(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Filtro Tipo */}
                    <div>
                        <select
                            value={filtroTipo}
                            onChange={e => setFiltroTipo(e.target.value as TipoTransacao | 'TODAS')}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="TODAS">Todos os Tipos</option>
                            <option value={TipoTransacao.RECEITA}>Receitas</option>
                            <option value={TipoTransacao.DESPESA}>Despesas</option>
                        </select>
                    </div>

                    {/* Filtro Status */}
                    <div>
                        <select
                            value={filtroStatus}
                            onChange={e => setFiltroStatus(e.target.value as StatusTransacao | 'TODAS')}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="TODAS">Todos os Status</option>
                            <option value={StatusTransacao.PAGA}>Paga</option>
                            <option value={StatusTransacao.PENDENTE}>Pendente</option>
                            <option value={StatusTransacao.VENCIDA}>Vencida</option>
                            <option value={StatusTransacao.PARCIALMENTE_PAGA}>Parcial</option>
                        </select>
                    </div>

                    {/* Filtro Centro de Custo */}
                    <div>
                        <select
                            value={filtroCentroCusto}
                            onChange={e => setFiltroCentroCusto(e.target.value as CentroCusto | 'TODOS')}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="TODOS">Todos Centros de Custo</option>
                            <option value={CentroCusto.ESTOQUE}>Estoque</option>
                            <option value={CentroCusto.VENDAS}>Vendas</option>
                            <option value={CentroCusto.ADMINISTRATIVO}>Administrativo</option>
                        </select>
                    </div>

                    {/* Filtro Classificação */}
                    <div>
                        <select
                            value={filtroClassificacao}
                            onChange={e => setFiltroClassificacao(e.target.value as ClassificacaoContabil | 'TODAS')}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="TODAS">Todas Classificações</option>
                            <option value={ClassificacaoContabil.CUSTO_FIXO}>Custo Fixo</option>
                            <option value={ClassificacaoContabil.CUSTO_VARIAVEL}>Custo Variável</option>
                            <option value={ClassificacaoContabil.DESPESA_FIXA}>Despesa Fixa</option>
                            <option value={ClassificacaoContabil.DESPESA_VARIAVEL}>Despesa Variável</option>
                        </select>
                    </div>

                    {/* Período */}
                    <div className="md:col-span-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Data Início</label>
                                <input
                                    type="date"
                                    value={dataInicio}
                                    onChange={e => setDataInicio(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Data Fim</label>
                                <input
                                    type="date"
                                    value={dataFim}
                                    onChange={e => setDataFim(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de Transações */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                            Transações ({transacoesFiltradas.length})
                        </h2>
                        <button
                            onClick={handleExport}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                            <Download size={16} />
                            Exportar
                        </button>
                    </div>
                </div>

                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <p className="text-slate-500 dark:text-slate-400">Carregando transações...</p>
                        </div>
                    ) : transacoesFiltradas.length === 0 ? (
                        <div className="p-12 text-center">
                            <Filter size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                            <p className="text-slate-500 dark:text-slate-400">Nenhuma transação encontrada</p>
                        </div>
                    ) : (
                        transacoesFiltradas.map(transacao => (
                            <div
                                key={transacao.id}
                                className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            {getTipoBadge(transacao.tipo)}
                                            {getStatusBadge(transacao.status)}
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                ID: {transacao.id}
                                            </span>
                                        </div>
                                        <h3 className="font-semibold text-slate-800 dark:text-white mb-1">
                                            {transacao.descricao}
                                        </h3>
                                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                            <span>Emissão: {formatDate(transacao.data_emissao)}</span>
                                            <span>•</span>
                                            <span>Vencimento: {formatDate(transacao.data_vencimento)}</span>
                                            {transacao.numero_documento && (
                                                <>
                                                    <span>•</span>
                                                    <span>Doc: {transacao.numero_documento}</span>
                                                </>
                                            )}
                                            {transacao.forma_pagamento && (
                                                <>
                                                    <span>•</span>
                                                    <span>{transacao.forma_pagamento}</span>
                                                </>
                                            )}
                                            <span>•</span>
                                            <span>
                                                Categoria: {transacao.categoria_receita || transacao.categoria_despesa}
                                            </span>
                                            {transacao.centro_custo && (
                                                <>
                                                    <span>•</span>
                                                    <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 font-medium">
                                                        {transacao.centro_custo}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right ml-4 flex items-center gap-3">
                                        <div>
                                            <p className={`text-xl font-bold ${transacao.tipo === TipoTransacao.RECEITA
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-red-600 dark:text-red-400'
                                                }`}>
                                                {transacao.tipo === TipoTransacao.RECEITA ? '+' : '-'} {formatCurrency(Number(transacao.valor))}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {transacao.moeda}
                                            </p>
                                        </div>
                                        <TransactionActions transacao={transacao} onUpdate={fetchTransacoes} />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
