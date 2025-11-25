import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, TrendingUp, TrendingDown, DollarSign, Calendar, FileText } from 'lucide-react';
import { TipoTransacao, CategoriaReceita, CategoriaDespesa, Moeda } from '../types';

// Mock data (em produção viria do backend)

export const Relatorios: React.FC = () => {
    const navigate = useNavigate();
    const [periodoInicio, setPeriodoInicio] = useState('2024-11-01');
    const [periodoFim, setPeriodoFim] = useState('2024-11-30');

    // Dados mockados para demonstração
    const mockTransacoes = [
        { tipo: TipoTransacao.RECEITA, valor: 350, categoria_receita: CategoriaReceita.VENDA_PASSAGEM, data_emissao: '2024-11-20' },
        { tipo: TipoTransacao.RECEITA, valor: 5000, categoria_receita: CategoriaReceita.FRETAMENTO, data_emissao: '2024-11-23' },
        { tipo: TipoTransacao.RECEITA, valor: 120, categoria_receita: CategoriaReceita.ENCOMENDA, data_emissao: '2024-11-15' },
        { tipo: TipoTransacao.DESPESA, valor: 3500, categoria_despesa: CategoriaDespesa.COMBUSTIVEL, data_emissao: '2024-11-20' },
        { tipo: TipoTransacao.DESPESA, valor: 1200, categoria_despesa: CategoriaDespesa.MANUTENCAO, data_emissao: '2024-11-15' },
        { tipo: TipoTransacao.DESPESA, valor: 850, categoria_despesa: CategoriaDespesa.PECAS, data_emissao: '2024-11-18' },
        { tipo: TipoTransacao.DESPESA, valor: 2200, categoria_despesa: CategoriaDespesa.SEGURO, data_emissao: '2024-11-01' },
    ];

    // Análise financeira
    const analise = useMemo(() => {
        const receitas = mockTransacoes
            .filter(t => t.tipo === TipoTransacao.RECEITA)
            .reduce((sum, t) => sum + t.valor, 0);

        const despesas = mockTransacoes
            .filter(t => t.tipo === TipoTransacao.DESPESA)
            .reduce((sum, t) => sum + t.valor, 0);

        const lucroLiquido = receitas - despesas;
        const margemLucro = receitas > 0 ? (lucroLiquido / receitas) * 100 : 0;

        // Receitas por categoria
        const receitasPorCategoria: Record<CategoriaReceita, number> = {} as any;
        Object.values(CategoriaReceita).forEach(cat => {
            receitasPorCategoria[cat] = mockTransacoes
                .filter(t => t.tipo === TipoTransacao.RECEITA && t.categoria_receita === cat)
                .reduce((sum, t) => sum + t.valor, 0);
        });

        // Despesas por categoria
        const despesasPorCategoria: Record<CategoriaDespesa, number> = {} as any;
        Object.values(CategoriaDespesa).forEach(cat => {
            despesasPorCategoria[cat] = mockTransacoes
                .filter(t => t.tipo === TipoTransacao.DESPESA && t.categoria_despesa === cat)
                .reduce((sum, t) => sum + t.valor, 0);
        });

        return {
            receitas,
            despesas,
            lucroLiquido,
            margemLucro,
            receitasPorCategoria,
            despesasPorCategoria
        };
    }, []);

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formatPercentage = (value: number) => {
        return value.toFixed(2) + '%';
    };

    const handleExportDRE = () => {
        alert('Exportar DRE em PDF/Excel - Função em desenvolvimento');
    };

    const handleExportFluxo = () => {
        alert('Exportar Fluxo de Caixa em PDF/Excel - Função em desenvolvimento');
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
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Relatórios Financeiros</h1>
                        <p className="text-slate-500 dark:text-slate-400">Análises e demonstrativos contábeis</p>
                    </div>
                </div>
            </div>

            {/* Seletor de Período */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Período Inicial
                        </label>
                        <div className="relative">
                            <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="date"
                                value={periodoInicio}
                                onChange={e => setPeriodoInicio(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Período Final
                        </label>
                        <div className="relative">
                            <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="date"
                                value={periodoFim}
                                onChange={e => setPeriodoFim(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* DRE - Demonstrativo de Resultados */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                                <FileText size={20} />
                                DRE - Demonstrativo de Resultados do Exercício
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Período: {periodoInicio} a {periodoFim}
                            </p>
                        </div>
                        <button
                            onClick={handleExportDRE}
                            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                        >
                            <Download size={16} />
                            Exportar
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {/* Receitas */}
                    <div>
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <TrendingUp size={18} className="text-green-600" />
                                RECEITAS OPERACIONAIS
                            </h3>
                            <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(analise.receitas)}
                            </span>
                        </div>
                        <div className="space-y-2 ml-6">
                            {Object.entries(analise.receitasPorCategoria).filter(([_, valor]) => (valor as number) > 0).map(([categoria, valor]) => (
                                <div key={categoria} className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">{categoria}</span>
                                    <span className="font-medium text-slate-800 dark:text-white">
                                        {formatCurrency(valor as number)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Despesas */}
                    <div>
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <TrendingDown size={18} className="text-red-600" />
                                DESPESAS OPERACIONAIS
                            </h3>
                            <span className="text-lg font-bold text-red-600 dark:text-red-400">
                                ({formatCurrency(analise.despesas)})
                            </span>
                        </div>
                        <div className="space-y-2 ml-6">
                            {Object.entries(analise.despesasPorCategoria).filter(([_, valor]) => (valor as number) > 0).map(([categoria, valor]) => (
                                <div key={categoria} className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">{categoria}</span>
                                    <span className="font-medium text-slate-800 dark:text-white">
                                        ({formatCurrency(valor as number)})
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Resultado */}
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 mt-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                <DollarSign size={20} />
                                LUCRO/PREJUÍZO LÍQUIDO
                            </h3>
                            <span className={`text-2xl font-bold ${analise.lucroLiquido >= 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                                }`}>
                                {formatCurrency(analise.lucroLiquido)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-400">Margem de Lucro</span>
                            <span className={`font-semibold ${analise.margemLucro >= 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                                }`}>
                                {formatPercentage(analise.margemLucro)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fluxo de Caixa Simplificado */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                                <TrendingUp size={20} />
                                Fluxo de Caixa
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Movimentação financeira do período
                            </p>
                        </div>
                        <button
                            onClick={handleExportFluxo}
                            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                        >
                            <Download size={16} />
                            Exportar
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp size={18} className="text-green-600 dark:text-green-400" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Entradas</span>
                            </div>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(analise.receitas)}
                            </p>
                        </div>

                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingDown size={18} className="text-red-600 dark:text-red-400" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Saídas</span>
                            </div>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {formatCurrency(analise.despesas)}
                            </p>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign size={18} className="text-blue-600 dark:text-blue-400" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Saldo</span>
                            </div>
                            <p className={`text-2xl font-bold ${analise.lucroLiquido >= 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                                }`}>
                                {formatCurrency(analise.lucroLiquido)}
                            </p>
                        </div>
                    </div>

                    {/* Barra Visual */}
                    <div className="mt-6">
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-slate-600 dark:text-slate-400">Distribuição</span>
                            <span className="text-slate-600 dark:text-slate-400">
                                {formatPercentage((analise.receitas / (analise.receitas + analise.despesas)) * 100)} Receitas |
                                {formatPercentage((analise.despesas / (analise.receitas + analise.despesas)) * 100)} Despesas
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 flex overflow-hidden">
                            <div
                                className="bg-green-500 dark:bg-green-600"
                                style={{ width: `${(analise.receitas / (analise.receitas + analise.despesas)) * 100}%` }}
                            />
                            <div
                                className="bg-red-500 dark:bg-red-600"
                                style={{ width: `${(analise.despesas / (analise.receitas + analise.despesas)) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
