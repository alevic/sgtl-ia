import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IRota, RouteType, RouteTypeLabel } from '@/types';
import { VisualizadorRota } from '../components/Rotas/VisualizadorRota';
import { routesService } from '../services/routesService';
import {
    Plus, Search, Route as RouteIcon, Filter, Edit, Copy,
    ToggleLeft, ToggleRight, Trash2, Loader, MapPin,
    ChevronRight, MoreHorizontal, MousePointer2, Settings2,
    ArrowRightLeft, MapPinned, Gauge, ChevronLeft
} from 'lucide-react';
import { prepararPayloadRota } from '../utils/rotaValidation';
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
import { Input } from "../components/ui/input";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "../components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Card, CardContent } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { PageHeader } from "../components/Layout/PageHeader";
import { DashboardCard } from "../components/Layout/DashboardCard";
import { ListFilterSection } from "../components/Layout/ListFilterSection";
import { cn } from "../lib/utils";

export const Rotas: React.FC = () => {
    const navigate = useNavigate();
    const [rotas, setRotas] = useState<IRota[]>([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');
    const [filtroTipo, setFiltroTipo] = useState<'TODOS' | RouteType>('TODOS');
    const [statusTab, setStatusTab] = useState<'TODOS' | 'ATIVA' | 'INATIVA'>('TODOS');

    const fetchRotas = async () => {
        try {
            setLoading(true);
            const data = await routesService.getAll();
            setRotas(data);
        } catch (error) {
            console.error('Erro ao carregar rotas:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRotas();
    }, []);

    const rotasFiltradas = rotas.filter(rota => {
        const matchBusca = busca === '' ||
            rota.nome?.toLowerCase().includes(busca.toLowerCase()) ||
            rota.pontos.some(p => p.nome?.toLowerCase().includes(busca.toLowerCase()));

        const matchTipo = filtroTipo === 'TODOS' || rota.tipo_rota === filtroTipo;
        const matchStatus = statusTab === 'TODOS' ||
            (statusTab === 'ATIVA' && rota.ativa) ||
            (statusTab === 'INATIVA' && !rota.ativa);

        return matchBusca && matchTipo && matchStatus;
    });

    const handleNovaRota = () => navigate('/admin/rotas/nova');
    const handleEditarRota = (id: string) => navigate(`/admin/rotas/${id}`);

    const handleDuplicarRota = async (id: string) => {
        const rotaOriginal = rotas.find(r => r.id === id);
        if (!rotaOriginal) return;

        if (confirm(`Deseja duplicar a rota "${rotaOriginal.nome}"?`)) {
            try {
                const payload = prepararPayloadRota(rotaOriginal, `${rotaOriginal.nome} (Cópia)`);
                payload.active = false;
                await routesService.create(payload);
                fetchRotas();
            } catch (error) {
                console.error('Erro ao duplicar rota:', error);
            }
        }
    };

    const handleToggleStatus = async (id: string) => {
        const rota = rotas.find(r => r.id === id);
        if (!rota) return;

        try {
            await routesService.update(id, { ativa: !rota.ativa });
            setRotas(rotas.map(r => r.id === id ? { ...r, ativa: !r.ativa } : r));
        } catch (error) {
            console.error('Erro ao alterar status:', error);
        }
    };

    const handleExcluirRota = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta rota?')) {
            try {
                await routesService.delete(id);
                setRotas(rotas.filter(r => r.id !== id));
            } catch (error) {
                console.error('Erro ao excluir rota:', error);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-12 h-14 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <RouteIcon size={16} className="text-primary animate-pulse" />
                    </div>
                </div>
                <p className="text-muted-foreground font-medium animate-pulse text-sm">Carregando rotas...</p>
            </div>
        );
    }

    return (
        <div key="rotas-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Executive Header */}
            <PageHeader
                title="Gerenciamento de Rotas"
                subtitle="Configuração de itinerários e pontos de parada"
                icon={MapPinned}
                rightElement={
                    <Button onClick={handleNovaRota} className="h-14 px-6 rounded-sm font-semibold gap-2 shadow-lg shadow-primary/20">
                        <Plus size={20} strokeWidth={2.5} />
                        NOVA ROTA
                    </Button>
                }
            />


            {/* Executive KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <DashboardCard
                    title="Total de Rotas"
                    value={rotas.length}
                    icon={RouteIcon}
                    variant="primary"
                />
                <DashboardCard
                    title="Rotas Ativas"
                    value={rotas.filter(r => r.ativa).length}
                    icon={MapPin}
                    variant="emerald"
                />
                <DashboardCard
                    title="Rotas de Ida"
                    value={rotas.filter(r => r.tipo_rota === RouteType.OUTBOUND).length}
                    icon={MapPinned}
                    variant="blue"
                />
                <DashboardCard
                    title="Rotas de Volta"
                    value={rotas.filter(r => r.tipo_rota === RouteType.INBOUND).length}
                    icon={Gauge}
                    variant="amber"
                />
            </div>

            {/* Executive Filters Module */}
            <ListFilterSection className="lg:grid-cols-3">
                {/* Busca */}
                <div className="space-y-1.5 flex flex-col">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80 ml-1">Buscar Rota</label>
                    <div className="relative group flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                        <Input
                            placeholder="Nome ou ponto de parada..."
                            className="pl-12 h-14 bg-muted border-input rounded-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary/20"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                        />
                    </div>
                </div>

                {/* Tipo de Rota */}
                <div className="space-y-1.5 flex flex-col">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80 ml-1">Tipo de Rota</label>
                    <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as any)}>
                        <SelectTrigger className="h-14 w-full bg-muted border-input rounded-sm font-bold">
                            <SelectValue placeholder="Tipo de Rota" />
                        </SelectTrigger>
                        <SelectContent className="rounded-sm border-none shadow-2xl bg-card  ">
                            <SelectItem value="TODOS">Todos os Tipos</SelectItem>
                            <SelectItem value={RouteType.OUTBOUND}>Ida (Outbound)</SelectItem>
                            <SelectItem value={RouteType.INBOUND}>Volta (Inbound)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Status Tabs */}
                <div className="space-y-1.5 flex flex-col">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80 ml-1">Visibilidade</label>
                    <Tabs value={statusTab} onValueChange={(v: any) => setStatusTab(v)} className="w-full">
                        <TabsList className="bg-muted p-1.5 rounded-sm h-14 flex w-full border border-border/50">
                            <TabsTrigger value="TODOS" className="flex-1 rounded-sm px-4 font-black text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm">TODAS</TabsTrigger>
                            <TabsTrigger value="ATIVA" className="flex-1 rounded-sm px-4 font-black text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm">ATIVAS</TabsTrigger>
                            <TabsTrigger value="INATIVA" className="flex-1 rounded-sm px-4 font-black text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm">INATIVAS</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </ListFilterSection>

            {/* Executive Table Module */}
            <Card className="shadow-2xl shadow-muted/20 overflow-hidden rounded-[2.5rem] bg-card  ">
                <Table>
                    <TableHeader className="bg-muted">
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="pl-8 h-14 text-[12px] font-semibold uppercase tracking-widest">Identificação</TableHead>
                            <TableHead className="h-14 text-[12px] font-semibold uppercase tracking-widest">Trajeto</TableHead>
                            <TableHead className="h-14 text-[12px] font-semibold uppercase tracking-widest">Tipo</TableHead>
                            <TableHead className="h-14 text-[12px] font-semibold uppercase tracking-widest text-center">Distância</TableHead>
                            <TableHead className="h-14 text-[12px] font-semibold uppercase tracking-widest text-center">Status</TableHead>
                            <TableHead className="pr-8 text-right h-14 text-[12px] font-semibold uppercase tracking-widest">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rotasFiltradas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-96 text-center border-none">
                                    <div className="flex flex-col items-center justify-center gap-4 py-20 grayscale opacity-40">
                                        <div className="p-6 bg-muted rounded-full">
                                            <RouteIcon size={48} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xl font-semibold">Nenhuma rota encontrada</p>
                                            <p className="text-sm font-medium">Tente ajustar seus filtros ou criar uma nova rota.</p>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            rotasFiltradas.map((rota) => (
                                <TableRow key={rota.id} className="group hover:bg-muted border-border/30 transition-colors h-24">
                                    <TableCell className="pl-8">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-12 h-14 rounded-sm flex items-center justify-center text-white shrink-0 shadow-lg",
                                                rota.ativa ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                                            )}>
                                                <RouteIcon size={20} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-foreground text-base leading-none mb-1 group-hover:text-primary transition-colors">
                                                    {rota.nome || 'Rota sem nome'}
                                                </p>
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                                    ID: {rota.id.substring(0, 8)}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                                <span>{rota.pontos[0]?.nome || 'Início'}</span>
                                                <ArrowRightLeft size={12} className="text-muted-foreground/40" />
                                                <span>{rota.pontos[rota.pontos.length - 1]?.nome || 'Fim'}</span>
                                            </div>
                                            <p className="text-[12px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
                                                {rota.pontos.length} Pontos de Parada
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn(
                                            "rounded-sm font-semibold text-[12px] px-3 py-1 uppercase tracking-tighter shadow-sm",
                                            rota.tipo_rota === RouteType.OUTBOUND || (rota.tipo_rota as any) === 'IDA'
                                                ? 'bg-blue-500/10 text-blue-600'
                                                : 'bg-orange-500/10 text-orange-600'
                                        )}>
                                            {RouteTypeLabel[rota.tipo_rota] || (rota.tipo_rota as string)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center font-semibold text-foreground">
                                        {rota.distancia_total_km ? `${rota.distancia_total_km} km` : '---'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge className={cn(
                                            "rounded-full font-semibold text-[12px] uppercase px-3 py-1 shadow-lg",
                                            rota.ativa
                                                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                                                : 'bg-muted-foreground/20 text-muted-foreground shadow-none'
                                        )}>
                                            {rota.ativa ? 'Ativa' : 'Inativa'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="pr-8 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Visualizer Popover could go here, for now expanded menu */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="rounded-sm hover:bg-muted h-9 w-9">
                                                        <MoreHorizontal size={18} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 rounded-sm shadow-2xl p-2 mt-2">
                                                    <DropdownMenuLabel className="px-3 py-2 text-[12px] font-semibold uppercase tracking-widest text-muted-foreground/40">Gerenciar Rota</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleEditarRota(rota.id)} className="rounded-sm gap-3 font-bold h-11 cursor-pointer">
                                                        <div className="p-2 rounded-sm bg-blue-500/10 text-blue-600">
                                                            <Edit size={16} />
                                                        </div>
                                                        Editar Rota
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDuplicarRota(rota.id)} className="rounded-sm gap-3 font-bold h-11 cursor-pointer">
                                                        <div className="p-2 rounded-sm bg-primary/10 text-primary">
                                                            <Copy size={16} />
                                                        </div>
                                                        Duplicar Rota
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleToggleStatus(rota.id)} className="rounded-sm gap-3 font-bold h-11 cursor-pointer">
                                                        <div className={cn(
                                                            "p-2 rounded-sm",
                                                            rota.ativa ? "bg-orange-500/10 text-orange-600" : "bg-emerald-500/10 text-emerald-600"
                                                        )}>
                                                            {rota.ativa ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                                        </div>
                                                        {rota.ativa ? "Desativar Rota" : "Ativar Rota"}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="my-2 bg-muted" />
                                                    <DropdownMenuItem
                                                        onClick={() => handleExcluirRota(rota.id)}
                                                        className="rounded-sm gap-3 font-bold h-11 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                                                    >
                                                        <div className="p-2 rounded-sm bg-destructive/10">
                                                            <Trash2 size={16} />
                                                        </div>
                                                        Excluir Rota
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEditarRota(rota.id)}
                                                className="rounded-sm hover:bg-primary/10 hover:text-primary transition-all group/btn h-9 w-9"
                                            >
                                                <ChevronRight size={18} className="transition-transform group-hover/btn:translate-x-0.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div >
    );
};
