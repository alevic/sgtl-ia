import React, { useState } from 'react';
import { data as json } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData, useNavigate, Link, useFetcher } from "react-router";
import { useDateFormatter } from '@/hooks/useDateFormatter';
import { FretamentoStatus, FretamentoStatusLabel } from '@/types';
import {
    Bus, Building2, Calendar, DollarSign, FileText, CheckCircle, Loader,
    ChevronLeft, Plus, Search, TrendingUp, Edit, Trash2, MoreHorizontal,
    Clock, Package, MapPin, AlertTriangle
} from 'lucide-react';
import { db } from "@/db/db.server";
import { charter as charterTable, clients as clientTable } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader } from '@/components/Layout/PageHeader';
import { DashboardCard } from '@/components/Layout/DashboardCard';
import { ListFilterSection } from '@/components/Layout/ListFilterSection';
import { cn } from '@/lib/utils';

export const loader = async ({ request, params }: { request: Request, params: any }) => {
    const chartersData = await db.query.charter.findMany({
        with: {
            client: true,
        },
        orderBy: [desc(charterTable.createdAt)]
    });

    return json({ charters: chartersData });
};

export const action = async ({ request, params }: { request: Request, params: any }) => {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const id = formData.get("id") as string;

    if (intent === "delete") {
        await db.delete(charterTable).where(eq(charterTable.id, id));
        return json({ success: true, message: "Fretamento excluído" });
    }

    return null;
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const configs: Record<string, { className: string; label: string }> = {
        [FretamentoStatus.REQUEST]: { className: 'bg-slate-500/10 text-slate-600 border-slate-500/20', label: FretamentoStatusLabel[FretamentoStatus.REQUEST] },
        [FretamentoStatus.QUOTED]: { className: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: FretamentoStatusLabel[FretamentoStatus.QUOTED] },
        [FretamentoStatus.CONFIRMED]: { className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: FretamentoStatusLabel[FretamentoStatus.CONFIRMED] },
        [FretamentoStatus.IN_PROGRESS]: { className: 'bg-blue-500/10 text-blue-600 border-blue-500/20', label: FretamentoStatusLabel[FretamentoStatus.IN_PROGRESS] },
        [FretamentoStatus.COMPLETED]: { className: 'bg-slate-500/10 text-slate-600 border-slate-500/20', label: FretamentoStatusLabel[FretamentoStatus.COMPLETED] },
        [FretamentoStatus.CANCELLED]: { className: 'bg-rose-500/10 text-rose-600 border-rose-500/20', label: FretamentoStatusLabel[FretamentoStatus.CANCELLED] },
    };

    const config = configs[status] || configs[FretamentoStatus.REQUEST];

    return (
        <Badge variant="outline" className={cn('rounded-lg font-bold px-2 py-0.5 border-none', config.className)}>
            {config.label}
        </Badge>
    );
};

