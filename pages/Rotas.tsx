import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IRota, RouteType, RouteTypeLabel } from '../types';
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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-2xl">
                            <MapPinned size={24} className="text-primary" strokeWidth={2.5} />
                        </div>
                        <h1 className="text-4xl font-semibold tracking-tighter text-foreground">
                            Gerenciamento de <span className="text-primary">Rotas</span>
                        </h1>
                    </div>
                    <p className="text-muted-foreground font-medium text-sm ml-0">
                        Configuração de itinerários e pontos de parada
                    </p>
                </div>
                <Button onClick={handleNovaRota} className="h-14 px-6 rounded-2xl font-semibold gap-2 shadow-lg shadow-primary/20">
                    <Plus size={20} strokeWidth={2.5} />
                    NOVA ROTA
                </Button>
            </div>


            {/* Executive KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="shadow-xl shadow-muted/20 bg-card/50 backdrop-blur-sm group hover:bg-card transition-colors rounded-[2rem]">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">Total de Rotas</p>
                                <p className="text-3xl font-semibold tracking-tighter text-foreground">{rotas.length}</p>
                            </div>
                            <div className="p-3 rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110 duration-500">
                                <RouteIcon size={20} strokeWidth={2.5} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-xl shadow-muted/20 bg-card/50 backdrop-blur-sm group hover:bg-card transition-colors rounded-[2rem]">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">Rotas Ativas</p>
                                <p className="text-3xl font-semibold tracking-tighter text-emerald-600">{rotas.filter(r => r.ativa).length}</p>
                            </div>
                            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 transition-transform group-hover:scale-110 duration-500">
                                <MapPin size={20} strokeWidth={2.5} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-xl shadow-muted/20 bg-card/50 backdrop-blur-sm group hover:bg-card transition-colors rounded-[2rem]">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">Rotas de Ida</p>
                                <p className="text-3xl font-semibold tracking-tighter text-blue-600">{rotas.filter(r => r.tipo_rota === RouteType.OUTBOUND).length}</p>
                            </div>
                            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 transition-transform group-hover:scale-110 duration-500">
                                <MapPinned size={20} strokeWidth={2.5} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-xl shadow-muted/20 bg-card/50 backdrop-blur-sm group hover:bg-card transition-colors rounded-[2rem]">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">Rotas de Volta</p>
                                <p className="text-3xl font-semibold tracking-tighter text-orange-600">{rotas.filter(r => r.tipo_rota === RouteType.INBOUND).length}</p>
                            </div>
                            <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-600 transition-transform group-hover:scale-110 duration-500">
                                <Gauge size={20} strokeWidth={2.5} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Executive Filters Module */}
            <div className="bg-card/50 backdrop-blur-sm p-6 rounded-[2rem] border border-border/40 shadow-xl shadow-muted/10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Busca */}
                    <div className="space-y-1.5 flex flex-col">
                        <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Buscar Rota</label>
                        <div className="relative group flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                            <Input
                                placeholder="Nome ou ponto de parada..."
                                className="pl-12 h-14 bg-muted/40 border-input rounded-2xl font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary/20"
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Tipo de Rota */}
                    <div className="space-y-1.5">
                        <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Tipo de Rota</label>
                        <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as any)}>
                            <SelectTrigger className="h-14 w-full bg-muted/40 border-input rounded-2xl font-bold">
                                <SelectValue placeholder="Tipo de Rota" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl bg-card/95 backdrop-blur-md">
                                <SelectItem value="TODOS">Todos os Tipos</SelectItem>
                                <SelectItem value={RouteType.OUTBOUND}>Ida (Outbound)</SelectItem>
                                <SelectItem value={RouteType.INBOUND}>Volta (Inbound)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Status Tabs */}
                    <div className="space-y-1.5">
                        <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Visibilidade</label>
                        <Tabs value={statusTab} onValueChange={(v: any) => setStatusTab(v)} className="w-full">
                            <TabsList className="bg-muted/40 p-1.5 rounded-2xl h-14 flex w-full border border-border/50">
                                <TabsTrigger value="TODOS" className="flex-1 rounded-xl px-4 font-semibold text-[12px] data-[state=active]:bg-background data-[state=active]:shadow-sm">TODAS</TabsTrigger>
                                <TabsTrigger value="ATIVA" className="flex-1 rounded-xl px-4 font-semibold text-[12px] data-[state=active]:bg-background data-[state=active]:shadow-sm">ATIVAS</TabsTrigger>
                                <TabsTrigger value="INATIVA" className="flex-1 rounded-xl px-4 font-semibold text-[12px] data-[state=active]:bg-background data-[state=active]:shadow-sm">INATIVAS</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>
            </div>

            {/* Executive Table Module */}
            <Card className="shadow-2xl shadow-muted/20 overflow-hidden rounded-[2.5rem] bg-card/50 backdrop-blur-sm">
                <Table>
                    <TableHeader className="bg-muted/30">
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
                                        <div className="p-6 bg-muted/40 rounded-full">
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
                                <TableRow key={rota.id} className="group hover:bg-muted/20 border-border/30 transition-colors h-24">
                                    <TableCell className="pl-8">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-12 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg",
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
                                            "rounded-xl font-semibold text-[12px] px-3 py-1 uppercase tracking-tighter shadow-sm",
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
                                                    <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted/80 h-9 w-9">
                                                        <MoreHorizontal size={18} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-2xl p-2 mt-2">
                                                    <DropdownMenuLabel className="px-3 py-2 text-[12px] font-semibold uppercase tracking-widest text-muted-foreground/40">Gerenciar Rota</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleEditarRota(rota.id)} className="rounded-xl gap-3 font-bold h-11 cursor-pointer">
                                                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                                                            <Edit size={16} />
                                                        </div>
                                                        Editar Rota
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDuplicarRota(rota.id)} className="rounded-xl gap-3 font-bold h-11 cursor-pointer">
                                                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                            <Copy size={16} />
                                                        </div>
                                                        Duplicar Rota
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleToggleStatus(rota.id)} className="rounded-xl gap-3 font-bold h-11 cursor-pointer">
                                                        <div className={cn(
                                                            "p-2 rounded-lg",
                                                            rota.ativa ? "bg-orange-500/10 text-orange-600" : "bg-emerald-500/10 text-emerald-600"
                                                        )}>
                                                            {rota.ativa ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                                        </div>
                                                        {rota.ativa ? "Desativar Rota" : "Ativar Rota"}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="my-2 bg-muted/50" />
                                                    <DropdownMenuItem
                                                        onClick={() => handleExcluirRota(rota.id)}
                                                        className="rounded-xl gap-3 font-bold h-11 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                                                    >
                                                        <div className="p-2 rounded-lg bg-destructive/10">
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
                                                className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all group/btn h-9 w-9"
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
