import React, { useState } from 'react';
import { data as json } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData, useNavigate, useSearchParams, useFetcher, Link } from "react-router";
import { useDateFormatter } from '@/hooks/useDateFormatter';
import { IReserva, ReservationStatus, ReservationStatusLabel, TipoTransacao, StatusTransacao, FormaPagamento } from '@/types';
import {
    Ticket, User, Bus, Calendar, DollarSign, Filter, Plus, Search, Loader,
    Edit, Trash2, XCircle, RefreshCw, MoreVertical, X, Save, AlertTriangle,
    UserCheck, CheckCircle, ChevronDown, Check, CreditCard, Banknote,
    ArrowRightLeft, MapPin, Phone, Mail, FileText, LayoutGrid, Clock, ListFilter,
    ShieldCheck, Inbox, Wallet, History, MoreHorizontal, ChevronRight, Gauge
} from 'lucide-react';
import { db } from "@/db/db.server";
import { reservation as reservationTable, vehicle as vehicleTable, trips as tripTable } from "@/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/Layout/PageHeader";
import { DashboardCard } from "@/components/Layout/DashboardCard";
import { ListFilterSection } from "@/components/Layout/ListFilterSection";
import { cn } from "@/lib/utils";

export const loader = async ({ request, params }: { request: Request, params: any }) => {
    const reservations = await db.select().from(reservationTable).orderBy(desc(reservationTable.createdAt));
    const vehicles = await db.select().from(vehicleTable);
    const trips = await db.select().from(tripTable);
    return json({ reservations, vehicles, trips });
};

export const action = async ({ request, params }: { request: Request, params: any }) => {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const id = formData.get("id") as string;

    if (intent === "delete") {
        await db.delete(reservationTable).where(eq(reservationTable.id, id));
        return json({ success: true });
    }

    if (intent === "update-status") {
        const status = formData.get("status") as string;
        await db.update(reservationTable).set({
            status,
            updatedAt: new Date()
        } as any).where(eq(reservationTable.id, id));
        return json({ success: true });
    }

    return null;
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const configs: any = {
        [ReservationStatus.PENDING]: { color: 'bg-amber-500', text: 'text-amber-500', label: ReservationStatusLabel[ReservationStatus.PENDING] },
        [ReservationStatus.CONFIRMED]: { color: 'bg-emerald-500', text: 'text-emerald-500', label: ReservationStatusLabel[ReservationStatus.CONFIRMED] },
        [ReservationStatus.CANCELLED]: { color: 'bg-destructive', text: 'text-destructive', label: ReservationStatusLabel[ReservationStatus.CANCELLED] },
        [ReservationStatus.USED]: { color: 'bg-blue-500', text: 'text-blue-500', label: ReservationStatusLabel[ReservationStatus.USED] },
        [ReservationStatus.CHECKED_IN]: { color: 'bg-indigo-500', text: 'text-indigo-500', label: ReservationStatusLabel[ReservationStatus.CHECKED_IN] },
    };

    const config = configs[status] || configs[ReservationStatus.PENDING];

    return (
        <Badge variant="outline" className={cn("rounded-xl font-semibold text-[10px] px-2 py-0.5 uppercase tracking-tighter", config.color + "/10", config.text)}>
            {config.label}
        </Badge>
    );
};

