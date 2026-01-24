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
        <Badge className={cn('rounded-lg font-bold px-2 py-0.5', config.className)}>
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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl">
                            <Building2 size={24} className="text-primary" strokeWidth={2.5} />
                        </div>
                        <h1 className="text-4xl font-semibold tracking-tighter text-foreground">
                            Fretamento <span className="text-primary">B2B</span>
                        </h1>
                    </div>
                    <p className="text-muted-foreground font-medium text-sm ml-0">
                        Gestão corporativa de aluguel de frota
                    </p>
                </div>
                <Button onClick={() => navigate('/admin/fretamento/novo')} className="h-14 px-6 rounded-xl font-semibold gap-2 shadow-lg shadow-primary/20">
                    <Plus size={20} strokeWidth={2.5} />
                    NOVA SOLICITAÇÃO
                </Button>
            </div>

            {/* Executive KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="shadow-xl shadow-muted/20 bg-card/50 backdrop-blur-sm group hover:bg-card transition-colors rounded-3xl">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">Total de Solicitações</p>
                                <p className="text-3xl font-semibold tracking-tighter text-foreground">{totalSolicitacoes}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110 duration-500">
                                <FileText size={20} strokeWidth={2.5} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-xl shadow-muted/20 bg-card/50 backdrop-blur-sm group hover:bg-card transition-colors rounded-3xl">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">Orçamentos Pendentes</p>
                                <p className="text-3xl font-semibold tracking-tighter text-amber-600">{orcamentosPendentes}</p>
                            </div>
                            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 transition-transform group-hover:scale-110 duration-500">
                                <Clock size={20} strokeWidth={2.5} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-xl shadow-muted/20 bg-card/50 backdrop-blur-sm group hover:bg-card transition-colors rounded-3xl">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">Contratos Ativos</p>
                                <p className="text-3xl font-semibold tracking-tighter text-emerald-600">{contratosAtivos}</p>
                            </div>
                            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 transition-transform group-hover:scale-110 duration-500">
                                <CheckCircle size={20} strokeWidth={2.5} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-xl shadow-muted/20 bg-card/50 backdrop-blur-sm group hover:bg-card transition-colors rounded-[2rem]">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">Receita Projetada</p>
                                <p className="text-3xl font-semibold tracking-tighter text-blue-600">R$ {(receitaProjetada / 1000).toFixed(0)}k</p>
                            </div>
                            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 transition-transform group-hover:scale-110 duration-500">
                                <TrendingUp size={20} strokeWidth={2.5} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Executive Filters Module */}
            <div className="bg-card/50 backdrop-blur-sm p-6 rounded-3xl border border-border/40 shadow-xl shadow-muted/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Busca */}
                    <div className="space-y-1.5 flex flex-col">
                        <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Buscar Solicitação</label>
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

                    {/* Status Tabs */}
                    <div className="space-y-1.5">
                        <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Status da Solicitação</label>
                        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
                            <TabsList className="bg-muted/40 p-1.5 rounded-xl h-14 flex w-full border border-border/50">
                                <TabsTrigger value="todos" className="flex-1 rounded-xl px-2 font-semibold text-[12px] data-[state=active]:bg-background data-[state=active]:shadow-sm">TODOS</TabsTrigger>
                                <TabsTrigger value="solicitacao" className="flex-1 rounded-xl px-2 font-semibold text-[12px] data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">SOLICITAÇÃO</TabsTrigger>
                                <TabsTrigger value="orcamento" className="flex-1 rounded-xl px-2 font-semibold text-[12px] data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">ORÇAMENTO</TabsTrigger>
                                <TabsTrigger value="confirmado" className="flex-1 rounded-xl px-2 font-semibold text-[12px] data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">CONFIRMADO</TabsTrigger>
                                <TabsTrigger value="andamento" className="flex-1 rounded-xl px-2 font-semibold text-[12px] data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">EM ANDAMENTO</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>
            </div>

            {/* Executive Table Module */}
            {fretamentosFiltrados.length === 0 ? (
                <div className="bg-card/40 backdrop-blur-md rounded-xl border border-dashed border-border p-12 text-center">
                    <Bus size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-bold tracking-tight mb-2">Nenhuma solicitação encontrada</h3>
                    <p className="text-muted-foreground font-medium mb-6">Tente ajustar seus filtros ou crie uma nova solicitação.</p>
                </div>
            ) : (
                <Card className="border-none shadow-2xl shadow-muted/20 overflow-hidden rounded-3xl bg-card/50 backdrop-blur-sm">
                    <Table>
                        <TableHeader className="bg-muted/30">
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
                                    <TableRow key={fretamento.id} className="group hover:bg-muted/20 border-border/30 transition-colors">
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
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary">
                                                            <MoreHorizontal size={18} strokeWidth={2.5} />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-2xl border-none bg-card/95 backdrop-blur-md p-2">
                                                        <DropdownMenuLabel className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 py-2">Ações Rápidas</DropdownMenuLabel>
                                                        <DropdownMenuItem className="rounded-xl h-10 gap-3 font-bold cursor-pointer focus:bg-primary focus:text-primary-foreground px-3">
                                                            <FileText size={16} strokeWidth={2.5} />
                                                            Ver Detalhes
                                                        </DropdownMenuItem>
                                                        {(fretamento.status === FretamentoStatus.REQUEST || fretamento.status === 'PENDING') && (
                                                            <DropdownMenuItem className="rounded-xl h-10 gap-3 font-bold cursor-pointer focus:bg-primary focus:text-primary-foreground px-3">
                                                                <DollarSign size={16} strokeWidth={2.5} />
                                                                Enviar Orçamento
                                                            </DropdownMenuItem>
                                                        )}
                                                        {fretamento.status === FretamentoStatus.QUOTED && (
                                                            <DropdownMenuItem className="rounded-xl h-10 gap-3 font-bold cursor-pointer focus:bg-primary focus:text-primary-foreground px-3">
                                                                <CheckCircle size={16} strokeWidth={2.5} />
                                                                Confirmar Fretamento
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem className="rounded-xl h-10 gap-3 font-bold cursor-pointer focus:bg-primary focus:text-primary-foreground px-3">
                                                            <Edit size={16} strokeWidth={2.5} />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-border/40 my-1" />
                                                        <DropdownMenuItem
                                                            onClick={() => setItemToDelete(fretamento.id)}
                                                            className="rounded-xl h-10 gap-3 font-bold cursor-pointer text-destructive focus:text-destructive-foreground focus:bg-destructive px-3"
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
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl bg-card/95 backdrop-blur-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-semibold tracking-tighter">Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription className="font-medium text-muted-foreground">
                            Tem certeza que deseja excluir esta solicitação? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel className="rounded-xl font-bold border-none bg-muted hover:bg-muted/80">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => itemToDelete && handleDelete(itemToDelete)}
                            className="rounded-xl font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            EXCLUIR SOLICITAÇÃO
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
