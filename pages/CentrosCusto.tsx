import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, PieChart, TrendingUp, TrendingDown, DollarSign,
    BarChart3, Calendar, Filter, Download
} from 'lucide-react';
import {
    ITransacao, TipoTransacao, CentroCusto, ClassificacaoContabil, Moeda, StatusTransacao
} from '../types';

// Mock data for demonstration
const MOCK_TRANSACOES: ITransacao[] = [
    // Receitas (Vendas)
    {
        id: 'T001', tipo: TipoTransacao.RECEITA, descricao: 'Venda de Passagens', valor: 15000, moeda: Moeda.BRL,
        data_emissao: '2024-11-01', data_vencimento: '2024-11-01', status: StatusTransacao.PAGA,
        centro_custo: CentroCusto.VENDAS, criado_por: 'admin', criado_em: '2024-11-01T10:00:00'
    },
    {
        id: 'T002', tipo: TipoTransacao.RECEITA, descricao: 'Fretamento Escolar', valor: 8000, moeda: Moeda.BRL,
        data_emissao: '2024-11-05', data_vencimento: '2024-11-05', status: StatusTransacao.PAGA,
        centro_custo: CentroCusto.VENDAS, criado_por: 'admin', criado_em: '2024-11-05T14:00:00'
    },
    // Custos Variáveis (Vendas/Operação)
    {
        id: 'T003', tipo: TipoTransacao.DESPESA, descricao: 'Combustível Frota', valor: 4500, moeda: Moeda.BRL,
        data_emissao: '2024-11-02', data_vencimento: '2024-11-10', status: StatusTransacao.PAGA,
        centro_custo: CentroCusto.VENDAS, classificacao_contabil: ClassificacaoContabil.CUSTO_VARIAVEL,
        criado_por: 'admin', criado_em: '2024-11-02T09:00:00'
    },
    {
        id: 'T004', tipo: TipoTransacao.DESPESA, descricao: 'Manutenção Corretiva', valor: 1200, moeda: Moeda.BRL,
        data_emissao: '2024-11-08', data_vencimento: '2024-11-15', status: StatusTransacao.PAGA,
        centro_custo: CentroCusto.VENDAS, classificacao_contabil: ClassificacaoContabil.CUSTO_VARIAVEL,
        criado_por: 'admin', criado_em: '2024-11-08T11:00:00'
    },
    // Custos Fixos (Vendas/Operação)
    {
        id: 'T005', tipo: TipoTransacao.DESPESA, descricao: 'Seguro da Frota', valor: 2000, moeda: Moeda.BRL,
        data_emissao: '2024-11-01', data_vencimento: '2024-11-05', status: StatusTransacao.PAGA,
        centro_custo: CentroCusto.VENDAS, classificacao_contabil: ClassificacaoContabil.CUSTO_FIXO,
        criado_por: 'admin', criado_em: '2024-11-01T08:00:00'
    },
    {
        id: 'T006', tipo: TipoTransacao.DESPESA, descricao: 'Salários Motoristas', valor: 6000, moeda: Moeda.BRL,
        data_emissao: '2024-11-05', data_vencimento: '2024-11-05', status: StatusTransacao.PAGA,
        centro_custo: CentroCusto.VENDAS, classificacao_contabil: ClassificacaoContabil.CUSTO_FIXO,
        criado_por: 'admin', criado_em: '2024-11-05T09:00:00'
    },
    // Despesas Administrativas
    {
        id: 'T007', tipo: TipoTransacao.DESPESA, descricao: 'Aluguel Escritório', valor: 1500, moeda: Moeda.BRL,
        data_emissao: '2024-11-01', data_vencimento: '2024-11-05', status: StatusTransacao.PAGA,
        centro_custo: CentroCusto.ADMINISTRATIVO, classificacao_contabil: ClassificacaoContabil.DESPESA_FIXA,
        criado_por: 'admin', criado_em: '2024-11-01T10:00:00'
    },
    {
        id: 'T008', tipo: TipoTransacao.DESPESA, descricao: 'Internet e Telefone', valor: 300, moeda: Moeda.BRL,
        data_emissao: '2024-11-10', data_vencimento: '2024-11-15', status: StatusTransacao.PAGA,
        centro_custo: CentroCusto.ADMINISTRATIVO, classificacao_contabil: ClassificacaoContabil.DESPESA_FIXA,
        criado_por: 'admin', criado_em: '2024-11-10T14:00:00'
    },
    {
        id: 'T009', tipo: TipoTransacao.DESPESA, descricao: 'Material de Escritório', valor: 150, moeda: Moeda.BRL,
        data_emissao: '2024-11-12', data_vencimento: '2024-11-12', status: StatusTransacao.PAGA,
        centro_custo: CentroCusto.ADMINISTRATIVO, classificacao_contabil: ClassificacaoContabil.DESPESA_VARIAVEL,
        criado_por: 'admin', criado_em: '2024-11-12T16:00:00'
    },
    // Estoque
    {
        id: 'T010', tipo: TipoTransacao.DESPESA, descricao: 'Compra de Pneus', valor: 2000, moeda: Moeda.BRL,
        data_emissao: '2024-11-15', data_vencimento: '2024-11-20', status: StatusTransacao.PENDENTE,
        centro_custo: CentroCusto.ESTOQUE, classificacao_contabil: ClassificacaoContabil.CUSTO_VARIAVEL,
        criado_por: 'admin', criado_em: '2024-11-15T11:00:00'
    }
];