export default function CharterPage() {
    const { charters: initialCharters } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();
    const navigate = useNavigate();
    const { formatDate } = useDateFormatter();
    const [busca, setBusca] = useState('');
    const [statusFilter, setStatusFilter] = useState('todos');
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const charters = initialCharters as any[];

    // Calculate KPIs
    const totalSolicitacoes = charters.length;
    const orcamentosPendentes = charters.filter(f => f.status === FretamentoStatus.REQUEST).length;
    const contratosAtivos = charters.filter(f => f.status === FretamentoStatus.CONFIRMED || f.status === FretamentoStatus.IN_PROGRESS).length;
    const receitaProjetada = charters
        .filter(f => f.status === FretamentoStatus.CONFIRMED || f.status === FretamentoStatus.IN_PROGRESS)
        .reduce((sum, f) => sum + Number(f.total_value || 0), 0);

    const filteredCharters = charters.filter(f => {
        const matchesSearch =
            (f.origin?.toLowerCase().includes(busca.toLowerCase())) ||
            (f.destination?.toLowerCase().includes(busca.toLowerCase())) ||
            (f.client?.nome?.toLowerCase().includes(busca.toLowerCase()));

        const matchesStatus = statusFilter === 'todos' ||
            (statusFilter === 'solicitacao' && f.status === FretamentoStatus.REQUEST) ||
            (statusFilter === 'orcamento' && f.status === FretamentoStatus.QUOTED) ||
            (statusFilter === 'confirmado' && f.status === FretamentoStatus.CONFIRMED) ||
            (statusFilter === 'andamento' && f.status === FretamentoStatus.IN_PROGRESS);

        return matchesSearch && matchesStatus;
    });

    return (
        <div key="charter-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <PageHeader
                title="Fretamento B2B"
                subtitle="Gestão corporativa de aluguel de frota"
                icon={Building2}
                rightElement={
                    <Button asChild className="h-14 px-6 rounded-xl font-semibold gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                        <Link to="/admin/charter/new">
                            <Plus size={20} strokeWidth={2.5} />
                            NOVA SOLICITAÇÃO
                        </Link>
                    </Button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <DashboardCard title="Total de Solicitações" value={totalSolicitacoes} icon={FileText} variant="primary" />
                <DashboardCard title="Orçamentos Pendentes" value={orcamentosPendentes} icon={Clock} variant="amber" />
                <DashboardCard title="Contratos Ativos" value={contratosAtivos} icon={CheckCircle} variant="emerald" />
                <DashboardCard title="Receita Projetada" value={`R$ ${(receitaProjetada / 1000).toFixed(0)}k`} icon={TrendingUp} variant="blue" />
            </div>

            <ListFilterSection>
                <div className="space-y-1.5 flex flex-col lg:col-span-2">
                    <label className="text-label-caps ml-1">Buscar Solicitação</label>
                    <div className="relative group flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                        <Input
                            placeholder="Cliente, origem ou destino..."
                            className="pl-12 h-14 bg-muted/40 border-input rounded-xl font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary/20"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-1.5 flex flex-col lg:col-span-2">
                    <label className="text-label-caps ml-1">Status da Solicitação</label>
                    <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
                        <TabsList className="bg-muted/40 p-1.5 rounded-xl h-14 flex w-full border border-border/50">
                            <TabsTrigger value="todos" className="flex-1 rounded-xl px-2 font-black text-[10px] tracking-widest">TODOS</TabsTrigger>
                            <TabsTrigger value="solicitacao" className="flex-1 rounded-xl px-2 font-black text-[10px] tracking-widest">SOLICIT.</TabsTrigger>
                            <TabsTrigger value="orcamento" className="flex-1 rounded-xl px-2 font-black text-[10px] tracking-widest">ORÇAM.</TabsTrigger>
                            <TabsTrigger value="confirmado" className="flex-1 rounded-xl px-2 font-black text-[10px] tracking-widest">CONFIRM.</TabsTrigger>
                            <TabsTrigger value="andamento" className="flex-1 rounded-xl px-2 font-black text-[10px] tracking-widest">ATIVO</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </ListFilterSection>

            <Card className="border-none shadow-2xl shadow-muted/20 overflow-hidden rounded-[2.5rem] bg-card/50 backdrop-blur-sm">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="pl-8 h-14 text-table-head">Cliente</TableHead>
                            <TableHead className="h-14 text-table-head">Rota</TableHead>
                            <TableHead className="h-14 text-table-head">Período</TableHead>
                            <TableHead className="h-14 text-table-head">Valor</TableHead>
                            <TableHead className="h-14 text-table-head">Status</TableHead>
                            <TableHead className="pr-8 text-right h-14 text-table-head">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCharters.map((fretamento) => (
                            <TableRow key={fretamento.id} className="group hover:bg-muted/20 border-border/30 transition-colors h-24">
                                <TableCell className="pl-8">
                                    <div className="space-y-1">
                                        <div className="font-semibold text-base group-hover:text-primary transition-colors">
                                            {fretamento.client?.nome || 'Cliente Indefinido'}
                                        </div>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">ID: {fretamento.id.substring(0, 8)}</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm font-bold">
                                            <MapPin size={14} className="text-emerald-500" />
                                            {fretamento.origin}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                                            <MapPin size={14} className="text-rose-500" />
                                            {fretamento.destination}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1 text-xs font-bold">
                                        <div className="flex items-center gap-1.5"><Calendar size={14} className="text-primary" /> {formatDate(fretamento.start_date)}</div>
                                        <div className="text-muted-foreground opacity-60 ml-5">até {formatDate(fretamento.end_date)}</div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-black text-base text-emerald-600 tracking-tighter">
                                        {fretamento.currency || 'R$'} {Number(fretamento.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </div>
                                </TableCell>
                                <TableCell><StatusBadge status={fretamento.status} /></TableCell>
                                <TableCell className="pr-8 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl transition-all hover:bg-muted/80">
                                                <MoreHorizontal size={20} />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 bg-card/95 backdrop-blur-md shadow-2xl border-none">
                                            <DropdownMenuItem asChild className="rounded-xl h-11 px-3 cursor-pointer"><Link to={`/admin/charter/${fretamento.id}`} className="flex items-center gap-3 font-bold text-xs uppercase tracking-widest"><FileText size={16} /> Ver Detalhes</Link></DropdownMenuItem>
                                            <DropdownMenuItem className="rounded-xl h-11 px-3 cursor-pointer flex items-center gap-3 font-bold text-xs uppercase tracking-widest"><Edit size={16} /> Editar</DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-border/40 my-1" />
                                            <DropdownMenuItem onClick={() => setItemToDelete(fretamento.id)} className="rounded-xl h-11 px-3 cursor-pointer flex items-center gap-3 font-bold text-xs uppercase tracking-widest text-destructive focus:bg-destructive/10"><Trash2 size={16} /> Excluir</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
                <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl bg-card/95 backdrop-blur-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter">Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription className="font-medium text-muted-foreground">
                            Tem certeza que deseja excluir esta solicitação de fretamento? Esta ação é irreversível e removerá todos os dados associados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel className="rounded-xl font-bold border-none bg-muted hover:bg-muted/80 h-12 px-6">CANCELAR</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (itemToDelete) {
                                    fetcher.submit({ intent: "delete", id: itemToDelete }, { method: "post" });
                                    setItemToDelete(null);
                                }
                            }}
                            className="rounded-xl font-black uppercase text-[10px] tracking-widest bg-destructive text-destructive-foreground hover:bg-destructive/90 h-12 px-8"
                        >
                            CONFIRMAR EXCLUSÃO
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
