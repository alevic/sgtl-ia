import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { IVeiculo, VeiculoStatus, VeiculoStatusLabel } from '../types';
import { useAppContext } from '../context/AppContext';
import {
    Bus, Truck, Plus, Search, Filter, Gauge, Calendar,
    Wrench, CheckCircle, AlertTriangle, XCircle, TrendingUp, Loader, Inbox, User
} from 'lucide-react';
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
import { Card, CardContent } from "../components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Progress } from "../components/ui/progress";
import { cn } from "../lib/utils";
import { VehicleActions } from '../components/Frota/VehicleActions';

// Mock data - em produção virá do backend
export const MOCK_VEICULOS: (IVeiculo & {
    km_atual: number;
    ano: number;
    ultima_revisao?: string;
    motorista_atual?: string;
})[] = [
        {
            id: 'V001',
            placa: 'ABC-1234',
            modelo: 'Mercedes-Benz O500',
            tipo: 'ONIBUS',
            status: VeiculoStatus.IN_TRANSIT,
            proxima_revisao_km: 95000,
            km_atual: 87500,
            ano: 2020,
            ultima_revisao: '2023-09-15',
            motorista_atual: 'José Silva'
        },
        {
            id: 'V002',
            placa: 'DEF-5678',
            modelo: 'Scania Touring',
            tipo: 'ONIBUS',
            status: VeiculoStatus.ACTIVE,
            proxima_revisao_km: 105000,
            km_atual: 92000,
            ano: 2021,
            ultima_revisao: '2023-08-20'
        },
        {
            id: 'V003',
            placa: 'GHI-9012',
            modelo: 'Volvo FH 540',
            tipo: 'CAMINHAO',
            status: VeiculoStatus.MAINTENANCE,
            proxima_revisao_km: 120000,
            km_atual: 118500,
            ano: 2019,
            ultima_revisao: '2023-10-01'
        },
        {
            id: 'V004',
            placa: 'JKL-3456',
            modelo: 'Mercedes-Benz Actros',
            tipo: 'CAMINHAO',
            status: VeiculoStatus.ACTIVE,
            proxima_revisao_km: 130000,
            km_atual: 115000,
            ano: 2022,
            ultima_revisao: '2023-09-10'
        },
        {
            id: 'V005',
            placa: 'MNO-7890',
            modelo: 'Marcopolo Paradiso',
            tipo: 'ONIBUS',
            status: VeiculoStatus.IN_TRANSIT,
            proxima_revisao_km: 100000,
            km_atual: 88000,
            ano: 2021,
            ultima_revisao: '2023-08-05',
            motorista_atual: 'Carlos Souza'
        }
    ];

const StatusBadge: React.FC<{ status: VeiculoStatus }> = ({ status }) => {
    const configs: Record<any, any> = {
        [VeiculoStatus.ACTIVE]: {
            label: VeiculoStatusLabel[VeiculoStatus.ACTIVE],
            icon: CheckCircle,
            className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        },
        [VeiculoStatus.MAINTENANCE]: {
            label: VeiculoStatusLabel[VeiculoStatus.MAINTENANCE],
            icon: Wrench,
            className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        },
        [VeiculoStatus.IN_TRANSIT]: {
            label: VeiculoStatusLabel[VeiculoStatus.IN_TRANSIT],
            icon: TrendingUp,
            className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        }
    };

    const config = configs[status] || configs[VeiculoStatus.ACTIVE];
    const Icon = config.icon || Bus;

    return (
        <Badge variant="outline" className={cn("gap-1.5 font-bold px-2 py-0.5 rounded-lg", config.className)}>
            <Icon size={12} strokeWidth={2.5} />
            {config.label}
        </Badge>
    );
};