export const CentrosCusto: React.FC = () => {
    const navigate = useNavigate();
    const [periodoInicio, setPeriodoInicio] = useState('2024-11-01');
    const [periodoFim, setPeriodoFim] = useState('2024-11-30');

    const dadosFiltrados = useMemo(() => {
        return MOCK_TRANSACOES.filter(t => {
            const data = new Date(t.data_emissao);
            return data >= new Date(periodoInicio) && data <= new Date(periodoFim);
        });
    }, [periodoInicio, periodoFim]);

    const kpis = useMemo(() => {
        const receitas = dadosFiltrados
            .filter(t => t.tipo === TipoTransacao.RECEITA)
            .reduce((acc, t) => acc + t.valor, 0);

        const despesas = dadosFiltrados
            .filter(t => t.tipo === TipoTransacao.DESPESA)
            .reduce((acc, t) => acc + t.valor, 0);

        const resultado = receitas - despesas;
        const margem = receitas > 0 ? (resultado / receitas) * 100 : 0;

        return { receitas, despesas, resultado, margem };
    }, [dadosFiltrados]);

    const analisePorCentroCusto = useMemo(() => {
        const centros = Object.values(CentroCusto);
        return centros.map(centro => {
            const total = dadosFiltrados
                .filter(t => t.tipo === TipoTransacao.DESPESA && t.centro_custo === centro)
                .reduce((acc, t) => acc + t.valor, 0);

            const percentual = kpis.despesas > 0 ? (total / kpis.despesas) * 100 : 0;

            return { centro, total, percentual };
        }).sort((a, b) => b.total - a.total);
    }, [dadosFiltrados, kpis.despesas]);

    const analisePorClassificacao = useMemo(() => {
        const classificacoes = Object.values(ClassificacaoContabil);
        return classificacoes.map(classificacao => {
            const total = dadosFiltrados
                .filter(t => t.tipo === TipoTransacao.DESPESA && t.classificacao_contabil === classificacao)
                .reduce((acc, t) => acc + t.valor, 0);

            const percentual = kpis.despesas > 0 ? (total / kpis.despesas) * 100 : 0;

            return { classificacao, total, percentual };
        }).sort((a, b) => b.total - a.total);
    }, [dadosFiltrados, kpis.despesas]);

    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatPercent = (val: number) => val.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%';

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
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Análise de Centros de Custo</h1>
                        <p className="text-slate-500 dark:text-slate-400">Visão detalhada de custos e despesas</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        <input
                            type="date"
                            value={periodoInicio}
                            onChange={e => setPeriodoInicio(e.target.value)}
                            className="px-2 py-1 bg-transparent border-none focus:ring-0 text-sm"
                        />
                        <span className="text-slate-400">-</span>
                        <input
                            type="date"
                            value={periodoFim}
                            onChange={e => setPeriodoFim(e.target.value)}
                            className="px-2 py-1 bg-transparent border-none focus:ring-0 text-sm"
                        />
                    </div>
                    <button className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <Download size={20} className="text-slate-600 dark:text-slate-400" />
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Receita Total</span>
                        <TrendingUp size={20} className="text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(kpis.receitas)}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Despesa Total</span>
                        <TrendingDown size={20} className="text-red-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(kpis.despesas)}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Resultado</span>
                        <DollarSign size={20} className={kpis.resultado >= 0 ? "text-green-500" : "text-red-500"} />
                    </div>
                    <p className={`text-2xl font-bold ${kpis.resultado >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(kpis.resultado)}
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Margem</span>
                        <PieChart size={20} className="text-blue-500" />
                    </div>
                    <p className={`text-2xl font-bold ${kpis.margem >= 0 ? "text-blue-600" : "text-red-600"}`}>
                        {formatPercent(kpis.margem)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Por Centro de Custo */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <BarChart3 size={20} className="text-blue-500" />
                        Despesas por Centro de Custo
                    </h2>
                    <div className="space-y-4">
                        {analisePorCentroCusto.map((item) => (
                            <div key={item.centro}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-slate-700 dark:text-slate-300">{item.centro}</span>
                                    <span className="text-slate-500 dark:text-slate-400">
                                        {formatCurrency(item.total)} ({formatPercent(item.percentual)})
                                    </span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                                    <div
                                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                                        style={{ width: `${item.percentual}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Por Classificação Contábil */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <Filter size={20} className="text-purple-500" />
                        Classificação Contábil
                    </h2>
                    <div className="space-y-4">
                        {analisePorClassificacao.map((item) => (
                            <div key={item.classificacao}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                        {item.classificacao.replace('_', ' ')}
                                    </span>
                                    <span className="text-slate-500 dark:text-slate-400">
                                        {formatCurrency(item.total)} ({formatPercent(item.percentual)})
                                    </span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                                    <div
                                        className="bg-purple-600 h-2.5 rounded-full transition-all duration-500"
                                        style={{ width: `${item.percentual}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Explicação Conceitual */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">Entenda a Classificação</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-700 dark:text-blue-400">
                    <div>
                        <p className="font-semibold mb-1">Custos vs. Despesas</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li><strong>Custos:</strong> Gastos ligados diretamente à atividade fim (transporte). Ex: Combustível, Manutenção, Salário Motorista.</li>
                            <li><strong>Despesas:</strong> Gastos administrativos para manter a empresa. Ex: Aluguel escritório, Marketing, Contador.</li>
                        </ul>
                    </div>
                    <div>
                        <p className="font-semibold mb-1">Fixos vs. Variáveis</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li><strong>Fixos:</strong> Ocorrem todo mês, independente de rodar ou não. Ex: Seguro, Salários fixos, Aluguel.</li>
                            <li><strong>Variáveis:</strong> Aumentam conforme a frota roda mais. Ex: Combustível, Pneus, Pedágio.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
