import React, { useState } from 'react';
import { data as json } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData, useNavigate, Link, useFetcher } from "react-router";
import { useDateFormatter } from '@/hooks/useDateFormatter';
import { IVeiculo, VeiculoStatus, VeiculoStatusLabel } from '@/types';
import { useApp } from '@/context/AppContext';
import {
    Bus, Truck, Plus, Search, Filter, Gauge, Calendar,
    Wrench, CheckCircle, AlertTriangle, XCircle, TrendingUp, Loader, Inbox, User
} from 'lucide-react';
import { db } from "@/db/db.server";
import { vehicle as vehicleTable } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
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
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from '@/components/Layout/PageHeader';
import { DashboardCard } from '@/components/Layout/DashboardCard';
import { ListFilterSection } from '@/components/Layout/ListFilterSection';
import { cn } from "@/lib/utils";
import { VehicleActions } from '@/components/Frota/VehicleActions';

export const loader = async ({ request, params }: { request: Request, params: any }) => {
    const vehiclesData = await db.select().from(vehicleTable).orderBy(desc(vehicleTable.createdAt));
    return json({
        vehicles: vehiclesData
    });
};

export const action = async ({ request, params }: { request: Request, params: any }) => {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const id = formData.get("id") as string;

    if (intent === "delete") {
        await db.delete(vehicleTable).where(eq(vehicleTable.id, id));
        return json({ success: true, message: "Veículo excluído" });
    }

    return null;
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const configs: any = {
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
        <Badge variant="outline" className={cn("gap-1.5 font-bold px-2 py-0.5 rounded-xl", config.className)}>
            <Icon size={12} strokeWidth={2.5} />
            {config.label}
        </Badge>
    );
};

