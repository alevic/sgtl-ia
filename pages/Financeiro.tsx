import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DollarSign, TrendingUp, TrendingDown, Calendar, Plus, FileText,
    CreditCard, AlertCircle, ArrowUpRight, ArrowDownRight, PieChart
} from 'lucide-react';
import { ITransacao, TipoTransacao, StatusTransacao, Moeda, CategoriaReceita, CategoriaDespesa } from '../types';

// Mock data - em produção viria do backend
const MOCK_TRANSACOES: ITransacao[] = [
    {
        id: 'T001',
        tipo: TipoTransacao.RECEITA,
        descricao: 'Venda de Passagem #12345',
        valor: 350.00,
        moeda: Moeda.BRL,
        data_emissao: '2024-11-20',
        data_vencimento: '2024-11-20',
        data_pagamento: '2024-11-20',
        status: StatusTransacao.PAGA,
        categoria_receita: CategoriaReceita.VENDA_PASSAGEM,
        reserva_id: 'R001',
        criado_por: 'admin',
        criado_em: '2024-11-20T10:00:00'
    },
    {
        id: 'T002',
        tipo: TipoTransacao.DESPESA,
        descricao: 'Manutenção Preventiva - ABC-1234',
        valor: 1200.00,
        moeda: Moeda.BRL,
        data_emissao: '2024-11-22',
        data_vencimento: '2024-11-25',
        status: StatusTransacao.PENDENTE,
        categoria_despesa: CategoriaDespesa.MANUTENCAO,
        manutencao_id: 'M001',
        criado_por: 'admin',
        criado_em: '2024-11-22T14:30:00'
    },
    {
        id: 'T003',
        tipo: TipoTransacao.RECEITA,
        descricao: 'Fretamento Corporativo - Tech Solutions',
        valor: 5000.00,
        moeda: Moeda.BRL,
        data_emissao: '2024-11-23',
        data_vencimento: '2024-12-05',
        status: StatusTransacao.PENDENTE,
        categoria_receita: CategoriaReceita.FRETAMENTO,
        fretamento_id: 'F001',
        criado_por: 'admin',
        criado_em: '2024-11-23T09:15:00'
    }
];

export const Financeiro: React.FC = () => {
    const navigate = useNavigate();
    const [periodoSelecionado, setPeriodoSelecionado] = useState<'mes' | 'trimestre' | 'ano'>('mes');

    // Cálculos financeiros
    const resumo = useMemo(() => {
        const receitas = MOCK_TRANSACOES
            .filter(t => t.tipo === TipoTransacao.RECEITA)
            .reduce((sum, t) => sum + t.valor, 0);

        const despesas = MOCK_TRANSACOES
            .filter(t => t.tipo === TipoTransacao.DESPESA)
            .reduce((sum, t) => sum + t.valor, 0);

        const saldo = receitas - despesas;

        const receitasPagas = MOCK_TRANSACOES
            .filter(t => t.tipo === TipoTransacao.RECEITA && t.status === StatusTransacao.PAGA)
            .reduce((sum, t) => sum + t.valor, 0);

        const despesasPagas = MOCK_TRANSACOES
            .filter(t => t.tipo === TipoTransacao.DESPESA && t.status === StatusTransacao.PAGA)
            .reduce((sum, t) => sum + t.valor, 0);

        const contasVencidas = MOCK_TRANSACOES.filter(t => {
            if (t.status !== StatusTransacao.PENDENTE) return false;
            const vencimento = new Date(t.data_vencimento);
            return vencimento < new Date();
        }).length;

        return {
            receitas,
            despesas,
            saldo,
            receitasPagas,
            despesasPagas,
            contasVencidas
        };
    }, []);

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Financeiro</h1>
                    <p className="text-slate-500 dark:text-slate-400">Visão geral das finanças</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/admin/financeiro/transacoes/nova')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Nova Transação
                    </button>
                </div>
            </div>

            {/* Filtro de Período */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => setPeriodoSelecionado('mes')}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${periodoSelecionado === 'mes'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    Este Mês
                </button>
                <button
                    onClick={() => setPeriodoSelecionado('trimestre')}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${periodoSelecionado === 'trimestre'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    Trimestre
                </button>
                <button
                    onClick={() => setPeriodoSelecionado('ano')}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${periodoSelecionado === 'ano'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    Este Ano
                </button>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Receitas */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Receitas</span>
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                            <TrendingUp size={20} className="text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
                        {formatCurrency(resumo.receitas)}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        <ArrowUpRight size={14} />
                        {formatCurrency(resumo.receitasPagas)} recebidas
                    </p>
                </div>

                {/* Despesas */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Despesas</span>
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                            <TrendingDown size={20} className="text-red-600 dark:text-red-400" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
                        {formatCurrency(resumo.despesas)}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <ArrowDownRight size={14} />
                        {formatCurrency(resumo.despesasPagas)} pagas
                    </p>
                </div>

                {/* Saldo */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Saldo</span>
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <DollarSign size={20} className="text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <p className={`text-2xl font-bold mb-1 ${resumo.saldo >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                        {formatCurrency(resumo.saldo)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {resumo.saldo >= 0 ? 'Superá vit' : 'Déficit'}
                    </p>
                </div>

                {/* Contas Vencidas */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Vencidas</span>
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                            <AlertCircle size={20} className="text-amber-600 dark:text-amber-400" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                        {resumo.contasVencidas}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Contas pendentes
                    </p>
                </div>
            </div>

            {/* Ações Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                    onClick={() => navigate('/admin/financeiro/contas-receber')}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors text-left group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <ArrowUpRight size={24} className="text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                Contas a Receber
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Gerenciar receitas
                            </p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => navigate('/admin/financeiro/contas-pagar')}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors text-left group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <ArrowDownRight size={24} className="text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                Contas a Pagar
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Gerenciar despesas
                            </p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => navigate('/admin/relatorios')}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors text-left group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                Relatórios
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                DRE, Fluxo de Caixa
                            </p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => navigate('/admin/financeiro/centros-custo')}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors text-left group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <PieChart size={24} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                Centros de Custo
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Análise de custos
                            </p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => navigate('/admin/financeiro/conciliacao')}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors text-left group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText size={24} className="text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                Conciliação Bancária
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Importar extrato
                            </p>
                        </div>
                    </div>
                </button>
            </div>

            {/* Transações Recentes */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Transações Recentes</h2>
                        <button
                            onClick={() => navigate('/admin/financeiro/transacoes')}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            Ver todas
                        </button>
                    </div>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {MOCK_TRANSACOES.slice(0, 5).map((transacao) => (
                        <div key={transacao.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${transacao.tipo === TipoTransacao.RECEITA
                                        ? 'bg-green-100 dark:bg-green-900/30'
                                        : 'bg-red-100 dark:bg-red-900/30'
                                        }`}>
                                        {transacao.tipo === TipoTransacao.RECEITA ? (
                                            <ArrowUpRight size={20} className="text-green-600 dark:text-green-400" />
                                        ) : (
                                            <ArrowDownRight size={20} className="text-red-600 dark:text-red-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-800 dark:text-white truncate">
                                            {transacao.descricao}
                                        </p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {new Date(transacao.data_emissao).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {getStatusBadge(transacao.status)}
                                    <p className={`text-lg font-semibold ${transacao.tipo === TipoTransacao.RECEITA
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-red-600 dark:text-red-400'
                                        }`}>
                                        {transacao.tipo === TipoTransacao.RECEITA ? '+' : '-'} {formatCurrency(transacao.valor)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