export default function ReservationsPage() {
    const { reservations: initialReservations, vehicles, trips } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();
    const { formatDate } = useDateFormatter();
    const [filtroStatus, setFiltroStatus] = useState<string[]>([]);
    const [filtroVeiculo, setFiltroVeiculo] = useState<string>('TODOS');
    const [filtroViagem, setFiltroViagem] = useState<string>('TODOS');
    const [busca, setBusca] = useState('');
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const navigate = useNavigate();

    const reservations = initialReservations as any[];

    const filteredReservations = reservations.filter(r => {
        const matchStatus = filtroStatus.length === 0 || filtroStatus.includes(r.status);
        const matchVeiculo = filtroVeiculo === 'TODOS' || r.vehicle_id === filtroVeiculo;
        const matchViagem = filtroViagem === 'TODOS' || r.trip_id === filtroViagem;
        const matchBusca = busca === '' || (r.passenger_name || '').toLowerCase().includes(busca.toLowerCase()) || (r.ticket_code || '').toLowerCase().includes(busca.toLowerCase());
        return matchStatus && matchVeiculo && matchViagem && matchBusca;
    });

    const statusOptions = [
        { value: ReservationStatus.PENDING, label: ReservationStatusLabel[ReservationStatus.PENDING] },
        { value: ReservationStatus.CONFIRMED, label: ReservationStatusLabel[ReservationStatus.CONFIRMED] },
        { value: ReservationStatus.CHECKED_IN, label: ReservationStatusLabel[ReservationStatus.CHECKED_IN] },
        { value: ReservationStatus.USED, label: ReservationStatusLabel[ReservationStatus.USED] },
        { value: ReservationStatus.CANCELLED, label: ReservationStatusLabel[ReservationStatus.CANCELLED] },
    ];

    const toggleStatus = (status: string) => {
        setFiltroStatus(prev =>
            prev.includes(status)
                ? prev.filter(s => s !== status)
                : [...prev, status]
        );
    };

    return (
        <div key="reservas-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <PageHeader
                title="Gestão de Reservas"
                subtitle="Painel de controle de tickets e embarques"
                icon={Ticket}
                rightElement={
                    <Button asChild className="h-14 px-6 rounded-xl font-semibold shadow-lg shadow-primary/20">
                        <Link to="/admin/reservations/new">
                            <Plus size={20} className="mr-2" strokeWidth={3} /> NOVA RESERVA
                        </Link>
                    </Button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <DashboardCard title="Total Reservas" value={reservations.length} icon={Inbox} variant="primary" />
                <DashboardCard title="Aguardando" value={reservations.filter(r => r.status === ReservationStatus.PENDING).length} icon={Clock} variant="amber" />
                <DashboardCard title="Confirmadas" value={reservations.filter(r => r.status === ReservationStatus.CONFIRMED).length} icon={ShieldCheck} variant="emerald" />
                <DashboardCard title="Performance" value="94%" icon={Gauge} variant="blue" />
            </div>

            <ListFilterSection className="lg:grid-cols-4">
                <div className="space-y-1.5 flex flex-col">
                    <label className="text-label-caps ml-1">Buscar</label>
                    <div className="relative group flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input placeholder="Código ou passageiro..." value={busca} onChange={(e) => setBusca(e.target.value)} className="h-14 pl-12 bg-muted/40 border-input rounded-xl font-bold" />
                    </div>
                </div>

                <div className="space-y-1.5 flex flex-col">
                    <label className="text-label-caps ml-1">Veículo</label>
                    <Select value={filtroVeiculo} onValueChange={setFiltroVeiculo}>
                        <SelectTrigger className="h-14 w-full bg-muted/40 border-input rounded-xl font-bold"><SelectValue placeholder="Todos" /></SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl">
                            <SelectItem value="TODOS" className="rounded-xl font-bold">Todos os Veículos</SelectItem>
                            {vehicles.map((v: any) => <SelectItem key={v.id} value={v.id} className="rounded-xl font-bold">{v.modelo} - {v.placa}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5 flex flex-col">
                    <label className="text-label-caps ml-1">Viagem</label>
                    <Select value={filtroViagem} onValueChange={setFiltroViagem}>
                        <SelectTrigger className="h-14 w-full bg-muted/40 border-input rounded-xl font-bold"><SelectValue placeholder="Todas" /></SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl">
                            <SelectItem value="TODOS" className="rounded-xl font-bold">Todas as Viagens</SelectItem>
                            {trips.map((v: any) => <SelectItem key={v.id} value={v.id} className="rounded-xl font-bold">{formatDate(v.departure_date)}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5 flex flex-col">
                    <label className="text-label-caps ml-1">Status</label>
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
                        <PopoverContent className="w-[200px] p-2 rounded-xl shadow-2xl border-none">
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
                            <TableHead className="pl-8 h-14 text-table-head">Passageiro</TableHead>
                            <TableHead className="h-14 text-table-head">Assento</TableHead>
                            <TableHead className="h-14 text-table-head text-center">Status</TableHead>
                            <TableHead className="pr-8 text-right h-14 text-table-head">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredReservations.map((reserva) => (
                            <TableRow key={reserva.id} className="group hover:bg-muted/20 border-border/30 transition-colors h-20">
                                <TableCell className="pl-8">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sm tracking-tight">{reserva.passenger_name}</span>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">#{reserva.ticket_code || reserva.id.substring(0, 8)}</span>
                                    </div>
                                </TableCell>
                                <TableCell><Badge variant="outline" className="rounded-lg font-bold">{reserva.seat_number}</Badge></TableCell>
                                <TableCell className="text-center"><StatusBadge status={reserva.status} /></TableCell>
                                <TableCell className="pr-8 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 transition-colors"><MoreHorizontal size={18} /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-2xl border-none">
                                            <DropdownMenuItem onClick={() => fetcher.submit({ intent: "update-status", id: reserva.id, status: ReservationStatus.CHECKED_IN }, { method: "post" })} className="rounded-xl font-bold h-11">Realizar Check-in</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => fetcher.submit({ intent: "delete", id: reserva.id }, { method: "post" })} className="rounded-xl font-bold h-11 text-destructive">Excluir Reserva</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
