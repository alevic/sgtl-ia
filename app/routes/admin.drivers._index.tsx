import React, { useState } from 'react';
import { data as json } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData, useNavigate, Link, useFetcher } from "react-router";
import { useDateFormatter } from '@/hooks/useDateFormatter';
import { IMotorista, DriverStatus, DriverStatusLabel } from '@/types';
import {
    User,
    Calendar,
    CheckCircle,
    XCircle,
    AlertCircle,
    FileText,
    Search,
    Plus,
    Inbox,
    Loader2,
    Clock,
    UserCircle
} from 'lucide-react';
import { db } from "@/db/db.server";
import { driver as driverTable } from "@/db/schema";
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
import { DriverActions } from '@/components/Motoristas/DriverActions';

export const loader = async ({ request, params }: { request: Request, params: any }) => {
    const driversData = await db.select().from(driverTable).orderBy(desc(driverTable.createdAt));
    return json({ drivers: driversData });
};

export const action = async ({ request, params }: { request: Request, params: any }) => {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const id = formData.get("id") as string;

    if (intent === "delete") {
        await db.delete(driverTable).where(eq(driverTable.id, id));
        return json({ success: true, message: "Motorista excluído" });
    }

    return null;
};

const StatusBadge: React.FC<{ status: DriverStatus }> = ({ status }) => {
    const configs: Record<string, { className: string; icon: any }> = {
        [DriverStatus.AVAILABLE]: { className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle },
        [DriverStatus.IN_TRANSIT]: { className: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Clock },
        [DriverStatus.ON_LEAVE]: { className: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Calendar },
        [DriverStatus.AWAY]: { className: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle }
    };

    const config = configs[status] || configs[DriverStatus.AVAILABLE];
    const Icon = config.icon;

    return (
        <Badge variant="outline" className={cn("gap-1.5 font-bold px-2 py-0.5 rounded-lg", config.className)}>
            <Icon size={12} strokeWidth={2.5} />
            {DriverStatusLabel[status] || (status as string)}
        </Badge>
    );
};

export default function DriversPage() {
    const { drivers: initialDrivers } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();
    const navigate = useNavigate();
    const { formatDate } = useDateFormatter();
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState<'TODOS' | string>('TODOS');

    const drivers = initialDrivers as any[];

    const filteredDrivers = drivers.filter(d => {
        const matchStatus = filtroStatus === 'TODOS' || d.status === filtroStatus;
        const matchBusca = busca === '' ||
            (d.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
            (d.cnh || '').includes(busca);
        return matchStatus && matchBusca;
    });

    const total = drivers.length;
    const disponiveis = drivers.filter(m => m.status === DriverStatus.AVAILABLE).length;
    const emViagem = drivers.filter(m => m.status === DriverStatus.IN_TRANSIT).length;
    const ferias = drivers.filter(m => m.status === DriverStatus.ON_LEAVE).length;

    return (
        <div key="drivers-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <PageHeader
                title="Gestão de Motoristas"
                subtitle="Controle de profissionais e documentação"
                icon={UserCircle}
                rightElement={
                    <Button asChild className="h-14 px-6 rounded-xl font-semibold shadow-lg shadow-primary/20">
                        <Link to="/admin/drivers/new">
                            <Plus size={20} className="mr-2" strokeWidth={3} /> NOVO MOTORISTA
                        </Link>
                    </Button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <DashboardCard title="Total Registrados" value={total} icon={User} variant="primary" />
                <DashboardCard title="Disponíveis" value={disponiveis} icon={CheckCircle} variant="emerald" />
                <DashboardCard title="Em Viagem" value={emViagem} icon={Clock} variant="blue" />
                <DashboardCard title="Em Férias/Licença" value={ferias} icon={Calendar} variant="amber" />
            </div>

            <ListFilterSection>
                <div className="space-y-1.5 flex flex-col lg:col-span-2">
                    <label className="text-label-caps ml-1">Buscar Motorista</label>
                    <div className="relative group flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input placeholder="Nome ou CNH..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-12 h-14 bg-muted/40 border-input rounded-xl font-bold" />
                    </div>
                </div>

                <div className="space-y-1.5 flex flex-col lg:col-span-2">
                    <label className="text-label-caps ml-1">Status Operacional</label>
                    <Tabs value={filtroStatus} onValueChange={setFiltroStatus} className="w-full">
                        <TabsList className="bg-muted/40 p-1.5 rounded-xl h-14 flex w-full border border-border/50">
                            <TabsTrigger value="TODOS" className="flex-1 rounded-xl font-black text-[10px] tracking-widest">TODOS</TabsTrigger>
                            <TabsTrigger value={DriverStatus.AVAILABLE} className="flex-1 rounded-xl font-black text-[10px] tracking-widest">Disponíveis</TabsTrigger>
                            <TabsTrigger value={DriverStatus.IN_TRANSIT} className="flex-1 rounded-xl font-black text-[10px] tracking-widest">Viagem</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </ListFilterSection>

            <Card className="border-none shadow-2xl shadow-muted/20 overflow-hidden rounded-3xl bg-card/50 backdrop-blur-sm">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="pl-8 h-14 text-table-head">Motorista / Documento</TableHead>
                            <TableHead className="h-14 text-table-head">Status</TableHead>
                            <TableHead className="h-14 text-table-head">Validade CNH</TableHead>
                            <TableHead className="pr-8 h-14 text-table-head text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredDrivers.map((motorista) => (
                            <TableRow key={motorista.id} className="group hover:bg-muted/20 border-border/30 transition-colors">
                                <TableCell className="pl-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110"><User size={22} /></div>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-sm tracking-tight text-foreground">{motorista.nome}</span>
                                            <span className="text-[12px] font-semibold text-primary uppercase">CNH: {motorista.cnh}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell><StatusBadge status={motorista.status} /></TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                        <Calendar className="w-3.5 h-3.5 text-primary" strokeWidth={3} />
                                        {formatDate(motorista.validade_cnh)}
                                    </div>
                                </TableCell>
                                <TableCell className="pr-8 text-right"><DriverActions motorista={motorista} onUpdate={() => navigate(".", { replace: true })} /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
