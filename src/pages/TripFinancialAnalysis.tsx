import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    PieChart,
    AlertCircle,
    ArrowLeft,
    Filter,
    Search,
    Download,
    Calendar,
    Tag,
    ChevronDown,
    Loader
} from 'lucide-react';
import { transactionsService } from '../services/transactionsService';
import { tripsService } from '../services/tripsService';
import { financeAuxService } from '../services/financeAuxService';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import { PageHeader } from '../components/Layout/PageHeader';
import { DashboardCard } from '../components/Layout/DashboardCard';
import { cn } from '../lib/utils';
import { ITransacao } from '@/types';

interface TripFinancialSummary {
    totalIncome: number;
    paidIncome: number;
    pendingIncome: number;
    totalExpense: number;
    paidExpense: number;
    pendingExpense: number;
    netProfit: number;
    estimatedProfit: number;
    transactionCount: number;
}

export const TripFinancialAnalysis: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { formatDate } = useDateFormatter();

    const [summary, setSummary] = useState<TripFinancialSummary | null>(null);
    const [transactions, setTransactions] = useState<ITransacao[]>([]);
    const [tripData, setTripData] = useState<any>(null);
    const [costCenters, setCostCenters] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
    const [selectedCostCenter, setSelectedCostCenter] = useState<string>('ALL');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const [summaryData, transList, trip, costCenterList, categoryList] = await Promise.all([
                transactionsService.getTripSummary(id),
                transactionsService.getTripTransactions(id),
                tripsService.getById(id),
                financeAuxService.getCostCenters(),
                financeAuxService.getCategories()
            ]);
            setSummary(summaryData);
            setTransactions(transList);
            setTripData(trip);
            setCostCenters(costCenterList);
            setCategories(categoryList);
        } catch (error) {
            console.error('Erro ao buscar dados financeiros da viagem:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const matchesType = filterType === 'ALL' || t.type === filterType;

            // Match by ID or Name for extra robustness (handles legacy data better)
            const matchesCostCenter = selectedCostCenter === 'ALL' ||
                t.cost_center_id === selectedCostCenter ||
                (t.cost_center_name && t.cost_center_name === costCenters.find(c => c.id === selectedCostCenter)?.name);

            const matchesCategory = selectedCategory === 'ALL' ||
                t.category_id === selectedCategory ||
                (t.category_name && t.category_name === categories.find(c => c.id === selectedCategory)?.name);

            const matchesSearch = (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (t.category_name || '').toLowerCase().includes(searchTerm.toLowerCase());

            return matchesType && matchesCostCenter && matchesCategory && matchesSearch;
        });
    }, [transactions, filterType, selectedCostCenter, selectedCategory, searchTerm, costCenters, categories]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader className="animate-spin text-primary" size={48} />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Analisando dados financeiros...</p>
            </div>
        );
    }

    if (!tripData) {
        return (
            <div className="text-center py-20">
                <AlertCircle size={64} className="mx-auto text-rose-500 mb-6 opacity-20" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Viagem não encontrada</h2>
                <button
                    onClick={() => navigate('/admin/viagens')}
                    className="mt-6 text-primary font-bold flex items-center justify-center gap-2 mx-auto"
                >
                    <ArrowLeft size={20} /> Voltar para Viagens
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <PageHeader
                title="Análise Gerencial Financeira"
                suffix={tripData.title || `Viagem #${tripData.id.substring(0, 8)}`}
                icon={PieChart}
                backLink="/admin/viagens"
                backLabel="Viagens"
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <DashboardCard
                    title="Total Receitas"
                    value={formatCurrency(summary?.totalIncome || 0)}
                    icon={TrendingUp}
                    variant="emerald"
                    trend={summary?.paidIncome ? (summary.paidIncome / summary.totalIncome * 100).toFixed(0) + '% Efetivado' : '0% Efetivado'}
                />
                <DashboardCard
                    title="Total Despesas"
                    value={formatCurrency(summary?.totalExpense || 0)}
                    icon={TrendingDown}
                    variant="rose"
                    trend={summary?.paidExpense ? (summary.paidExpense / summary.totalExpense * 100).toFixed(0) + '% Efetivado' : '0% Efetivado'}
                />
                <DashboardCard
                    title="Lucro Projetado"
                    value={formatCurrency(summary?.estimatedProfit || 0)}
                    icon={DollarSign}
                    variant="primary"
                    trend={summary?.estimatedProfit ? (summary.estimatedProfit / summary!.totalIncome * 100).toFixed(1) + '% de Margem' : '0% de Margem'}
                />
                <DashboardCard
                    title="Lucro Efetivado"
                    value={formatCurrency(summary?.netProfit || 0)}
                    icon={TrendingUp}
                    variant={summary?.netProfit && summary.netProfit >= 0 ? "emerald" : "rose"}
                    trend={summary?.transactionCount.toString() + ' Transações'}
                />
            </div>

            {/* Detailed Profit Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <DollarSign size={18} className="text-primary" />
                                Detalhamento de Lançamentos
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm transition-colors text-slate-500">
                                    <Download size={18} />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Table Filters */}
                            <div className="flex flex-col gap-4 mb-6">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Buscar por descrição ou categoria..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full h-11 pl-10 pr-4 bg-slate-100 dark:bg-slate-800 border-none rounded-sm text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                                        <button
                                            onClick={() => setFilterType('ALL')}
                                            className={cn(
                                                "px-4 h-11 rounded-sm text-xs font-bold uppercase tracking-widest transition-all",
                                                filterType === 'ALL' ? "bg-slate-800 dark:bg-slate-700 text-white shadow-lg" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                                            )}
                                        >
                                            Todos
                                        </button>
                                        <button
                                            onClick={() => setFilterType('INCOME')}
                                            className={cn(
                                                "px-4 h-11 rounded-sm text-xs font-bold uppercase tracking-widest transition-all",
                                                filterType === 'INCOME' ? "bg-emerald-500 text-white shadow-lg" : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                                            )}
                                        >
                                            Receitas
                                        </button>
                                        <button
                                            onClick={() => setFilterType('EXPENSE')}
                                            className={cn(
                                                "px-4 h-11 rounded-sm text-xs font-bold uppercase tracking-widest transition-all",
                                                filterType === 'EXPENSE' ? "bg-rose-500 text-white shadow-lg" : "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20"
                                            )}
                                        >
                                            Despesas
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Centro de Custo</label>
                                        <Select
                                            value={selectedCostCenter}
                                            onValueChange={(val) => {
                                                setSelectedCostCenter(val);
                                                setSelectedCategory('ALL'); // Reset category when CC changes
                                            }}
                                        >
                                            <SelectTrigger className="h-11 bg-slate-100 dark:bg-slate-800 border-none rounded-sm focus:ring-primary/20">
                                                <SelectValue placeholder="Filtrar por Centro de Custo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ALL">Todos os Centros de Custo</SelectItem>
                                                {costCenters.map(cc => (
                                                    <SelectItem key={cc.id} value={cc.id}>{cc.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Categoria Financeira</label>
                                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                            <SelectTrigger className="h-11 bg-slate-100 dark:bg-slate-800 border-none rounded-sm focus:ring-primary/20">
                                                <SelectValue placeholder="Filtrar por Categoria" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ALL">Todas as Categorias</SelectItem>
                                                {categories
                                                    .filter(cat => {
                                                        const matchesType = filterType === 'ALL' || cat.type === filterType;
                                                        const matchesCC = selectedCostCenter === 'ALL' || cat.cost_center_id === selectedCostCenter;
                                                        return matchesType && matchesCC;
                                                    })
                                                    .map(cat => (
                                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Transactions Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800">
                                            <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Data</th>
                                            <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Descrição</th>
                                            <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Categoria</th>
                                            <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Valor</th>
                                            <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                        {filteredTransactions.map((t) => (
                                            <tr key={t.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="py-4 px-2 whitespace-nowrap">
                                                    <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                                        {formatDate(t.date)}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-2">
                                                    <div className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1">
                                                        {t.description}
                                                    </div>
                                                    {t.notes && (
                                                        <div className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5">
                                                            {t.notes}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-4 px-2 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <Tag size={12} className="text-primary opacity-50" />
                                                        <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-500">
                                                            {t.category_name || 'Sem Categoria'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-2 text-right whitespace-nowrap">
                                                    <div className={cn(
                                                        "text-sm font-black",
                                                        t.type === 'INCOME' ? "text-emerald-500" : "text-rose-500"
                                                    )}>
                                                        {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(Number(t.amount))}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-2 text-center whitespace-nowrap">
                                                    <Badge className={cn(
                                                        "font-bold text-[9px] px-2 py-0.5 rounded-sm uppercase tracking-tighter transition-all",
                                                        t.status === 'PAID' ? "bg-emerald-500 text-white shadow-emerald-500/20 shadow-lg" :
                                                            t.status === 'PENDING' ? "bg-amber-500 text-white shadow-amber-500/20 shadow-lg" : "bg-slate-500 text-white"
                                                    )}>
                                                        {t.status === 'PAID' ? 'Pago' : t.status === 'PENDING' ? 'Pendente' : t.status}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredTransactions.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-12 text-center text-slate-400 uppercase tracking-widest font-bold text-xs">
                                                    Nenhuma transação encontrada para este filtro.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Real Profit Breakdown */}
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader>
                            <CardTitle className="text-sm font-black uppercase tracking-widest">Lucro Real Liquidez</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="text-center p-6 border-2 border-dashed border-primary/20 rounded-sm">
                                <div className={cn(
                                    "text-4xl font-black mb-1",
                                    (summary?.netProfit || 0) >= 0 ? "text-emerald-500" : "text-rose-500"
                                )}>
                                    {formatCurrency(summary?.netProfit || 0)}
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Saldo Efetivado em Caixa</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-white/40 dark:bg-slate-800/40 p-3 rounded-sm">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Recebido</span>
                                    <span className="text-sm font-bold text-emerald-600">{formatCurrency(summary?.paidIncome || 0)}</span>
                                </div>
                                <div className="flex justify-between items-center bg-white/40 dark:bg-slate-800/40 p-3 rounded-sm">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Pago</span>
                                    <span className="text-sm font-bold text-rose-600">{formatCurrency(summary?.paidExpense || 0)}</span>
                                </div>
                                <div className="flex justify-between items-center bg-amber-500/5 p-3 rounded-sm border border-amber-500/10">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Pendências</span>
                                    <span className="text-sm font-bold text-amber-600">{formatCurrency((summary?.pendingIncome || 0) - (summary?.pendingExpense || 0))}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Trip Info Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-black uppercase tracking-widest">Informações da Viagem</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Título</h4>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">{tripData.title}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Partida</h4>
                                    <p className="text-xs font-bold">{formatDate(tripData.departure_date)} {tripData.departure_time}</p>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Status</h4>
                                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-bold uppercase tracking-widest text-[10px]">{tripData.status}</Badge>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate(`/admin/viagens/editar/${id}`)}
                                className="w-full h-11 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-sm font-bold uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
                            >
                                Ver Detalhes da Viagem
                            </button>
                        </CardContent>
                    </Card>

                    <div className="p-4 rounded-sm bg-amber-500/5 border border-amber-500/10 flex gap-3">
                        <AlertCircle className="text-amber-500 shrink-0" size={18} />
                        <p className="text-[10px] text-amber-800 dark:text-amber-400 font-medium leading-relaxed">
                            Dados históricos podem sofrer alterações caso as transações vinculadas sejam editadas no módulo financeiro geral.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
