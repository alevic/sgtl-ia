import React, { useState, useRef } from 'react';
import { data as json } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData, useNavigate, Link, useFetcher } from "react-router";
import { useDateFormatter } from '@/hooks/useDateFormatter';
import { IViagem, ITag, TripStatus, TripStatusLabel } from '@/types';
import { db } from "@/db/db.server";
import { trips as tripsTable } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

import {
    Bus, Calendar, MapPin, Users, Filter, Plus, Search,
    CheckCircle, Clock, Loader, XCircle, TrendingUp, AlertTriangle,
    Edit, Trash2, ToggleLeft, ToggleRight, ClipboardList,
    ChevronDown, Check, Ticket, MoreHorizontal, ArrowRight,
    MapPinned, Gauge
} from 'lucide-react';
import { PassengerListModal } from '@/components/PassengerListModal';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Card } from "@/components/ui/card";
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
import { PageHeader } from "@/components/Layout/PageHeader";
import { DashboardCard } from "@/components/Layout/DashboardCard";
import { ListFilterSection } from "@/components/Layout/ListFilterSection";
import { cn } from "@/lib/utils";

export const loader = async ({ request, params }: { request: Request, params: any }) => {
    const tripsData = await db.query.trips.findMany({
        orderBy: [desc(tripsTable.departure_date)]
    });

    return json({
        trips: tripsData,
        tags: []
    });
};

export const action = async ({ request, params }: { request: Request, params: any }) => {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const id = formData.get("id") as string;

    if (intent === "delete") {
        await db.delete(tripsTable).where(eq(tripsTable.id, id));
        return json({ success: true });
    }

    return null;
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const configs: any = {
        [TripStatus.SCHEDULED]: { color: 'yellow', icon: Clock, label: TripStatusLabel[TripStatus.SCHEDULED], class: 'bg-amber-500/15 text-amber-700' },
        [TripStatus.BOARDING]: { color: 'blue', icon: Loader, label: TripStatusLabel[TripStatus.BOARDING], class: 'bg-blue-500/15 text-blue-700' },
        [TripStatus.IN_TRANSIT]: { color: 'blue', icon: Loader, label: TripStatusLabel[TripStatus.IN_TRANSIT], class: 'bg-indigo-500/15 text-indigo-700' },
        [TripStatus.COMPLETED]: { color: 'slate', icon: CheckCircle, label: TripStatusLabel[TripStatus.COMPLETED], class: 'bg-slate-500/15 text-slate-700' },
    };

    const config = configs[status] || configs[TripStatus.SCHEDULED];
    const Icon = config.icon;

    return (
        <Badge variant="outline" className={cn("flex items-center gap-1 font-bold px-2 py-0.5 rounded-full", config.class)}>
            <Icon size={12} className={status === TripStatus.BOARDING || status === TripStatus.IN_TRANSIT ? "animate-spin" : ""} />
            {config.label}
        </Badge>
    );
};

