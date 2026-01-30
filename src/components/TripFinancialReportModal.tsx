import React, { useEffect, useState } from 'react';
import { X, Loader, TrendingUp, TrendingDown, DollarSign, PieChart, AlertCircle } from 'lucide-react';
import { transactionsService } from '../services/transactionsService';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

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

interface TripFinancialReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    tripId: string;
    tripData: {
        title: string;
        departureDate: string;
    };
}

export const TripFinancialReportModal: React.FC<TripFinancialReportModalProps> = ({
    isOpen,
    onClose,
    tripId,
    tripData
}) => {
    const [summary, setSummary] = useState<TripFinancialSummary | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && tripId) {
            fetchSummary();
        }
    }, [isOpen, tripId]);

    const fetchSummary = async () => {
        try {
            setLoading(true);
            const data = await transactionsService.getTripSummary(tripId);
            setSummary(data);
        } catch (error) {
            console.error('Erro ao buscar resumo financeiro:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-sm w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <PieChart className="text-primary" size={24} />
                            Relatório Financeiro da Viagem
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest font-bold">
                            {tripData.title} • {tripData.departureDate}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4">
                            <Loader className="animate-spin text-primary" size={40} />
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Consolidando balanço...</p>
                        </div>
                    ) : !summary ? (
                        <div className="text-center py-12 text-slate-500">
                            <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Não foi possível carregar os dados financeiros.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Top Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="bg-emerald-500/5 border-emerald-500/20 overflow-hidden relative group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <TrendingUp size={80} />
                                    </div>
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-emerald-500 text-white rounded-sm">
                                                <TrendingUp size={20} />
                                            </div>
                                            <h3 className="font-bold uppercase tracking-widest text-xs text-emerald-600 dark:text-emerald-400">Total de Receitas</h3>
                                        </div>
                                        <div className="text-3xl font-black text-emerald-700 dark:text-emerald-300">
                                            {formatCurrency(summary.totalIncome)}
                                        </div>
                                        <div className="mt-4 grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-tighter text-emerald-600/60">Efetivado (Pago)</p>
                                                <p className="text-sm font-bold text-emerald-600">{formatCurrency(summary.paidIncome)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-tighter text-emerald-600/60">Pendente a Receber</p>
                                                <p className="text-sm font-bold text-amber-600">{formatCurrency(summary.pendingIncome)}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-rose-500/5 border-rose-500/20 overflow-hidden relative group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <TrendingDown size={80} />
                                    </div>
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-rose-500 text-white rounded-sm">
                                                <TrendingDown size={20} />
                                            </div>
                                            <h3 className="font-bold uppercase tracking-widest text-xs text-rose-600 dark:text-rose-400">Total de Despesas</h3>
                                        </div>
                                        <div className="text-3xl font-black text-rose-700 dark:text-rose-300">
                                            {formatCurrency(summary.totalExpense)}
                                        </div>
                                        <div className="mt-4 grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-tighter text-rose-600/60">Efetivado (Pago)</p>
                                                <p className="text-sm font-bold text-rose-600">{formatCurrency(summary.paidExpense)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-tighter text-rose-600/60">Pendente a Pagar</p>
                                                <p className="text-sm font-bold text-amber-600">{formatCurrency(summary.pendingExpense)}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Net Profit Section */}
                            <div className="p-8 rounded-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div className="text-center md:text-left">
                                        <h3 className="text-lg font-black uppercase tracking-widest text-slate-800 dark:text-white">Lucro Real Efetivado</h3>
                                        <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-tighter">Balanço baseado apenas em títulos já liquidados (pagos).</p>
                                    </div>
                                    <div className={cn(
                                        "text-4xl md:text-5xl font-black",
                                        summary.netProfit >= 0 ? "text-emerald-500" : "text-rose-500"
                                    )}>
                                        {formatCurrency(summary.netProfit)}
                                    </div>
                                </div>
                                <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-8 justify-center md:justify-start">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Lucro Projetado</span>
                                        <span className="text-lg font-bold text-slate-600 dark:text-slate-300">{formatCurrency(summary.estimatedProfit)}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total de Lançamentos</span>
                                        <span className="text-lg font-bold text-slate-600 dark:text-slate-300">{summary.transactionCount}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status do Balanço</span>
                                        <Badge className={cn("mt-1 font-bold", summary.pendingIncome + summary.pendingExpense > 0 ? "bg-amber-500" : "bg-emerald-500")}>
                                            {summary.pendingIncome + summary.pendingExpense > 0 ? 'EXISTEM PENDÊNCIAS' : 'TUDO LIQUIDADO'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 rounded-sm bg-primary/5 border border-primary/10">
                                <AlertCircle className="text-primary shrink-0" size={20} />
                                <div className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed uppercase tracking-tighter">
                                    Os valores apresentados neste relatório consideram receitas de passagens, encomendas e todas as despesas vinculadas manualmente a esta viagem. Valores de manutenção não são incluídos automaticamente, a menos que vinculados via centro de custo operacional.
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 h-12 bg-slate-800 dark:bg-slate-700 text-white rounded-sm font-black uppercase tracking-widest text-xs hover:bg-slate-700 transition-all active:scale-95"
                    >
                        Fechar Relatório
                    </button>
                </div>
            </div>
        </div>
    );
};
