import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Plus, Search, Filter, Calendar, DollarSign, TrendingUp, Check, Download
} from 'lucide-react';
import { IContaReceber, StatusTransacao, CategoriaReceita, Moeda } from '../types';

// Mock data
const MOCK_CONTAS_RECEBER: IContaReceber[] = [
    {
        id: 'CR001',
        cliente_nome: 'Maria Silva',
        cliente_id: 'C001',
        descricao: 'Reserva #12345 - São Paulo → Rio de Janeiro',
        valor_total: 350.00,
        valor_recebido: 350.00,
        moeda: Moeda.BRL,
        data_emissao: '2024-11-20',
        data_vencimento: '2024-11-20',
        status: StatusTransacao.PAGA,
        categoria: CategoriaReceita.VENDA_PASSAGEM,
        numero_documento: 'RES-12345'
    },
    {
        id: 'CR002',
        cliente_nome: 'Tech Solutions Ltda',
        cliente_id: 'CC001',
        descricao: 'Fretamento Corporativo - Evento Empresa',
        valor_total: 5000.00,
        valor_recebido: 0,
        moeda: Moeda.BRL,
        data_emissao: '2024-11-23',
        data_vencimento: '2024-12-05',
        status: StatusTransacao.PENDENTE,
        categoria: CategoriaReceita.FRETAMENTO,
        numero_documento: 'FRET-001'
    },
    {
        id: 'CR003',
        cliente_nome: 'João Santos',
        cliente_id: 'C002',
        descricao: 'Transporte de Encomenda - Curitiba',
        valor_total: 120.00,
        valor_recebido: 0,
        moeda: Moeda.BRL,
        data_emissao: '2024-11-15',
        data_vencimento: '2024-11-22',
        status: StatusTransacao.VENCIDA,
        categoria: CategoriaReceita.ENCOMENDA,
        numero_documento: 'ENC-789'
    },
    {
        id: 'CR004',
        cliente_nome: 'Ana Paula Oliveira',
        cliente_id: 'C003',
        descricao: 'Reserva #12350 - Curitiba → Florianópolis',
        valor_total: 280.00,
        valor_recebido: 0,
        moeda: Moeda.BRL,
        data_emissao: '2024-11-24',
        data_vencimento: '2024-11-24',
        status: StatusTransacao.PENDENTE,
        categoria: CategoriaReceita.VENDA_PASSAGEM,
        numero_documento: 'RES-12350'
    },
    {
        id: 'CR005',
        cliente_nome: 'Indústrias ABC S.A.',
        cliente_id: 'CC002',
        descricao: 'Fretamento Mensal - Transporte Funcionários',
        valor_total: 8500.00,
        valor_recebido: 4250.00,
        moeda: Moeda.BRL,
        data_emissao: '2024-11-01',
        data_vencimento: '2024-11-30',
        status: StatusTransacao.PARCIALMENTE_PAGA,
        categoria: CategoriaReceita.FRETAMENTO,
        numero_documento: 'FRET-002'
    }
];