export default function FleetPage() {
    const { vehicles: initialVehicles } = useLoaderData<typeof loader>();
    const { currentContext } = useApp();
    const { formatDate } = useDateFormatter();
    const [filtroStatus, setFiltroStatus] = useState<'TODOS' | string>('TODOS');
    const [filtroTipo, setFiltroTipo] = useState<'TODOS' | string>('TODOS');
    const [busca, setBusca] = useState('');
    const navigate = useNavigate();

    const vehicles = initialVehicles as any[];

    const veiculosFiltrados = vehicles.filter(v => {
        const matchStatus = filtroStatus === 'TODOS' || v.status === filtroStatus;
        const matchTipo = filtroTipo === 'TODOS' || v.tipo === filtroTipo;
        const matchBusca = busca === '' ||
            (v.placa || '').toLowerCase().includes(busca.toLowerCase()) ||
            (v.modelo || '').toLowerCase().includes(busca.toLowerCase());
        return matchStatus && matchTipo && matchBusca;
    });

    const totalVeiculos = vehicles.length;
    const veiculosAtivos = vehicles.filter(v => v.status === VeiculoStatus.ACTIVE).length;
    const veiculosEmViagem = vehicles.filter(v => v.status === VeiculoStatus.IN_TRANSIT).length;
    const veiculosManutencao = vehicles.filter(v => v.status === VeiculoStatus.MAINTENANCE).length;

    const calcularProgressoManutencao = (kmAtual: number, proximaRevisao: number) => {
        if (!proximaRevisao) return 0;
        const proximoManutencao = proximaRevisao - (kmAtual || 0);
        const progresso = 100 - ((proximoManutencao / 10000) * 100);
        return Math.min(Math.max(progresso, 0), 100);
    };

    return (
        <div key="fleet-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <PageHeader
                title="Gestão de Frota"
                subtitle="Controle operacional e manutenção preventiva"
                icon={Bus}
                rightElement={
                    <Button asChild className="h-14 px-6 rounded-xl font-semibold shadow-lg shadow-primary/20">
                        <Link to="/admin/fleet/new">
                            <Plus size={20} className="mr-2" strokeWidth={3} />
                            NOVA VEÍCULO
                        </Link>
                    </Button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <DashboardCard title="Total de Veículos" value={totalVeiculos} icon={Bus} variant="primary" />
                <DashboardCard title="Frotas Ativas" value={veiculosAtivos} icon={CheckCircle} variant="emerald" />
                <DashboardCard title="Em Operação" value={veiculosEmViagem} icon={TrendingUp} variant="blue" />
                <DashboardCard title="Manutenção" value={veiculosManutencao} icon={Wrench} variant="amber" />
            </div>

            <ListFilterSection gridClassName="lg:grid-cols-3">
                <div className="space-y-1.5 flex flex-col">
                    <label className="text-label-caps ml-1">Buscar Veículo</label>
                    <div className="relative group flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Placa ou modelo..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="pl-11 h-14 bg-muted/40 border-input rounded-xl font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary/20"
                        />
                    </div>
                </div>

                <div className="space-y-1.5 flex flex-col">
                    <label className="text-label-caps ml-1">Status Operacional</label>
                    <Tabs value={filtroStatus} onValueChange={setFiltroStatus} className="w-full">
                        <TabsList className="bg-muted/40 p-1.5 rounded-xl h-14 flex w-full border border-border/50">
                            <TabsTrigger value="TODOS" className="flex-1 rounded-xl font-black text-[10px] tracking-widest">TODOS</TabsTrigger>
                            <TabsTrigger value={VeiculoStatus.ACTIVE} className="flex-1 rounded-xl font-black text-[10px] tracking-widest">ATIVOS</TabsTrigger>
                            <TabsTrigger value={VeiculoStatus.IN_TRANSIT} className="flex-1 rounded-xl font-black text-[10px] tracking-widest">VIAGEM</TabsTrigger>
                            <TabsTrigger value={VeiculoStatus.MAINTENANCE} className="flex-1 rounded-xl font-black text-[10px] tracking-widest text-amber-600">MANUT.</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="space-y-1.5 flex flex-col">
                    <label className="text-label-caps ml-1">Categoria</label>
                    <Tabs value={filtroTipo} onValueChange={setFiltroTipo} className="w-full">
                        <TabsList className="bg-muted/40 p-1.5 rounded-xl h-14 flex w-full border border-border/50">
                            <TabsTrigger value="TODOS" className="flex-1 rounded-xl font-black text-[10px] tracking-widest">TODOS</TabsTrigger>
                            <TabsTrigger value="ONIBUS" className="flex-1 rounded-xl font-black text-[10px] tracking-widest">ÔNIBUS</TabsTrigger>
                            <TabsTrigger value="CAMINHAO" className="flex-1 rounded-xl font-black text-[10px] tracking-widest">CAMINHÕES</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </ListFilterSection>

            <Card className="border-none shadow-2xl shadow-muted/20 overflow-hidden rounded-3xl bg-card/50 backdrop-blur-sm">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="pl-8 h-14 text-table-head">Veículo</TableHead>
                            <TableHead className="h-14 text-table-head text-center">Tipo</TableHead>
                            <TableHead className="h-14 text-table-head">Status</TableHead>
                            <TableHead className="h-14 text-table-head">KMs & Revisão</TableHead>
                            <TableHead className="h-14 text-table-head text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {veiculosFiltrados.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="h-64 text-center"><Inbox className="w-12 h-14 mx-auto text-muted-foreground/30" /><p className="font-bold text-sm text-muted-foreground">Nenhum veículo encontrado</p></TableCell></TableRow>
                        ) : (
                            veiculosFiltrados.map((veiculo) => {
                                const kmAt = Number(veiculo.km_atual || 0);
                                const kmRev = Number(veiculo.proxima_revisao_km || 0);
                                const progressoManutencao = calcularProgressoManutencao(kmAt, kmRev);
                                const proximoManutencao = kmRev - kmAt;
                                const alertaManutencao = proximoManutencao <= 5000;

                                return (
                                    <TableRow key={veiculo.id} className="group hover:bg-muted/20 border-border/30 transition-colors">
                                        <TableCell className="pl-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-12 h-14 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110",
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
                                        <TableCell className="text-center font-bold text-xs uppercase tracking-widest">{veiculo.tipo}</TableCell>
                                        <TableCell><StatusBadge status={veiculo.status} /></TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-2 w-48">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-sm font-semibold tracking-tight">{kmAt.toLocaleString()} KM</span>
                                                    <span className={cn("text-xs font-semibold", alertaManutencao ? "text-orange-500" : "text-muted-foreground")}>{kmRev.toLocaleString()} KM</span>
                                                </div>
                                                <Progress value={progressoManutencao} className={cn("h-1.5", alertaManutencao ? "bg-orange-500/10 [&>div]:bg-orange-500" : "bg-emerald-500/10 [&>div]:bg-emerald-500")} />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <VehicleActions veiculo={veiculo} onUpdate={() => navigate(".", { replace: true })} />
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
}