export const Frota: React.FC = () => {
    const { currentContext } = useAppContext();
    const { formatDate } = useDateFormatter();
    const [veiculos, setVeiculos] = useState<(IVeiculo & { km_atual: number; ano: number; ultima_revisao: string; motorista_atual?: string })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filtroStatus, setFiltroStatus] = useState<'TODOS' | VeiculoStatus>('TODOS');
    const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'ONIBUS' | 'CAMINHAO'>('TODOS');
    const [busca, setBusca] = useState('');

    const fetchVeiculos = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/fleet/vehicles`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch vehicles');
            }

            const data = await response.json();
            setVeiculos(data);
        } catch (error) {
            console.error("Erro ao buscar veículos:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVeiculos();
    }, [currentContext]);

    const veiculosFiltrados = veiculos.filter(v => {
        const matchStatus = filtroStatus === 'TODOS' || v.status === filtroStatus;
        const matchTipo = filtroTipo === 'TODOS' || v.tipo === filtroTipo;
        const matchBusca = busca === '' ||
            v.placa.toLowerCase().includes(busca.toLowerCase()) ||
            v.modelo.toLowerCase().includes(busca.toLowerCase());
        return matchStatus && matchTipo && matchBusca;
    });

    // Estatísticas
    const totalVeiculos = veiculos.length;
    const veiculosAtivos = veiculos.filter(v => v.status === VeiculoStatus.ACTIVE).length;
    const veiculosEmViagem = veiculos.filter(v => v.status === VeiculoStatus.IN_TRANSIT).length;
    const veiculosManutencao = veiculos.filter(v => v.status === VeiculoStatus.MAINTENANCE).length;

    const calcularProgressoManutencao = (kmAtual: number, proximaRevisao: number) => {
        const proximoManutencao = proximaRevisao - kmAtual;
        const progresso = 100 - ((proximoManutencao / 10000) * 100);
        return Math.min(Math.max(progresso, 0), 100);
    };

    return (
        <div key="frota-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-2xl">
                            <Bus className="text-primary w-6 h-6" strokeWidth={2.5} />
                        </div>
                        <h1 className="text-4xl font-semibold tracking-tighter text-foreground">
                            Gestão de <span className="text-primary">Frota</span>
                        </h1>
                    </div>
                    <p className="text-muted-foreground font-medium text-sm ml-1">Controle operacional e manutenção preventiva</p>
                </div>
                <Link to="/admin/frota/novo">
                    <Button className="h-14 px-6 rounded-2xl font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20">
                        <Plus size={20} className="mr-2" strokeWidth={3} />
                        NOVO VEÍCULO
                    </Button>
                </Link>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total de Veículos', value: totalVeiculos, icon: Bus, color: 'primary' },
                    { label: 'Frotas Ativas', value: veiculosAtivos, icon: CheckCircle, color: 'emerald' },
                    { label: 'Em Operação', value: veiculosEmViagem, icon: TrendingUp, color: 'blue' },
                    { label: 'Manutenção', value: veiculosManutencao, icon: Wrench, color: 'amber' }
                ].map((stat, i) => (
                    <Card key={i} className="shadow-xl shadow-muted/20 bg-card/50 backdrop-blur-sm group hover:bg-card transition-colors rounded-[2rem]">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                                    <p className="text-3xl font-semibold tracking-tighter">{stat.value}</p>
                                </div>
                                <div className={cn(
                                    "p-3 rounded-2xl transition-transform group-hover:scale-110 duration-500",
                                    stat.color === 'primary' ? "bg-primary/10 text-primary" :
                                        stat.color === 'emerald' ? "bg-emerald-500/10 text-emerald-600" :
                                            stat.color === 'blue' ? "bg-blue-500/10 text-blue-600" :
                                                "bg-amber-500/10 text-amber-600"
                                )}>
                                    <stat.icon size={20} strokeWidth={2.5} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters Module */}
            <div className="bg-card/50 backdrop-blur-sm p-6 rounded-[2rem] border border-border/40 shadow-xl shadow-muted/10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Busca */}
                    <div className="space-y-1.5 flex flex-col">
                        <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Buscar Veículo</label>
                        <div className="relative group flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 transition-colors group-focus-within:text-primary" />
                            <Input
                                placeholder="Placa ou modelo..."
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                className="pl-11 h-14 bg-muted/40 border-input rounded-2xl font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary/20"
                            />
                        </div>
                    </div>

                    {/* Status Tabs */}
                    <div className="space-y-1.5 flex flex-col">
                        <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Status Operacional</label>
                        <Tabs value={filtroStatus} onValueChange={(v: any) => setFiltroStatus(v)} className="w-full">
                            <TabsList className="bg-muted/40 p-1.5 rounded-2xl h-14 flex w-full border border-border/50">
                                <TabsTrigger value="TODOS" className="flex-1 rounded-xl font-bold text-[12px] data-[state=active]:bg-background data-[state=active]:shadow-sm">TODOS</TabsTrigger>
                                <TabsTrigger value={VeiculoStatus.ACTIVE} className="flex-1 rounded-xl font-bold text-[12px] data-[state=active]:bg-background data-[state=active]:shadow-sm">ATIVOS</TabsTrigger>
                                <TabsTrigger value={VeiculoStatus.IN_TRANSIT} className="flex-1 rounded-xl font-bold text-[12px] data-[state=active]:bg-background data-[state=active]:shadow-sm">EM VIAGEM</TabsTrigger>
                                <TabsTrigger value={VeiculoStatus.MAINTENANCE} className="flex-1 rounded-xl font-bold text-[12px] data-[state=active]:bg-background data-[state=active]:shadow-sm">MANUTENÇÃO</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* Tipo Tabs */}
                    <div className="space-y-1.5 flex flex-col">
                        <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Categoria</label>
                        <Tabs value={filtroTipo} onValueChange={(v: any) => setFiltroTipo(v)} className="w-full">
                            <TabsList className="bg-muted/40 p-1.5 rounded-2xl h-14 flex w-full border border-border/50">
                                <TabsTrigger value="TODOS" className="flex-1 rounded-xl font-bold text-[12px] data-[state=active]:bg-background transition-all">TODOS</TabsTrigger>
                                <TabsTrigger value="ONIBUS" className="flex-1 rounded-xl font-bold text-[12px] data-[state=active]:bg-background transition-all">ÔNIBUS</TabsTrigger>
                                <TabsTrigger value="CAMINHAO" className="flex-1 rounded-xl font-bold text-[12px] data-[state=active]:bg-background transition-all">CAMINHÕES</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>
            </div>

            {/* Vehicles Table Listing */}
            <Card className="border-none shadow-2xl shadow-muted/20 overflow-hidden rounded-[2.5rem] bg-card/50 backdrop-blur-sm">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="pl-8 h-14 text-[12px] font-semibold uppercase tracking-widest">Veículo</TableHead>
                            <TableHead className="h-14 text-[12px] font-semibold uppercase tracking-widest text-center">Tipo</TableHead>
                            <TableHead className="h-14 text-[12px] font-semibold uppercase tracking-widest">Status</TableHead>
                            <TableHead className="h-14 text-[12px] font-semibold uppercase tracking-widest">KMs & Revisão</TableHead>
                            <TableHead className="h-14 text-[12px] font-semibold uppercase tracking-widest">Motorista Atual</TableHead>
                            <TableHead className="pr-8 h-14 text-[12px] font-semibold uppercase tracking-widest text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-64 text-center">
                                    <div className="flex flex-col items-center gap-3 animate-pulse">
                                        <div className="w-12 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                                            <Loader className="w-6 h-6 text-primary animate-spin" />
                                        </div>
                                        <p className="font-semibold text-sm tracking-widest text-muted-foreground uppercase">Carregando frota...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : veiculosFiltrados.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-64 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Inbox className="w-12 h-14 text-muted-foreground/30" />
                                        <p className="font-bold text-sm text-muted-foreground">Nenhum veículo encontrado</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            veiculosFiltrados.map((veiculo) => {
                                const progressoManutencao = calcularProgressoManutencao(veiculo.km_atual, veiculo.proxima_revisao_km);
                                const proximoManutencao = veiculo.proxima_revisao_km - veiculo.km_atual;
                                const alertaManutencao = proximoManutencao <= 5000;

                                return (
                                    <TableRow key={veiculo.id} className="group hover:bg-muted/20 border-border/30 transition-colors">
                                        <TableCell className="pl-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-12 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110",
                                                    veiculo.tipo === 'ONIBUS' ? "bg-gradient-to-br from-blue-500 to-purple-600" : "bg-gradient-to-br from-orange-500 to-red-600 shadow-orange-500/20"
                                                )}>
                                                    {veiculo.tipo === 'ONIBUS' ? <Bus size={22} /> : <Truck size={22} />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm tracking-tight text-foreground">{veiculo.placa}</span>
                                                    <span className="text-[11px] font-bold text-muted-foreground/80">{veiculo.modelo}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="bg-muted/50 text-[12px] font-semibold rounded-lg">{veiculo.tipo}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={veiculo.status} />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-2 w-48">
                                                <div className="flex justify-between items-end">
                                                    <div className="flex flex-col">
                                                        <span className="text-[12px] font-semibold text-muted-foreground uppercase leading-none mb-1">KM atual</span>
                                                        <span className="font-semibold text-sm tracking-tight">{veiculo.km_atual.toLocaleString()}</span>
                                                    </div>
                                                    <div className="text-right flex flex-col">
                                                        <span className="text-[12px] font-semibold text-muted-foreground uppercase leading-none mb-1">Próx. Revisão</span>
                                                        <span className={cn("text-xs font-semibold", alertaManutencao ? "text-orange-500" : "text-muted-foreground")}>
                                                            {veiculo.proxima_revisao_km.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Progress value={progressoManutencao} className={cn("h-1.5", alertaManutencao ? "bg-orange-500/10 [&>div]:bg-orange-500" : "bg-emerald-500/10 [&>div]:bg-emerald-500")} />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {veiculo.motorista_atual ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <User className="text-primary w-4 h-4" />
                                                    </div>
                                                    <span className="text-sm font-bold tracking-tight">{veiculo.motorista_atual}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs font-bold text-muted-foreground/40 italic">Não designado</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <VehicleActions veiculo={veiculo} onUpdate={fetchVeiculos} />
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