export default function TripsPage() {
    const { trips: initialTrips } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();
    const [filtroStatus, setFiltroStatus] = useState<string[]>([]);
    const [busca, setBusca] = useState('');
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [tripToDelete, setTripToDelete] = useState<string | null>(null);
    const [isPassengerModalOpen, setIsPassengerModalOpen] = useState(false);
    const [selectedTripForPassengers, setSelectedTripForPassengers] = useState<any>(null);
    const { formatDate } = useDateFormatter();
    const navigate = useNavigate();

    const trips = initialTrips as any[];

    const filteredTrips = trips.filter(v => {
        const matchStatus = filtroStatus.length === 0 || filtroStatus.includes(v.status);
        const matchBusca = busca === '' || (v.title || '').toLowerCase().includes(busca.toLowerCase());
        return matchStatus && matchBusca;
    });

    const statusOptions = [
        { value: TripStatus.SCHEDULED, label: TripStatusLabel[TripStatus.SCHEDULED] },
        { value: TripStatus.BOARDING, label: TripStatusLabel[TripStatus.BOARDING] },
        { value: TripStatus.IN_TRANSIT, label: TripStatusLabel[TripStatus.IN_TRANSIT] },
        { value: TripStatus.COMPLETED, label: TripStatusLabel[TripStatus.COMPLETED] },
    ];

    const toggleStatus = (status: string) => {
        setFiltroStatus(prev =>
            prev.includes(status)
                ? prev.filter(s => s !== status)
                : [...prev, status]
        );
    };

    return (
        <div key="trips-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <PageHeader
                title="Quadro de Viagens"
                subtitle="Monitoramento operacional de itinerários ativos"
                icon={Bus}
                rightElement={
                    <Button asChild className="h-14 px-6 rounded-xl font-semibold gap-2 shadow-lg shadow-primary/20">
                        <Link to="/admin/trips/new">
                            <Plus size={20} strokeWidth={2.5} /> NOVA VIAGEM
                        </Link>
                    </Button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <DashboardCard title="Total Viagens" value={trips.length} icon={Bus} variant="primary" />
                <DashboardCard title="Agendadas" value={trips.filter(v => v.status === TripStatus.SCHEDULED).length} icon={Calendar} variant="emerald" />
                <DashboardCard title="Em Curso" value={trips.filter(v => v.status === TripStatus.IN_TRANSIT).length} icon={Loader} variant="blue" />
                <DashboardCard title="Ocupação" value="82%" icon={TrendingUp} variant="amber" />
            </div>

            <ListFilterSection className="lg:grid-cols-3">
                <div className="space-y-1.5 flex flex-col">
                    <label className="text-label-caps ml-1">Buscar Rota</label>
                    <div className="relative group flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input placeholder="Nome da rota..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-12 h-14 bg-muted/40 border-input rounded-xl font-bold" />
                    </div>
                </div>

                <div className="space-y-1.5 flex flex-col">
                    <label className="text-label-caps ml-1">Status Operacional</label>
                    <Popover open={isStatusDropdownOpen} onOpenChange={setIsStatusDropdownOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="h-14 w-full bg-muted/40 border-input rounded-xl font-bold justify-between">
                                <div className="flex items-center gap-2">
                                    <Filter size={16} strokeWidth={2.5} />
                                    <span>{filtroStatus.length === 0 ? 'Todos Status' : `${filtroStatus.length} selecionado(s)`}</span>
                                </div>
                                <ChevronDown size={16} />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[220px] p-2 rounded-xl shadow-2xl border-none">
                            {statusOptions.map((opt) => (
                                <div key={opt.value} className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg cursor-pointer" onClick={() => toggleStatus(opt.value)}>
                                    <div className={cn("w-4 h-4 rounded border-2", filtroStatus.includes(opt.value) ? "bg-primary" : "border-muted-foreground")}>
                                        {filtroStatus.includes(opt.value) && <Check size={12} className="text-white" />}
                                    </div>
                                    <span className="text-xs font-bold">{opt.label}</span>
                                </div>
                            ))}
                        </PopoverContent>
                    </Popover>
                </div>
            </ListFilterSection>

            <Card className="shadow-2xl shadow-muted/20 overflow-hidden rounded-3xl bg-card/50 backdrop-blur-sm">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="pl-8 h-14 text-table-head">Viagem / Rota</TableHead>
                            <TableHead className="h-14 text-table-head">Partida</TableHead>
                            <TableHead className="h-14 text-table-head">Ocupação</TableHead>
                            <TableHead className="h-14 text-table-head">Status</TableHead>
                            <TableHead className="pr-8 text-right h-14 text-table-head">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTrips.map((viagem) => (
                            <TableRow key={viagem.id} className="group hover:bg-muted/20 border-border/30 transition-colors h-20">
                                <TableCell className="pl-8">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sm tracking-tight">{viagem.route?.name || 'Rota Independente'}</span>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">ID: {viagem.id.substring(0, 8)}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-xs font-bold">
                                        <Calendar size={14} className="text-primary" />
                                        {formatDate(viagem.departure_date)} - {viagem.departure_time?.substring(0, 5)}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Users size={14} className="text-muted-foreground" />
                                        <span className="text-xs font-bold">---</span>
                                    </div>
                                </TableCell>
                                <TableCell><StatusBadge status={viagem.status} /></TableCell>
                                <TableCell className="pr-8 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 transition-colors"><MoreHorizontal size={18} /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-2xl border-none">
                                            <DropdownMenuItem onClick={() => navigate(`/admin/trips/${viagem.id}`)} className="rounded-xl h-11 font-bold">Editar Escala</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setTripToDelete(viagem.id)} className="rounded-xl h-11 font-bold text-destructive">Cancelar Viagem</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            <AlertDialog open={!!tripToDelete} onOpenChange={(open) => !open && setTripToDelete(null)}>
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Cancelamento</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação removerá a escala permanentemente.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl border-none font-bold">Voltar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => tripToDelete && fetcher.submit({ intent: 'delete', id: tripToDelete }, { method: 'post' })} className="rounded-xl bg-destructive font-bold">CANCELAR VIAGEM</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
