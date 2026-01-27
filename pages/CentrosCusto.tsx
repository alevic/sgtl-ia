import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, PieChart, TrendingUp, TrendingDown, DollarSign,
    BarChart3, Calendar, Filter, Download
} from 'lucide-react';
import {
    ITransacao, TipoTransacao, CentroCusto, ClassificacaoContabil, Moeda, StatusTransacao
} from '../types';
import { authClient } from '../lib/auth-client';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/Layout/PageHeader';
import { DashboardCard } from '../components/Layout/DashboardCard';
import { ListFilterSection } from '../components/Layout/ListFilterSection';
import { cn } from '../lib/utils';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Layers } from 'lucide-react';

export const CentrosCusto: React.FC = () => {
    const navigate = useNavigate();
    const { currentContext } = useApp();
    const [periodoInicio, setPeriodoInicio] = useState('2024-11-01');
    const [periodoFim, setPeriodoFim] = useState('2024-11-30');
    const [transacoes, setTransacoes] = useState<ITransacao[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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

    const dadosFiltrados = useMemo(() => {
        return transacoes.filter(t => {
            const data = new Date(t.data_emissao);
            return data >= new Date(periodoInicio) && data <= new Date(periodoFim);
        });
    }, [transacoes, periodoInicio, periodoFim]);

    const kpis = useMemo(() => {
        const receitas = dadosFiltrados
            .filter(t => t.tipo === TipoTransacao.INCOME)
            .reduce((acc, t) => acc + Number(t.valor), 0);

        const despesas = dadosFiltrados
            .filter(t => t.tipo === TipoTransacao.EXPENSE)
            .reduce((acc, t) => acc + Number(t.valor), 0);

        const resultado = receitas - despesas;
        const margem = receitas > 0 ? (resultado / receitas) * 100 : 0;

        return { receitas, despesas, resultado, margem };
    }, [dadosFiltrados]);

    const analisePorCentroCusto = useMemo(() => {
        const centros = Object.values(CentroCusto);
        return centros.map(centro => {
            const total = dadosFiltrados
                .filter(t => t.tipo === TipoTransacao.EXPENSE && t.centro_custo === centro)
                .reduce((acc, t) => acc + Number(t.valor), 0);

            const percentual = kpis.despesas > 0 ? (total / kpis.despesas) * 100 : 0;

            return { centro, total, percentual };
        }).sort((a, b) => b.total - a.total);
    }, [dadosFiltrados, kpis.despesas]);

    const analisePorClassificacao = useMemo(() => {
        const classificacoes = Object.values(ClassificacaoContabil);
        return classificacoes.map(classificacao => {
            const total = dadosFiltrados
                .filter(t => t.tipo === TipoTransacao.EXPENSE && t.classificacao_contabil === classificacao)
                .reduce((acc, t) => acc + t.valor, 0);

            const percentual = kpis.despesas > 0 ? (total / kpis.despesas) * 100 : 0;

            return { classificacao, total, percentual };
        }).sort((a, b) => b.total - a.total);
    }, [dadosFiltrados, kpis.despesas]);

    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatPercent = (val: number) => val.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%';

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Module */}
            <PageHeader
                title="Gestão de Custos"
                subtitle="Análise estratégica de rentabilidade por centros de responsabilidade e classificações"
                icon={PieChart}
                backLink="/admin/financeiro"
                backLabel="Painel Financeiro"
                rightElement={
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-muted p-1.5 rounded-sm border border-border/50">
                            <Input
                                type="date"
                                value={periodoInicio}
                                onChange={e => setPeriodoInicio(e.target.value)}
                                className="h-10 bg-transparent border-none focus-visible:ring-0 text-[10px] font-black uppercase tracking-widest px-4 w-36"
                            />
                            <span className="text-muted-foreground font-black">→</span>
                            <Input
                                type="date"
                                value={periodoFim}
                                onChange={e => setPeriodoFim(e.target.value)}
                                className="h-10 bg-transparent border-none focus-visible:ring-0 text-[10px] font-black uppercase tracking-widest px-4 w-36"
                            />
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => { }}
                            className="h-14 w-14 rounded-sm border-border/40 hover:bg-muted"
                        >
                            <Download size={20} />
                        </Button>
                    </div>
                }
            />

            {/* Dashboard KPIs Container */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <DashboardCard
                    title="Volume Receita"
                    value={formatCurrency(kpis.receitas)}
                    icon={TrendingUp}
                    variant="emerald"
                />
                <DashboardCard
                    title="Volume Despesa"
                    value={formatCurrency(kpis.despesas)}
                    icon={TrendingDown}
                    variant="rose"
                />
                <DashboardCard
                    title="EBITDA / Resultado"
                    value={formatCurrency(kpis.resultado)}
                    icon={DollarSign}
                    variant={kpis.resultado >= 0 ? "indigo" : "amber"}
                />
                <DashboardCard
                    title="Margem Operacional"
                    value={formatPercent(kpis.margem)}
                    icon={PieChart}
                    variant="slate"
                    trend={kpis.margem > 20 ? "Nível de excelência" : "Abaixo da meta"}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Por Centro de Custo */}
                <div className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm p-6">
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
                <div className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm p-6">
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
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-sm p-6">
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
