import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DollarSign, TrendingUp, TrendingDown, Calendar, Plus, FileText,
    CreditCard, AlertCircle, ArrowUpRight, ArrowDownRight, PieChart,
    Wallet, Receipt, ArrowUpDown, ChevronRight, Inbox, Loader2, Landmark
} from 'lucide-react';
import { ITransacao, TipoTransacao, StatusTransacao, Moeda, CategoriaReceita, CategoriaDespesa, StatusTransacaoLabel } from '@/types';
import { authClient } from '../lib/auth-client';
import { useApp } from '../context/AppContext';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { TransactionActions } from '../components/Financeiro/TransactionActions';
import { api } from '../services/api';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { PageHeader } from "../components/Layout/PageHeader";
import { DashboardCard } from "../components/Layout/DashboardCard";
import { cn } from "../lib/utils";

export const Financeiro: React.FC = () => {
    const navigate = useNavigate();
    const { currentContext } = useApp();
    const { formatDate } = useDateFormatter();
    const [periodoSelecionado, setPeriodoSelecionado] = useState<'mes' | 'trimestre' | 'ano'>('mes');
    const [transacoes, setTransacoes] = useState<ITransacao[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTransacoes = async () => {
        setIsLoading(true);
        try {
            const data = await api.get<ITransacao[]>('/api/finance/transactions');
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

    const resumo = useMemo(() => {
        const receitas = transacoes
            .filter(t => (t.type === TipoTransacao.INCOME || t.tipo === TipoTransacao.INCOME || (t.tipo as any) === 'RECEITA') && (t.status !== StatusTransacao.CANCELLED && (t.status as any) !== 'CANCELADA'))
            .reduce((sum, t) => sum + Number(t.amount || t.valor || 0), 0);

        const despesas = transacoes
            .filter(t => (t.type === TipoTransacao.EXPENSE || t.tipo === TipoTransacao.EXPENSE || (t.tipo as any) === 'DESPESA') && (t.status !== StatusTransacao.CANCELLED && (t.status as any) !== 'CANCELADA'))
            .reduce((sum, t) => sum + Number(t.amount || t.valor || 0), 0);

        const saldo = receitas - despesas;

        const receitasPagas = transacoes
            .filter(t => (t.type === TipoTransacao.INCOME || t.tipo === TipoTransacao.INCOME || (t.tipo as any) === 'RECEITA') && (t.status === StatusTransacao.PAID || (t.status as any) === 'PAGO' || (t.status as any) === 'PAGA'))
            .reduce((sum, t) => sum + Number(t.amount || t.valor || 0), 0);

        const despesasPagas = transacoes
            .filter(t => (t.type === TipoTransacao.EXPENSE || t.tipo === TipoTransacao.EXPENSE || (t.tipo as any) === 'DESPESA') && (t.status === StatusTransacao.PAID || (t.status as any) === 'PAGO' || (t.status as any) === 'PAGA'))
            .reduce((sum, t) => sum + Number(t.amount || t.valor || 0), 0);

        const contasVencidas = transacoes.filter(t => {
            if (t.status !== StatusTransacao.PENDING && (t.status as any) !== 'PENDENTE') return false;
            const dueDateVal = t.due_date || t.data_vencimento || (t as any).vencimento;
            if (!dueDateVal) return false;
            const vencimento = new Date(dueDateVal);
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
    }, [transacoes]);

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const getStatusBadge = (status: StatusTransacao) => {
        const configs: Record<string, { className: string }> = {
            [StatusTransacao.PAID]: { className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
            [StatusTransacao.PENDING]: { className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
            [StatusTransacao.OVERDUE]: { className: "bg-destructive/10 text-destructive border-destructive/20" },
            [StatusTransacao.CANCELLED]: { className: "bg-muted text-muted-foreground border-border" },
            [StatusTransacao.PARTIALLY_PAID]: { className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
            'PAGA': { className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
            'PENDENTE': { className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
            'VENCIDA': { className: "bg-destructive/10 text-destructive border-destructive/20" },
            'CANCELADA': { className: "bg-muted text-muted-foreground border-border" },
            'PARCIALMENTE_PAGA': { className: "bg-blue-500/10 text-blue-600 border-blue-500/20" }
        };

        const config = configs[status] || configs[StatusTransacao.PENDING];

        return (
            <Badge variant="outline" className={cn("font-bold px-2 py-0.5 rounded-sm text-[12px] uppercase tracking-wider", config.className)}>
                {StatusTransacaoLabel[status] || status}
            </Badge>
        );
    };

    return (
        <div key="financeiro-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header Executivo */}
            <PageHeader
                title="Gestão Financeira"
                subtitle="Fluxo de caixa e controle de transações operacional no padrão de excelência"
                rightElement={
                    <Button
                        onClick={() => navigate('/admin/financeiro/transacoes/nova')}
                        className="h-14 px-8 rounded-sm font-black shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus size={20} className="mr-2" strokeWidth={3} />
                        NOVA TRANSAÇÃO
                    </Button>
                }
            />

            {/* Period Filter */}
            <Tabs value={periodoSelecionado} onValueChange={(v: any) => setPeriodoSelecionado(v)} className="w-fit bg-muted p-1 rounded-sm border border-border/50">
                <TabsList className="bg-transparent h-10 gap-1">
                    <TabsTrigger value="mes" className="rounded-sm font-bold text-xs px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">ESTE MÊS</TabsTrigger>
                    <TabsTrigger value="trimestre" className="rounded-sm font-bold text-xs px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm uppercase">Trimestre</TabsTrigger>
                    <TabsTrigger value="ano" className="rounded-sm font-bold text-xs px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm uppercase">Este Ano</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardCard
                    title="Receitas Totais"
                    value={formatCurrency(resumo.receitas)}
                    icon={TrendingUp}
                    variant="emerald"
                    trend={`${formatCurrency(resumo.receitasPagas)} recebidas`}
                />
                <DashboardCard
                    title="Despesas Totais"
                    value={formatCurrency(resumo.despesas)}
                    icon={TrendingDown}
                    variant="rose"
                    trend={`${formatCurrency(resumo.despesasPagas)} pagas`}
                />
                <DashboardCard
                    title="Saldo Atual"
                    value={formatCurrency(resumo.saldo)}
                    icon={Wallet}
                    variant={resumo.saldo >= 0 ? "blue" : "rose"}
                    trend={resumo.saldo >= 0 ? "Superávit" : "Déficit"}
                />
                <DashboardCard
                    title="Contas Vencidas"
                    value={resumo.contasVencidas}
                    icon={AlertCircle}
                    variant={resumo.contasVencidas > 0 ? "amber" : "primary"}
                    trend={resumo.contasVencidas > 0 ? "Ação necessária" : "Em dia"}
                />
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {[
                    { label: 'Contas a Receber', icon: ArrowUpRight, color: 'emerald', path: '/admin/financeiro/contas-receber' },
                    { label: 'Contas a Pagar', icon: ArrowDownRight, color: 'red', path: '/admin/financeiro/contas-pagar' },
                    { label: 'Relatórios', icon: FileText, color: 'blue', path: '/admin/relatorios' },
                    { label: 'Contas Bancárias', icon: Landmark, color: 'emerald', path: '/admin/financeiro/contas' },
                    { label: 'Centros de Custo', icon: PieChart, color: 'purple', path: '/admin/financeiro/centros-custo' },
                    { label: 'Conciliação', icon: Receipt, color: 'amber', path: '/admin/financeiro/conciliacao' }
                ].map((action, i) => (
                    <button
                        key={i}
                        onClick={() => navigate(action.path)}
                        className="p-5 flex items-center gap-4 bg-card   rounded-sm border border-border/50 hover:border-primary/30 hover:bg-card transition-all group text-left shadow-lg shadow-muted/10 active:scale-95"
                    >
                        <div className={cn(
                            "w-12 h-14 rounded-sm flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm",
                            action.color === 'emerald' ? "bg-emerald-500/10 text-emerald-600" :
                                action.color === 'red' ? "bg-destructive/10 text-destructive" :
                                    action.color === 'blue' ? "bg-blue-500/10 text-blue-600" :
                                        action.color === 'purple' ? "bg-purple-500/10 text-purple-600" :
                                            "bg-amber-500/10 text-amber-600"
                        )}>
                            <action.icon size={24} strokeWidth={2.5} />
                        </div>
                        <div className="space-y-0.5">
                            <p className="font-black text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">{action.label}</p>
                            <p className="text-[12px] font-bold text-muted-foreground opacity-60 uppercase tracking-widest flex items-center gap-1">
                                Acessar <ChevronRight size={10} strokeWidth={3} />
                            </p>
                        </div>
                    </button>
                ))}
            </div>

            {/* Recent Transactions Table */}
            <Card className="shadow-2xl shadow-muted/20 overflow-hidden rounded-sm bg-card  ">
                <div className="p-8 border-b border-border/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-14 bg-primary/10 rounded-sm flex items-center justify-center text-primary">
                            <ArrowUpDown className="w-5 h-5 text-primary" strokeWidth={2.5} />
                        </div>
                        <h2 className="text-xl font-black tracking-tight">Transações Recentes</h2>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/admin/financeiro/transacoes')}
                        className="rounded-sm font-black text-xs hover:bg-primary/10 text-primary"
                    >
                        VER TODAS AS TRANSAÇÕES
                    </Button>
                </div>

                <Table>
                    <TableHeader className="bg-muted">
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="pl-8 h-14 text-table-head uppercase text-[10px] font-black tracking-widest">Transação / Categoria</TableHead>
                            <TableHead className="h-14 text-table-head uppercase text-[10px] font-black tracking-widest text-center">Data Emissão</TableHead>
                            <TableHead className="h-14 text-table-head uppercase text-[10px] font-black tracking-widest">Status</TableHead>
                            <TableHead className="h-14 text-table-head uppercase text-[10px] font-black tracking-widest">Valor</TableHead>
                            <TableHead className="pr-8 h-14 text-table-head text-right uppercase text-[10px] font-black tracking-widest">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center gap-3 animate-pulse">
                                        <div className="w-12 h-14 bg-primary/10 rounded-sm flex items-center justify-center text-primary">
                                            <Loader2 className="animate-spin" />
                                        </div>
                                        <p className="font-black text-sm tracking-widest text-muted-foreground uppercase">Carregando registro...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : transacoes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Inbox className="w-12 h-14 text-muted-foreground/30" />
                                        <p className="font-bold text-sm text-muted-foreground">Nenhuma transação encontrada</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            transacoes.slice(0, 10).map((transacao) => {
                                const isIncome = transacao.type === TipoTransacao.INCOME;

                                return (
                                    <TableRow key={transacao.id} className="group hover:bg-muted/40 dark:hover:bg-slate-700/50 border-border/30 transition-colors">
                                        <TableCell className="pl-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-sm flex items-center justify-center transition-transform group-hover:scale-110",
                                                    isIncome ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-destructive/10 text-destructive dark:text-rose-400"
                                                )}>
                                                    {isIncome ? <ArrowUpRight size={20} strokeWidth={2.5} /> : <ArrowDownRight size={20} strokeWidth={2.5} />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm tracking-tight text-slate-800 dark:text-slate-100">{transacao.description}</span>
                                                    <span className="text-[11px] font-bold text-muted-foreground/60 tracking-wider">
                                                        {transacao.category_name || 'Sem Categoria'}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[13px] font-bold text-slate-600 dark:text-slate-300">
                                                    {formatDate(transacao.date || transacao.data_emissao || transacao.issue_date)}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(transacao.status)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className={cn(
                                                    "text-sm font-black tracking-tight",
                                                    isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-destructive dark:text-rose-400"
                                                )}>
                                                    {isIncome ? '+' : '-'} {formatCurrency(Number(transacao.amount))}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="pr-8 text-right">
                                            <TransactionActions transacao={transacao} onUpdate={fetchTransacoes} />
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
};
