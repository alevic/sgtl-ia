import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { IFretamento, IClienteCorporativo, Moeda, FretamentoStatus, FretamentoStatusLabel } from '../types';
import {
    Bus, Building2, Calendar, DollarSign, FileText, CheckCircle, Loader,
    ChevronLeft, Plus, Search, TrendingUp, Edit, Trash2, MoreHorizontal,
    Clock, Package
} from 'lucide-react';
import { chartersService } from '../services/chartersService';
import { clientsService } from '../services/clientsService';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { AlertTriangle } from 'lucide-react';
import { PageHeader } from '../components/Layout/PageHeader';
import { DashboardCard } from '../components/Layout/DashboardCard';
import { ListFilterSection } from '../components/Layout/ListFilterSection';
import { cn } from '../lib/utils';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const configs: Record<string, { className: string; label: string }> = {
        [FretamentoStatus.REQUEST]: { className: 'bg-slate-500/10 text-slate-600', label: FretamentoStatusLabel[FretamentoStatus.REQUEST] },
        [FretamentoStatus.QUOTED]: { className: 'bg-amber-500/10 text-amber-600', label: FretamentoStatusLabel[FretamentoStatus.QUOTED] },
        [FretamentoStatus.CONFIRMED]: { className: 'bg-emerald-500/10 text-emerald-600', label: FretamentoStatusLabel[FretamentoStatus.CONFIRMED] },
        [FretamentoStatus.IN_PROGRESS]: { className: 'bg-blue-500/10 text-blue-600', label: FretamentoStatusLabel[FretamentoStatus.IN_PROGRESS] },
        [FretamentoStatus.COMPLETED]: { className: 'bg-slate-500/10 text-slate-600', label: FretamentoStatusLabel[FretamentoStatus.COMPLETED] },
        [FretamentoStatus.CANCELLED]: { className: 'bg-rose-500/10 text-rose-600', label: FretamentoStatusLabel[FretamentoStatus.CANCELLED] },
    };

    const config = configs[status] || configs[FretamentoStatus.REQUEST];

    return (
        <Badge className={cn('rounded-sm font-bold px-2 py-0.5', config.className)}>
            {config.label}
        </Badge>
    );
};

