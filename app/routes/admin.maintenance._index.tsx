import React, { useState } from 'react';
import { data as json } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData, useNavigate, Link, useFetcher } from "react-router";
import { useDateFormatter } from '@/hooks/useDateFormatter';
import {
    Wrench,
    Plus,
    Search,
    Calendar,
    AlertTriangle,
    CheckCircle,
    Clock,
    DollarSign,
    TrendingUp,
    Loader,
    Inbox,
    WrenchIcon
} from 'lucide-react';
import { IManutencao, TipoManutencao, StatusManutencao, StatusManutencaoLabel, TipoManutencaoLabel } from '@/types';
import { db } from "@/db/db.server";
import { maintenance as maintenanceTable, vehicle as vehicleTable } from "@/db/schema";
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
import { PageHeader } from '@/components/Layout/PageHeader';
import { DashboardCard } from '@/components/Layout/DashboardCard';
import { ListFilterSection } from '@/components/Layout/ListFilterSection';
import { cn } from "@/lib/utils";
import { MaintenanceActions } from '@/components/Manutencao/MaintenanceActions';

export const loader = async ({ request, params }: { request: Request, params: any }) => {
    const maintenancesData = await db.query.maintenance.findMany({
        with: {
            vehicle: true
        },
        orderBy: [desc(maintenanceTable.createdAt)]
    });

    return json({
        maintenances: maintenancesData
    });
};

export const action = async ({ request, params }: { request: Request, params: any }) => {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const id = formData.get("id") as string;

    if (intent === "delete") {
        await db.delete(maintenanceTable).where(eq(maintenanceTable.id, id));
        return json({ success: true, message: "Manutenção excluída" });
    }

    return null;
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const configs: any = {
        [StatusManutencao.SCHEDULED]: {
            label: StatusManutencaoLabel[StatusManutencao.SCHEDULED],
            icon: Clock,
            className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        },
        [StatusManutencao.IN_PROGRESS]: {
            label: StatusManutencaoLabel[StatusManutencao.IN_PROGRESS],
            icon: Wrench,
            className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        },
        [StatusManutencao.COMPLETED]: {
            label: StatusManutencaoLabel[StatusManutencao.COMPLETED],
            icon: CheckCircle,
            className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        },
        [StatusManutencao.CANCELLED]: {
            label: StatusManutencaoLabel[StatusManutencao.CANCELLED],
            icon: AlertTriangle,
            className: "bg-destructive/10 text-destructive border-destructive/20",
        }
    };

    const config = configs[status] || { label: status, className: "bg-muted text-muted-foreground", icon: Clock };
    const Icon = config.icon;

    return (
        <Badge variant="outline" className={cn("gap-1.5 font-bold px-2 py-0.5 rounded-lg", config.className)}>
            <Icon size={12} strokeWidth={2.5} />
            {config.label}
        </Badge>
    );
};

const TypeBadge: React.FC<{ tipo: string }> = ({ tipo }) => {
    const configs: any = {
        [TipoManutencao.PREVENTIVE]: { label: 'Preventiva', icon: Clock, className: "text-blue-600" },
        [TipoManutencao.CORRECTIVE]: { label: 'Corretiva', icon: AlertTriangle, className: "text-rose-600" },
        [TipoManutencao.PREDICTIVE]: { label: 'Preditiva', icon: TrendingUp, className: "text-violet-600" },
        [TipoManutencao.INSPECTION]: { label: 'Inspeção', icon: CheckCircle, className: "text-emerald-600" },
    };

    const config = configs[tipo] || { label: tipo, className: "text-muted-foreground", icon: Wrench };
    const Icon = config.icon;

    return (
        <div className={cn("flex items-center gap-1.5 font-bold text-[12px] tracking-tight", config.className)}>
            <Icon size={12} strokeWidth={2.5} />
            <span className="uppercase">{config.label}</span>
        </div>
    );
};