export const ContasReceber: React.FC = () => {
    const navigate = useNavigate();
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState<StatusTransacao | 'TODAS'>('TODAS');
    const [filtroCategoria, setFiltroCategoria] = useState<CategoriaReceita | 'TODAS'>('TODAS');

    const contasFiltradas = useMemo(() => {
        return MOCK_CONTAS_RECEBER.filter(conta => {
            const matchBusca = busca === '' ||
                conta.cliente_nome.toLowerCase().includes(busca.toLowerCase()) ||
                conta.descricao.toLowerCase().includes(busca.toLowerCase()) ||
                conta.numero_documento?.toLowerCase().includes(busca.toLowerCase());

            const matchStatus = filtroStatus === 'TODAS' || conta.status === filtroStatus;
            const matchCategoria = filtroCategoria === 'TODAS' || conta.categoria === filtroCategoria;

            return matchBusca && matchStatus && matchCategoria;
        });
    }, [busca, filtroStatus, filtroCategoria]);

    const resumo = useMemo(() => {
        const total = MOCK_CONTAS_RECEBER.reduce((sum, c) => sum + c.valor_total, 0);
        const recebido = MOCK_CONTAS_RECEBER.reduce((sum, c) => sum + c.valor_recebido, 0);
        const pendente = total - recebido;
        const vencidas = MOCK_CONTAS_RECEBER.filter(c => c.status === StatusTransacao.VENCIDA).length;

        return { total, recebido, pendente, vencidas };
    }, []);

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR');
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
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Contas a Receber</h1>
                        <p className="text-slate-500 dark:text-slate-400">Gerenciamento de receitas e clientes</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/admin/financeiro/transacoes/nova')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    <Plus size={18} />
                    Nova Receita
                </button>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total a Receber</span>
                        <DollarSign size={18} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-xl font-bold text-slate-800 dark:text-white">
                        {formatCurrency(resumo.total)}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Já Recebido</span>
                        <Check size={18} className="text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(resumo.recebido)}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Pendente</span>
                        <Calendar size={18} className="text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                        {formatCurrency(resumo.pendente)}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Inadimplentes</span>
                        <TrendingUp size={18} className="text-red-600 dark:text-red-400" />
                    </div>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">
                        {resumo.vencidas}
                    </p>
                </div>
            </div>

            {/* Filtros e Busca */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Busca */}
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por cliente, descrição ou documento..."
                                value={busca}
                                onChange={e => setBusca(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Filtro Status */}
                    <div>
                        <select
                            value={filtroStatus}
                            onChange={e => setFiltroStatus(e.target.value as StatusTransacao | 'TODAS')}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="TODAS">Todos os Status</option>
                            <option value={StatusTransacao.PENDENTE}>Pendente</option>
                            <option value={StatusTransacao.PAGA}>Recebida</option>
                            <option value={StatusTransacao.VENCIDA}>Vencida</option>
                            <option value={StatusTransacao.PARCIALMENTE_PAGA}>Parcial</option>
                        </select>
                    </div>

                    {/* Filtro Categoria */}
                    <div>
                        <select
                            value={filtroCategoria}
                            onChange={e => setFiltroCategoria(e.target.value as CategoriaReceita | 'TODAS')}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="TODAS">Todas Categorias</option>
                            <option value={CategoriaReceita.VENDA_PASSAGEM}>Venda de Passagem</option>
                            <option value={CategoriaReceita.FRETAMENTO}>Fretamento</option>
                            <option value={CategoriaReceita.ENCOMENDA}>Encomenda</option>
                            <option value={CategoriaReceita.OUTROS}>Outros</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Lista de Contas */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                            Receitas ({contasFiltradas.length})
                        </h2>
                        <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                            <Download size={16} />
                            Exportar
                        </button>
                    </div>
                </div>

                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {contasFiltradas.length === 0 ? (
                        <div className="p-12 text-center">
                            <TrendingUp size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                            <p className="text-slate-500 dark:text-slate-400">Nenhuma conta encontrada</p>
                        </div>
                    ) : (
                        contasFiltradas.map(conta => (
                            <div
                                key={conta.id}
                                className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-semibold text-slate-800 dark:text-white">
                                                {conta.cliente_nome}
                                            </h3>
                                            {getStatusBadge(conta.status)}
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                                            {conta.descricao}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                            <span>Categoria: {conta.categoria}</span>
                                            <span>•</span>
                                            <span>Emissão: {formatDate(conta.data_emissao)}</span>
                                            <span>•</span>
                                            <span>Vencimento: {formatDate(conta.data_vencimento)}</span>
                                            {conta.numero_documento && (
                                                <>
                                                    <span>•</span>
                                                    <span>Doc: {conta.numero_documento}</span>
                                                </>
                                            )}
                                        </div>
                                        {conta.status === StatusTransacao.PARCIALMENTE_PAGA && (
                                            <div className="mt-2">
                                                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                                    <span>Recebido: {formatCurrency(conta.valor_recebido)}</span>
                                                    <span>•</span>
                                                    <span>Restante: {formatCurrency(conta.valor_total - conta.valor_recebido)}</span>
                                                </div>
                                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-1">
                                                    <div
                                                        className="bg-blue-600 h-1.5 rounded-full"
                                                        style={{ width: `${(conta.valor_recebido / conta.valor_total) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right ml-4">
                                        <p className="text-xl font-bold text-green-600 dark:text-green-400 mb-1">
                                            {formatCurrency(conta.valor_total)}
                                        </p>
                                        {conta.valor_recebido > 0 && conta.status !== StatusTransacao.PAGA && (
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                Recebido: {formatCurrency(conta.valor_recebido)}
                                            </p>
                                        )}
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
