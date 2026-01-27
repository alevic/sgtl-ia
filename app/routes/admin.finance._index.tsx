import React, { useState, useMemo } from 'react';
import { data as json } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData, useNavigate, Link, useFetcher } from "react-router";
import {
    DollarSign, TrendingUp, TrendingDown, Calendar, Plus, FileText,
    CreditCard, AlertCircle, ArrowUpRight, ArrowDownRight, PieChart,
    Wallet, Receipt, ArrowUpDown, ChevronRight, Inbox, Loader2
} from 'lucide-react';
import { ITransacao, TipoTransacao, StatusTransacao, StatusTransacaoLabel } from '@/types';
import { db } from "@/db/db.server";
import { transaction as transactionTable } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { useApp } from '@/context/AppContext';
import { useDateFormatter } from '@/hooks/useDateFormatter';
import { TransactionActions } from '@/components/Financeiro/TransactionActions';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/Layout/PageHeader";
import { DashboardCard } from "@/components/Layout/DashboardCard";
import { cn } from "@/lib/utils";

export const loader = async ({ request, params }: { request: Request, params: any }) => {
    const transactionsData = await db.select().from(transactionTable).orderBy(desc(transactionTable.date)).limit(50);
    return json({
        transactions: transactionsData
    });
};

export const action = async ({ request, params }: { request: Request, params: any }) => {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const id = formData.get("id") as string;

    if (intent === "delete") {
        await db.delete(transactionTable).where(eq(transactionTable.id, id));
        return json({ success: true, message: "Transação excluída" });
    }

    return null;
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const configs: any = {
        [StatusTransacao.PAID]: { className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
        [StatusTransacao.PENDING]: { className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
        [StatusTransacao.OVERDUE]: { className: "bg-destructive/10 text-destructive border-destructive/20" },
        [StatusTransacao.CANCELLED]: { className: "bg-muted text-muted-foreground border-border" },
        [StatusTransacao.PARTIALLY_PAID]: { className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    };

    const config = configs[status] || configs[StatusTransacao.PENDING];

    return (
        <Badge variant="outline" className={cn("font-bold px-2 py-0.5 rounded-xl text-[12px] uppercase tracking-wider", config.className)}>
            {StatusTransacaoLabel[status as StatusTransacao] || status}
        </Badge>
    );
};

export default function FinancePage() {
    const { transactions: initialTransactions } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();
    const { currentContext } = useApp();
    const { formatDate: formatSystemDate } = useDateFormatter();
    const [periodoSelecionado, setPeriodoSelecionado] = useState<'mes' | 'trimestre' | 'ano'>('mes');
    const navigate = useNavigate();

    const transactions = initialTransactions as ITransacao[];

    const resumo = useMemo(() => {
        const receitas = transactions
            .filter(t => (t.type === TipoTransacao.INCOME || (t.type as any) === 'RECEITA') && t.status !== StatusTransacao.CANCELLED)
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const despesas = transactions
            .filter(t => (t.type === TipoTransacao.EXPENSE || (t.type as any) === 'DESPESA') && t.status !== StatusTransacao.CANCELLED)
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const saldo = receitas - despesas;
        const receitasPagas = transactions.filter(t => (t.type === TipoTransacao.INCOME) && t.status === StatusTransacao.PAID).reduce((sum, t) => sum + Number(t.amount), 0);
        const despesasPagas = transactions.filter(t => (t.type === TipoTransacao.EXPENSE) && t.status === StatusTransacao.PAID).reduce((sum, t) => sum + Number(t.amount), 0);
        const contasVencidas = transactions.filter(t => t.status === StatusTransacao.PENDING && t.due_date && new Date(t.due_date) < new Date()).length;

        return { receitas, despesas, saldo, receitasPagas, despesasPagas, contasVencidas };
    }, [transactions]);

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };


    return (
        <div key="finance-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <PageHeader
                title="Gestão Financeira"
                subtitle="Fluxo de caixa e controle de transações"
                rightElement={
                    <Button asChild className="h-14 px-8 rounded-xl font-black shadow-lg shadow-primary/20">
                        <Link to="/admin/finance/transactions/new">
                            <Plus size={20} className="mr-2" strokeWidth={3} />
                            NOVA TRANSAÇÃO
                        </Link>
                    </Button>
                }
            />

            <Tabs value={periodoSelecionado} onValueChange={(v: any) => setPeriodoSelecionado(v)} className="w-fit bg-muted/40 p-1 rounded-xl border border-border/50">
                <TabsList className="bg-transparent h-10 gap-1">
                    <TabsTrigger value="mes" className="rounded-xl font-bold text-xs px-6">ESTE MÊS</TabsTrigger>
                    <TabsTrigger value="trimestre" className="rounded-xl font-bold text-xs px-6">TRIMESTRE</TabsTrigger>
                    <TabsTrigger value="ano" className="rounded-xl font-bold text-xs px-6">ESTE ANO</TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardCard title="Receitas Totais" value={formatCurrency(resumo.receitas)} icon={TrendingUp} variant="emerald" trend={`${formatCurrency(resumo.receitasPagas)} recebidas`} />
                <DashboardCard title="Despesas Totais" value={formatCurrency(resumo.despesas)} icon={TrendingDown} variant="rose" trend={`${formatCurrency(resumo.despesasPagas)} pagas`} />
                <DashboardCard title="Saldo Atual" value={formatCurrency(resumo.saldo)} icon={Wallet} variant={resumo.saldo >= 0 ? "blue" : "rose"} trend={resumo.saldo >= 0 ? "Superávit" : "Déficit"} />
                <DashboardCard title="Contas Vencidas" value={resumo.contasVencidas} icon={AlertCircle} variant={resumo.contasVencidas > 0 ? "amber" : "primary"} trend={resumo.contasVencidas > 0 ? "Ação necessária" : "Em dia"} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {[
                    { label: 'Contas a Receber', icon: ArrowUpRight, color: 'emerald', path: '/admin/finance/receivables' },
                    { label: 'Contas a Pagar', icon: ArrowDownRight, color: 'red', path: '/admin/finance/payables' },
                    { label: 'Relatórios', icon: FileText, color: 'blue', path: '/admin/reports' },
                    { label: 'Centros de Custo', icon: PieChart, color: 'purple', path: '/admin/finance/cost-centers' },
                    { label: 'Conciliação', icon: Receipt, color: 'amber', path: '/admin/finance/reconciliation' }
                ].map((action, i) => (
                    <Button key={i} asChild variant="outline" className="h-24 p-5 flex items-center justify-start gap-4 bg-card/50 hover:bg-card border-border/50 transition-all group overflow-hidden active:scale-95 shadow-lg shadow-muted/10">
                        <Link to={action.path}>
                            <div className={cn("w-12 h-14 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", action.color === 'emerald' ? "bg-emerald-500/10 text-emerald-600" : action.color === 'red' ? "bg-destructive/10 text-destructive" : action.color === 'blue' ? "bg-blue-500/10 text-blue-600" : action.color === 'purple' ? "bg-purple-500/10 text-purple-600" : "bg-amber-500/10 text-amber-600")}>
                                <action.icon size={24} strokeWidth={2.5} />
                            </div>
                            <div className="space-y-0.5 ml-2">
                                <p className="font-black text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">{action.label}</p>
                            </div>
                        </Link>
                    </Button>
                ))}
            </div>

            <Card className="shadow-2xl shadow-muted/20 overflow-hidden rounded-3xl bg-card/50 backdrop-blur-sm">
                <div className="p-8 border-b border-border/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><ArrowUpDown size={20} strokeWidth={2.5} /></div>
                        <h2 className="text-xl font-black tracking-tight">Transações Recentes</h2>
                    </div>
                    <Button variant="ghost" asChild className="rounded-xl font-black text-xs hover:bg-primary/10 text-primary">
                        <Link to="/admin/finance/transactions">VER TODAS</Link>
                    </Button>
                </div>

                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="pl-8 h-14 text-table-head">Descrição / Emissão</TableHead>
                            <TableHead className="h-14 text-table-head">Tipo</TableHead>
                            <TableHead className="h-14 text-table-head">Status</TableHead>
                            <TableHead className="h-14 text-table-head">Valor</TableHead>
                            <TableHead className="pr-8 h-14 text-table-head text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="h-64 text-center"><Inbox className="w-12 h-14 mx-auto text-muted-foreground/30" /><p className="font-bold text-sm text-muted-foreground">Nenhuma transação encontrada</p></TableCell></TableRow>
                        ) : (
                            transactions.slice(0, 10).map((transacao) => {
                                const isIncome = transacao.type === TipoTransacao.INCOME || (transacao.type as any) === 'RECEITA';
                                return (
                                    <TableRow key={transacao.id} className="group hover:bg-muted/20 border-border/30 transition-colors">
                                        <TableCell className="pl-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", isIncome ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive")}>
                                                    {isIncome ? <ArrowUpRight size={20} strokeWidth={2.5} /> : <ArrowDownRight size={20} strokeWidth={2.5} />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-sm tracking-tight text-foreground">{transacao.description}</span>
                                                    <span className="text-[12px] font-bold text-muted-foreground/60">{formatSystemDate(new Date(transacao.date))}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell><Badge variant="secondary" className={cn("font-black text-[9px] uppercase", isIncome ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive")}>{isIncome ? 'Receita' : 'Despesa'}</Badge></TableCell>
                                        <TableCell><StatusBadge status={transacao.status as string} /></TableCell>
                                        <TableCell><span className={cn("text-sm font-black", isIncome ? "text-emerald-600" : "text-destructive")}>{isIncome ? '+' : '-'} {formatCurrency(Number(transacao.amount))}</span></TableCell>
                                        <TableCell className="pr-8 text-right"><TransactionActions transacao={transacao as ITransacao} onUpdate={() => navigate(".", { replace: true })} /></TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