export const Fretamento: React.FC = () => {
    const navigate = useNavigate();
    const { formatDate } = useDateFormatter();
    const [loading, setLoading] = useState(true);
    const [fretamentos, setFretamentos] = useState<IFretamento[]>([]);
    const [clientes, setClientes] = useState<any[]>([]);
    const [busca, setBusca] = useState('');
    const [statusFilter, setStatusFilter] = useState('todos');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [chartersData, clientsData] = await Promise.all([
                chartersService.getAll(),
                clientsService.getAll()
            ]);
            setFretamentos(chartersData);
            setClientes(clientsData);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCliente = (clienteId: string) => {
        return clientes.find(c => c.id === clienteId);
    };

    const handleDelete = async (id: string) => {
        try {
            setError(null);
            await chartersService.delete(id);
            setSuccess('Solicitação excluída com sucesso!');
            setTimeout(() => setSuccess(null), 3000);
            loadData();
        } catch (error: any) {
            console.error('Erro ao excluir:', error);
            setError('Erro ao excluir solicitação. Por favor, tente novamente.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setItemToDelete(null);
        }
    };

    // Calculate KPIs
    const totalSolicitacoes = fretamentos.length;
    const orcamentosPendentes = fretamentos.filter(f => f.status === FretamentoStatus.REQUEST || f.status === 'PENDING' || f.status === 'SOLICITACAO').length;
    const contratosAtivos = fretamentos.filter(f => f.status === FretamentoStatus.CONFIRMED || f.status === FretamentoStatus.IN_PROGRESS).length;
    const receitaProjetada = fretamentos
        .filter(f => f.status === FretamentoStatus.CONFIRMED || f.status === FretamentoStatus.IN_PROGRESS)
        .reduce((sum, f) => sum + (f.quote_price || f.valor_total || 0), 0);

    // Filter fretamentos
    const fretamentosFiltrados = fretamentos.filter(f => {
        const matchesSearch =
            (f.origin_city?.toLowerCase().includes(busca.toLowerCase())) ||
            (f.destination_city?.toLowerCase().includes(busca.toLowerCase())) ||
            (f.company_name?.toLowerCase().includes(busca.toLowerCase())) ||
            (f.contact_name?.toLowerCase().includes(busca.toLowerCase()));

        const matchesStatus = statusFilter === 'todos' ||
            (statusFilter === 'solicitacao' && (f.status === FretamentoStatus.REQUEST || f.status === 'PENDING')) ||
            (statusFilter === 'orcamento' && f.status === FretamentoStatus.QUOTED) ||
            (statusFilter === 'confirmado' && f.status === FretamentoStatus.CONFIRMED) ||
            (statusFilter === 'andamento' && f.status === FretamentoStatus.IN_PROGRESS);

        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div key="fretamento-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {error && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <AlertTriangle size={16} />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {success && (
                <Alert className="border-emerald-500 text-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 animate-in fade-in slide-in-from-top-2 duration-300">
                    <CheckCircle size={16} className="text-emerald-600" />
                    <AlertTitle>Sucesso</AlertTitle>
                    <AlertDescription>{success}</AlertDescription>
                </Alert>
            )}
            {/* Executive Header */}
            <PageHeader
                title="Fretamento B2B"
                subtitle="Gestão corporativa de aluguel de frota"
                icon={Building2}
                rightElement={
                    <Button onClick={() => navigate('/admin/fretamento/novo')} className="h-14 px-6 rounded-sm font-semibold gap-2 shadow-lg shadow-primary/20">
                        <Plus size={20} strokeWidth={2.5} />
                        NOVA SOLICITAÇÃO
                    </Button>
                }
            />

            {/* Executive KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <DashboardCard
                    title="Total de Solicitações"
                    value={totalSolicitacoes}
                    icon={FileText}
                    variant="primary"
                />
                <DashboardCard
                    title="Orçamentos Pendentes"
                    value={orcamentosPendentes}
                    icon={Clock}
                    variant="amber"
                />
                <DashboardCard
                    title="Contratos Ativos"
                    value={contratosAtivos}
                    icon={CheckCircle}
                    variant="emerald"
                />
                <DashboardCard
                    title="Receita Projetada"
                    value={`R$ ${(receitaProjetada / 1000).toFixed(0)}k`}
                    icon={TrendingUp}
                    variant="blue"
                />
            </div>

            {/* Executive Filters Module */}
            <ListFilterSection>
                {/* Busca */}
                <div className="space-y-1.5 flex flex-col lg:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80 ml-1">Buscar Solicitação</label>
                    <div className="relative group flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                        <Input
                            placeholder="Cliente, origem ou destino..."
                            className="pl-12 h-14 bg-muted border-input rounded-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary/20"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                        />
                    </div>
                </div>

                {/* Status Tabs */}
                <div className="space-y-1.5 flex flex-col lg:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80 ml-1">Status da Solicitação</label>
                    <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
                        <TabsList className="bg-muted p-1.5 rounded-sm h-14 flex w-full border border-border/50">
                            <TabsTrigger value="todos" className="flex-1 rounded-sm px-2 font-black text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm">TODOS</TabsTrigger>
                            <TabsTrigger value="solicitacao" className="flex-1 rounded-sm px-2 font-black text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">SOLICIT.</TabsTrigger>
                            <TabsTrigger value="orcamento" className="flex-1 rounded-sm px-2 font-black text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">ORÇAM.</TabsTrigger>
                            <TabsTrigger value="confirmado" className="flex-1 rounded-sm px-2 font-black text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">CONFIRM.</TabsTrigger>
                            <TabsTrigger value="andamento" className="flex-1 rounded-sm px-2 font-black text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">ATIVO</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </ListFilterSection>

            {/* Executive Table Module */}
            {fretamentosFiltrados.length === 0 ? (
                <div className="bg-card   rounded-sm border border-dashed border-border p-12 text-center">
                    <Bus size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-bold tracking-tight mb-2">Nenhuma solicitação encontrada</h3>
                    <p className="text-muted-foreground font-medium mb-6">Tente ajustar seus filtros ou crie uma nova solicitação.</p>
                </div>
            ) : (
                <Card className="border-none shadow-2xl shadow-muted/20 overflow-hidden rounded-sm bg-card  ">
                    <Table>
                        <TableHeader className="bg-muted">
                            <TableRow className="hover:bg-transparent border-border/50">
                                <TableHead className="pl-8 h-14 text-[12px] font-semibold uppercase tracking-widest">Cliente</TableHead>
                                <TableHead className="h-14 text-[12px] font-semibold uppercase tracking-widest">Rota</TableHead>
                                <TableHead className="h-14 text-[12px] font-semibold uppercase tracking-widest">Período</TableHead>
                                <TableHead className="h-14 text-[12px] font-semibold uppercase tracking-widest">Valor</TableHead>
                                <TableHead className="h-14 text-[12px] font-semibold uppercase tracking-widest">Status</TableHead>
                                <TableHead className="pr-8 text-right h-14 text-[12px] font-semibold uppercase tracking-widest">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fretamentosFiltrados.map((fretamento: any) => {
                                const cliente = getCliente(fretamento.client_id);
                                const origem = fretamento.origin_city ? `${fretamento.origin_city}, ${fretamento.origin_state}` : fretamento.origem;
                                const destino = fretamento.destination_city ? `${fretamento.destination_city}, ${fretamento.destination_state}` : fretamento.destino;
                                const dataInicio = fretamento.departure_date || fretamento.data_inicio;
                                const dataFim = fretamento.return_date || fretamento.data_fim;
                                const valorTotal = fretamento.quote_price || fretamento.valor_total || 0;

                                return (
                                    <TableRow key={fretamento.id} className="group hover:bg-muted border-border/30 transition-colors">
                                        <TableCell className="pl-8 py-5">
                                            <div className="space-y-1">
                                                <div className="font-semibold text-base group-hover:text-primary transition-colors">
                                                    {fretamento.company_name || cliente?.nome || fretamento.contact_name}
                                                </div>
                                                <div className="text-xs text-muted-foreground font-medium">
                                                    {fretamento.contact_name || 'Contato não informado'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm font-bold">
                                                    <Package size={14} className="text-primary" />
                                                    {origem}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                                                    <Package size={14} />
                                                    {destino}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="text-sm font-bold">{formatDate(dataInicio)}</div>
                                                {dataFim && <div className="text-xs text-muted-foreground font-medium">até {formatDate(dataFim)}</div>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-semibold text-base text-emerald-600">
                                                {fretamento.moeda || 'R$'} {Number(valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={fretamento.status} />
                                        </TableCell>
                                        <TableCell className="pr-8 text-right">
                                            <div className="flex justify-end gap-2">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-sm hover:bg-primary/10 hover:text-primary">
                                                            <MoreHorizontal size={18} strokeWidth={2.5} />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56 rounded-sm shadow-2xl border-none bg-card   p-2">
                                                        <DropdownMenuLabel className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 py-2">Ações Rápidas</DropdownMenuLabel>
                                                        <DropdownMenuItem className="rounded-sm h-10 gap-3 font-bold cursor-pointer focus:bg-primary focus:text-primary-foreground px-3">
                                                            <FileText size={16} strokeWidth={2.5} />
                                                            Ver Detalhes
                                                        </DropdownMenuItem>
                                                        {(fretamento.status === FretamentoStatus.REQUEST || fretamento.status === 'PENDING') && (
                                                            <DropdownMenuItem className="rounded-sm h-10 gap-3 font-bold cursor-pointer focus:bg-primary focus:text-primary-foreground px-3">
                                                                <DollarSign size={16} strokeWidth={2.5} />
                                                                Enviar Orçamento
                                                            </DropdownMenuItem>
                                                        )}
                                                        {fretamento.status === FretamentoStatus.QUOTED && (
                                                            <DropdownMenuItem className="rounded-sm h-10 gap-3 font-bold cursor-pointer focus:bg-primary focus:text-primary-foreground px-3">
                                                                <CheckCircle size={16} strokeWidth={2.5} />
                                                                Confirmar Fretamento
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem className="rounded-sm h-10 gap-3 font-bold cursor-pointer focus:bg-primary focus:text-primary-foreground px-3">
                                                            <Edit size={16} strokeWidth={2.5} />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-border/40 my-1" />
                                                        <DropdownMenuItem
                                                            onClick={() => setItemToDelete(fretamento.id)}
                                                            className="rounded-sm h-10 gap-3 font-bold cursor-pointer text-destructive focus:text-destructive-foreground focus:bg-destructive px-3"
                                                        >
                                                            <Trash2 size={16} strokeWidth={2.5} />
                                                            Excluir
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Card>
            )}
            <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
                <AlertDialogContent className="rounded-sm border-none shadow-2xl bg-card  ">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-semibold tracking-tighter">Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription className="font-medium text-muted-foreground">
                            Tem certeza que deseja excluir esta solicitação? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel className="rounded-sm font-bold border-none bg-muted hover:bg-muted">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => itemToDelete && handleDelete(itemToDelete)}
                            className="rounded-sm font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            EXCLUIR SOLICITAÇÃO
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