export default function MaintenancePage() {
    const { maintenances: initialMaintenances } = useLoaderData<typeof loader>();
    const navigate = useNavigate();
    const { formatDate: formatSystemDate } = useDateFormatter();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('TODOS');

    const maintenances = initialMaintenances as any[];

    const filteredMaintenances = maintenances.filter(m => {
        const matchesSearch =
            (m.description?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
            (m.vehicle?.placa?.toLowerCase().includes(searchTerm.toLowerCase()) || '');

        const matchesStatus = filterStatus === 'TODOS' || m.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const totalMaintenances = maintenances.length;
    const inProgress = maintenances.filter(m => m.status === StatusManutencao.IN_PROGRESS).length;
    const totalCost = maintenances.reduce((acc, curr) => acc + Number(curr.cost_parts || 0) + Number(curr.cost_labor || 0), 0);
    const scheduledNext7Days = maintenances.filter(m => {
        if (m.status !== StatusManutencao.SCHEDULED) return false;
        const date = new Date(m.scheduledDate);
        const now = new Date();
        const diffTime = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
    }).length;

    return (
        <div key="maintenance-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <PageHeader
                title="Gestão de Manutenção"
                subtitle="Controle preventivo e corretivo da frota"
                icon={Wrench}
                rightElement={
                    <Button asChild className="h-14 px-6 rounded-xl font-semibold shadow-lg shadow-primary/20">
                        <Link to="/admin/maintenance/new">
                            <Plus size={20} className="mr-2" strokeWidth={3} />
                            NOVA MANUTENÇÃO
                        </Link>
                    </Button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <DashboardCard title="Total Registros" value={totalMaintenances} icon={Wrench} variant="primary" />
                <DashboardCard title="Na Oficina" value={inProgress} icon={Clock} variant="amber" />
                <DashboardCard title="Investimento Total" value={`R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={DollarSign} variant="emerald" />
                <DashboardCard title="Agendadas (7d)" value={scheduledNext7Days} icon={Calendar} variant="purple" />
            </div>

            <ListFilterSection>
                <div className="space-y-1.5 flex flex-col lg:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80 ml-1">Buscar Manutenção</label>
                    <div className="relative group flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                        <Input
                            placeholder="Descrição ou placa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 h-14 bg-muted/40 border-input rounded-xl font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary/20"
                        />
                    </div>
                </div>

                <div className="space-y-1.5 flex flex-col lg:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80 ml-1">Status da Manutenção</label>
                    <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-full">
                        <TabsList className="bg-muted/40 p-1.5 rounded-xl h-14 flex w-full border border-border/50">
                            <TabsTrigger value="TODOS" className="flex-1 rounded-xl font-black text-[10px] tracking-widest">TODOS</TabsTrigger>
                            <TabsTrigger value={StatusManutencao.SCHEDULED} className="flex-1 rounded-xl font-black text-[10px] tracking-widest">Agendadas</TabsTrigger>
                            <TabsTrigger value={StatusManutencao.IN_PROGRESS} className="flex-1 rounded-xl font-black text-[10px] tracking-widest">Oficina</TabsTrigger>
                            <TabsTrigger value={StatusManutencao.COMPLETED} className="flex-1 rounded-xl font-black text-[10px] tracking-widest">Concluídas</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </ListFilterSection>

            <Card className="shadow-2xl shadow-muted/20 overflow-hidden rounded-[2.5rem] bg-card/50 backdrop-blur-sm">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="pl-8 h-14 text-[12px] font-semibold uppercase tracking-widest">Veículo</TableHead>
                            <TableHead className="h-14 text-[12px] font-semibold uppercase tracking-widest">Descrição / Tipo</TableHead>
                            <TableHead className="h-14 text-[12px] font-semibold uppercase tracking-widest">Data & Status</TableHead>
                            <TableHead className="h-14 text-[12px] font-semibold uppercase tracking-widest">Investimento</TableHead>
                            <TableHead className="pr-8 h-14 text-[12px] font-semibold uppercase tracking-widest text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredMaintenances.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="h-64 text-center"><Inbox className="w-12 h-14 mx-auto text-muted-foreground/30" /><p className="font-bold text-sm text-muted-foreground">Nenhuma manutenção encontrada</p></TableCell></TableRow>
                        ) : (
                            filteredMaintenances.map((manutencao) => (
                                <TableRow key={manutencao.id} className="group hover:bg-muted/20 border-border/30 transition-colors">
                                    <TableCell className="pl-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-14 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110"><WrenchIcon size={22} /></div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-sm tracking-tight text-foreground">{manutencao.vehicle?.placa || 'Sem Placa'}</span>
                                                <span className="text-[11px] font-bold text-muted-foreground/80">{manutencao.vehicle?.modelo || 'N/D'}</span>
                                                <span className="text-[12px] font-semibold text-primary/60 uppercase">{manutencao.km_veiculo.toLocaleString()} KM</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1 max-w-[200px]">
                                            <TypeBadge tipo={manutencao.type} />
                                            <span className="text-sm font-bold tracking-tight text-foreground truncate">{manutencao.description}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                                <Calendar className="w-3.5 h-3.5 text-primary" strokeWidth={3} />
                                                {formatSystemDate(new Date(manutencao.scheduledDate))}
                                            </div>
                                            <StatusBadge status={manutencao.status} />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm font-semibold text-emerald-600">
                                            <span>R$ {(Number(manutencao.cost_parts) + Number(manutencao.cost_labor)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-60">P: {Number(manutencao.cost_parts).toLocaleString()} / M: {Number(manutencao.cost_labor).toLocaleString()}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="pr-8 text-right"><MaintenanceActions manutencao={manutencao} onUpdate={() => navigate(".", { replace: true })} /></TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );

}
