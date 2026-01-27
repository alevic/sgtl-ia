import React from 'react';
import { data as json, redirect } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData, useNavigate, useFetcher, Link } from "react-router";
import {
    DollarSign, ArrowUpRight, ArrowDownRight, Calendar,
    FileText, CreditCard, Clock, Tag, Briefcase,
    Edit, Trash2, CheckCircle2, XCircle, Printer, Share2,
    ChevronRight, ArrowLeftRight, Building, History
} from 'lucide-react';
import { db } from "@/db/db.server";
import { transaction as transactionTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/Layout/PageHeader';
import { cn } from '@/lib/utils';
import { TipoTransacao, StatusTransacao } from '@/types';

export const loader: LoaderFunction = async ({ params }) => {
    const { id } = params;
    if (!id) throw new Response("ID não fornecido", { status: 400 });

    const transaction = await db.query.transaction.findFirst({
        where: eq(transactionTable.id, id)
    });

    if (!transaction) throw new Response("Transação não encontrada", { status: 404 });

    return json({ transaction });
};

export const action: ActionFunction = async ({ request, params }) => {
    const { id } = params;
    if (!id) return null;

    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "delete") {
        await db.delete(transactionTable).where(eq(transactionTable.id, id));
        return redirect("/admin/finance/transactions");
    }

    if (intent === "update-status") {
        const status = formData.get("status") as string;
        await db.update(transactionTable).set({
            status,
            updatedAt: new Date()
        }).where(eq(transactionTable.id, id));
        return json({ success: true });
    }

    return null;
};

export default function TransactionDetailPage() {
    const { transaction } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();
    const navigate = useNavigate();

    const isIncome = transaction.type === TipoTransacao.INCOME;

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <PageHeader
                title={`Transação #${transaction.id.substring(0, 8)}`}
                subtitle="Detalhes do lançamento financeiro e conciliação"
                backLink="/admin/finance/transactions"
                rightElement={
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => window.print()} className="h-14 rounded-xl px-6 font-bold uppercase text-[12px] border-border/50"><Printer size={18} className="mr-2" /> Comprovante</Button>
                        <Button asChild className="h-14 rounded-xl px-8 bg-primary font-bold uppercase text-[12px] shadow-lg shadow-primary/20">
                            <Link to={`/admin/finance/transactions/edit/${transaction.id}`}>EDITAR LANÇAMENTO</Link>
                        </Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Visual Card (8/12) */}
                <div className="lg:col-span-8 space-y-8 focus-visible:outline-none">
                    <Card className={cn(
                        "rounded-[40px] overflow-hidden border-none shadow-2xl relative",
                        isIncome ? "bg-emerald-500/5" : "bg-rose-500/5"
                    )}>
                        <div className="p-12 space-y-12">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-6">
                                    <div className={cn(
                                        "w-20 h-20 rounded-3xl flex items-center justify-center transition-all shadow-xl",
                                        isIncome ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-rose-500 text-white shadow-rose-500/20"
                                    )}>
                                        {isIncome ? <ArrowUpRight size={40} strokeWidth={2.5} /> : <ArrowDownRight size={40} strokeWidth={2.5} />}
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black tracking-tighter uppercase">{transaction.description}</h2>
                                        <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{transaction.category || "Sem Categoria"}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={cn(
                                        "text-4xl font-black tracking-tighter",
                                        isIncome ? "text-emerald-600" : "text-rose-600"
                                    )}>
                                        {isIncome ? '+' : '-'} {transaction.currency} {Number(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                    <Badge variant="outline" className="rounded-lg font-black uppercase text-[10px] mt-2">{transaction.status}</Badge>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10 border-y border-border/30">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Emissão</p>
                                    <p className="text-lg font-bold">{transaction.date}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vencimento</p>
                                    <p className="text-lg font-bold">{transaction.due_date || '---'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pagamento</p>
                                    <p className="text-lg font-bold">{transaction.payment_date || 'Aguardando'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Metodo</p>
                                    <p className="text-lg font-bold uppercase">{transaction.payment_method || '---'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground">
                                        <Building size={20} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Centro de Custo</p>
                                        <p className="font-bold uppercase text-sm">{transaction.cost_center || 'Administrativo Geral'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground">
                                        <FileText size={20} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Classificação Contábil</p>
                                        <p className="font-bold uppercase text-sm">{transaction.accounting_classification || '---'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="space-y-4">
                        <h3 className="text-[12px] font-black uppercase tracking-widest text-muted-foreground ml-4 flex items-center gap-2">
                            <History size={16} /> Auditoria
                        </h3>
                        <Card className="p-8 rounded-[32px] border-none shadow-xl space-y-1 focus-visible:outline-none">
                            <p className="text-sm font-medium">Lançamento efetuado por <span className="font-black text-primary">{transaction.createdBy || 'Sistema'}</span></p>
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Registrado em {new Date(transaction.createdAt).toLocaleString()}</p>
                        </Card>
                    </div>
                </div>

                {/* Sidebar (4/12) */}
                <div className="lg:col-span-4 space-y-8">
                    <Card className="p-8 rounded-[40px] border-none shadow-2xl space-y-6">
                        <h3 className="text-[12px] font-black uppercase tracking-widest text-muted-foreground">Documento Fiscal</h3>
                        <div className="p-6 rounded-3xl bg-muted/20 border border-border/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileText className="text-muted-foreground" size={24} />
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nº Documento</p>
                                    <p className="font-bold text-sm">{transaction.document_number || 'Não Anexado'}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-8 rounded-[40px] border-none shadow-2xl space-y-6">
                        <h3 className="text-[12px] font-black uppercase tracking-widest text-muted-foreground">Observações</h3>
                        <div className="bg-card p-6 rounded-3xl border border-border/50 text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic shadow-sm">
                            "{transaction.notes || 'Sem observações registradas para este lançamento.'}"
                        </div>
                    </Card>

                    <div className="space-y-4">
                        <Button
                            variant="destructive"
                            className="w-full h-14 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-destructive/10"
                            onClick={() => {
                                if (confirm('Excluir este lançamento permanentemente?')) {
                                    fetcher.submit({ intent: 'delete' }, { method: 'post' });
                                }
                            }}
                        >
                            <Trash2 size={16} className="mr-2" /> EXCLUIR TRANSAÇÃO
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
