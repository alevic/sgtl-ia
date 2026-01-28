import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, PieChart, TrendingUp, TrendingDown, DollarSign,
    BarChart3, Calendar, Filter, Download, Plus, Layers, Edit2, Trash2, X
} from 'lucide-react';
import {
    ITransacao, TipoTransacao, ClassificacaoContabil, Moeda, ICostCenter, IFinanceCategory
} from '@/types';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/Layout/PageHeader';
import { DashboardCard } from '../components/Layout/DashboardCard';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

export const CentrosCusto: React.FC = () => {
    const navigate = useNavigate();
    const { currentContext } = useApp();
    const [periodoInicio, setPeriodoInicio] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    });
    const [periodoFim, setPeriodoFim] = useState(() => {
        const d = new Date();
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    });
    const [transacoes, setTransacoes] = useState<ITransacao[]>([]);
    const [costCenters, setCostCenters] = useState<ICostCenter[]>([]);
    const [categories, setCategories] = useState<IFinanceCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [transRes, centersRes, catsRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/api/finance/transactions`, { credentials: 'include' }),
                fetch(`${import.meta.env.VITE_API_URL}/api/finance/cost-centers`, { credentials: 'include' }),
                fetch(`${import.meta.env.VITE_API_URL}/api/finance/categories`, { credentials: 'include' })
            ]);

            if (transRes.ok) setTransacoes(await transRes.json());
            if (centersRes.ok) setCostCenters(await centersRes.json());
            if (catsRes.ok) setCategories(await catsRes.json());
        } catch (error) {
            console.error("Erro ao buscar dados:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
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

    const analiseDespesas = useMemo(() => {
        return costCenters.map(cc => {
            const total = dadosFiltrados
                .filter(t => t.tipo === TipoTransacao.EXPENSE && (t.cost_center_id === cc.id || t.centro_custo === cc.name))
                .reduce((acc, t) => acc + Number(t.valor), 0);

            const percentual = kpis.despesas > 0 ? (total / kpis.despesas) * 100 : 0;

            return { id: cc.id, name: cc.name, total, percentual };
        }).sort((a, b) => b.total - a.total);
    }, [dadosFiltrados, kpis.despesas, costCenters]);

    const analiseReceitas = useMemo(() => {
        return costCenters.map(cc => {
            const total = dadosFiltrados
                .filter(t => t.tipo === TipoTransacao.INCOME && (t.cost_center_id === cc.id || t.centro_custo === cc.name))
                .reduce((acc, t) => acc + Number(t.valor), 0);

            const percentual = kpis.receitas > 0 ? (total / kpis.receitas) * 100 : 0;

            return { id: cc.id, name: cc.name, total, percentual };
        }).sort((a, b) => b.total - a.total);
    }, [dadosFiltrados, kpis.receitas, costCenters]);

    const analisePorClassificacao = useMemo(() => {
        const classificacoes = Object.values(ClassificacaoContabil);
        return classificacoes.map(classificacao => {
            const total = dadosFiltrados
                .filter(t => t.tipo === TipoTransacao.EXPENSE && t.classificacao_contabil === classificacao)
                .reduce((acc, t) => acc + Number(t.valor), 0);

            const percentual = kpis.despesas > 0 ? (total / kpis.despesas) * 100 : 0;

            return { classificacao, total, percentual };
        }).sort((a, b) => b.total - a.total);
    }, [dadosFiltrados, kpis.despesas]);

    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatPercent = (val: number) => val.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%';

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <PageHeader
                title="Gestão de Custos"
                subtitle="Análise estratégica de rentabilidade por centros de responsabilidade"
                icon={PieChart}
                backLink="/admin/financeiro"
                backLabel="Painel Financeiro"
                rightElement={
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => navigate('/admin/cadastros-auxiliares')}
                            className="h-10 rounded-sm px-4 text-[10px] font-black uppercase tracking-widest border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                        >
                            <Layers size={16} className="mr-2" />
                            Gerenciar Estrutura
                        </Button>
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
                    </div>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <DashboardCard title="Volume Receita" value={formatCurrency(kpis.receitas)} icon={TrendingUp} variant="emerald" />
                <DashboardCard title="Volume Despesa" value={formatCurrency(kpis.despesas)} icon={TrendingDown} variant="rose" />
                <DashboardCard title="EBITDA / Resultado" value={formatCurrency(kpis.resultado)} icon={DollarSign} variant={kpis.resultado >= 0 ? "indigo" : "amber"} />
                <DashboardCard title="Margem Operacional" value={formatPercent(kpis.margem)} icon={PieChart} variant="slate" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm p-8">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-8 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={20} className="text-emerald-500" />
                            Receitas por Centro de Custo
                        </div>
                    </h2>
                    <div className="space-y-6">
                        {costCenters.length === 0 ? (
                            <p className="text-center text-muted-foreground text-xs uppercase tracking-widest py-10">Nenhum centro de custo cadastrado</p>
                        ) : analiseReceitas.filter(i => i.total > 0).length === 0 ? (
                            <p className="text-center text-muted-foreground text-xs uppercase tracking-widest py-10">Todas as receitas são R$ 0,00</p>
                        ) : analiseReceitas.filter(i => i.total > 0).map((item) => (
                            <div key={item.id} className="group">
                                <div className="flex justify-between items-start text-sm mb-2">
                                    <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">{item.name}</span>
                                    <span className="text-slate-500 font-mono">
                                        {formatCurrency(item.total)} ({formatPercent(item.percentual)})
                                    </span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${item.percentual}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm p-8">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-8 flex items-center gap-2">
                        <TrendingDown size={20} className="text-rose-500" />
                        Despesas por Centro de Custo
                    </h2>
                    <div className="space-y-6">
                        {analiseDespesas.length === 0 ? (
                            <p className="text-center text-muted-foreground text-xs uppercase tracking-widest py-10">Nenhum centro de custo carregado</p>
                        ) : analiseDespesas.filter(i => i.total > 0).length === 0 ? (
                            <p className="text-center text-muted-foreground text-xs uppercase tracking-widest py-10">Todas as despesas são R$ 0,00</p>
                        ) : analiseDespesas.filter(i => i.total > 0).map((item) => (
                            <div key={item.id} className="group">
                                <div className="flex justify-between items-start text-sm mb-2">
                                    <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">{item.name}</span>
                                    <span className="text-slate-500 font-mono">
                                        {formatCurrency(item.total)} ({formatPercent(item.percentual)})
                                    </span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className="bg-rose-500 h-full rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${item.percentual}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm p-8">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-8 flex items-center gap-2">
                        <Filter size={20} className="text-indigo-500" />
                        Classificação Contábil (Despesas)
                    </h2>
                    <div className="space-y-6">
                        {analisePorClassificacao.length === 0 ? (
                            <p className="text-center text-muted-foreground text-xs uppercase tracking-widest py-10">Sem movimentação no período</p>
                        ) : analisePorClassificacao.filter(i => i.total > 0).length === 0 ? (
                            <p className="text-center text-muted-foreground text-xs uppercase tracking-widest py-10">Todas as classificações são R$ 0,00</p>
                        ) : analisePorClassificacao.filter(i => i.total > 0).map((item) => (
                            <div key={item.classificacao}>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                                        {item.classificacao.replace('_', ' ')}
                                    </span>
                                    <span className="text-slate-500 font-mono">
                                        {formatCurrency(item.total)} ({formatPercent(item.percentual)})
                                    </span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className="bg-slate-800 h-full rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${item.percentual}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
