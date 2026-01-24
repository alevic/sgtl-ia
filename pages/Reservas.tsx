import React, { useState, useEffect, useRef } from 'react';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { IReserva, ReservationStatus, ReservationStatusLabel } from '../types';
import { reservationsService } from '../services/reservationsService';
import { transactionsService } from '../services/transactionsService';
import { clientsService } from '../services/clientsService';
import { vehiclesService } from '../services/vehiclesService';
import { tripsService } from '../services/tripsService';
import { TipoTransacao, StatusTransacao, FormaPagamento, CategoriaReceita, CategoriaDespesa, IVeiculo, IViagem } from '../types';
import {
    Ticket, User, Bus, Calendar, DollarSign, Filter, Plus, Search, Loader,
    Edit, Trash2, XCircle, RefreshCw, MoreVertical, X, Save, AlertTriangle,
    UserCheck, CheckCircle, ChevronDown, Check, CreditCard, Banknote,
    ArrowRightLeft, MapPin, Phone, Mail, FileText, LayoutGrid, Clock, ListFilter,
    ShieldCheck, Inbox, Wallet, History, MoreHorizontal
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../components/ui/popover";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/Textarea";
import { PageHeader } from "../components/Layout/PageHeader";
import { DashboardCard } from "../components/Layout/DashboardCard";
import { ListFilterSection } from "../components/Layout/ListFilterSection";
import { cn } from "../lib/utils";

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const configs: any = {
        [ReservationStatus.PENDING]: { color: 'bg-amber-500', text: 'text-amber-500', label: ReservationStatusLabel[ReservationStatus.PENDING] },
        [ReservationStatus.CONFIRMED]: { color: 'bg-emerald-500', text: 'text-emerald-500', label: ReservationStatusLabel[ReservationStatus.CONFIRMED] },
        [ReservationStatus.CANCELLED]: { color: 'bg-destructive', text: 'text-destructive', label: ReservationStatusLabel[ReservationStatus.CANCELLED] },
        [ReservationStatus.USED]: { color: 'bg-blue-500', text: 'text-blue-500', label: ReservationStatusLabel[ReservationStatus.USED] },
        [ReservationStatus.CHECKED_IN]: { color: 'bg-indigo-500', text: 'text-indigo-500', label: ReservationStatusLabel[ReservationStatus.CHECKED_IN] },
        [ReservationStatus.NO_SHOW]: { color: 'bg-slate-500', text: 'text-slate-500', label: ReservationStatusLabel[ReservationStatus.NO_SHOW] },
        [ReservationStatus.COMPLETED]: { color: 'bg-blue-600', text: 'text-blue-600', label: ReservationStatusLabel[ReservationStatus.COMPLETED] },
        'PENDENTE': { color: 'bg-amber-500', text: 'text-amber-500', label: ReservationStatusLabel[ReservationStatus.PENDING] },
        'CONFIRMADA': { color: 'bg-emerald-500', text: 'text-emerald-500', label: ReservationStatusLabel[ReservationStatus.CONFIRMED] },
        'CANCELADA': { color: 'bg-destructive', text: 'text-destructive', label: ReservationStatusLabel[ReservationStatus.CANCELLED] },
        'UTILIZADA': { color: 'bg-blue-500', text: 'text-blue-500', label: ReservationStatusLabel[ReservationStatus.USED] },
        'EMBARCADO': { color: 'bg-indigo-500', text: 'text-indigo-500', label: ReservationStatusLabel[ReservationStatus.CHECKED_IN] }
    };

    const config = configs[status] || configs[ReservationStatus.PENDING];

    return (
        <Badge variant="outline" className={cn(
            "rounded-xl font-semibold text-[12px] px-3 py-1 uppercase tracking-tighter shadow-sm",
            config.color.replace('bg-', 'bg-') + "/10",
            config.text
        )}>
            {config.label}
        </Badge>
    );
};

export const Reservas: React.FC = () => {
    const { formatDate, formatDateTime } = useDateFormatter();
    const [reservas, setReservas] = useState<IReserva[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtroStatus, setFiltroStatus] = useState<string[]>([ReservationStatus.PENDING, ReservationStatus.CONFIRMED]);
    const [filtroVeiculo, setFiltroVeiculo] = useState<string>('TODOS');
    const [filtroViagem, setFiltroViagem] = useState<string>('TODOS');
    const [veiculos, setVeiculos] = useState<IVeiculo[]>([]);
    const [viagens, setViagens] = useState<IViagem[]>([]);
    const [busca, setBusca] = useState('');
    const [searchParams] = useSearchParams();
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

    // Action States
    const [editingReserva, setEditingReserva] = useState<IReserva | null>(null);
    const [cancelingReserva, setCancelingReserva] = useState<IReserva | null>(null);
    const [paymentReserva, setPaymentReserva] = useState<IReserva | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Cancel Form State
    const [cancelReason, setCancelReason] = useState('');
    const [refundAction, setRefundAction] = useState<'NONE' | 'REFUND' | 'CREDIT'>('NONE');

    // Payment Form State
    const [paymentMethod, setPaymentMethod] = useState<FormaPagamento>(FormaPagamento.PIX);
    const [amountToPay, setAmountToPay] = useState<string>('');

    // Edit Form State
    const [editForm, setEditForm] = useState({
        passenger_name: '',
        passenger_document: '',
        passenger_email: '',
        passenger_phone: '',
        boarding_point: '',
        dropoff_point: ''
    });

    const navigate = useNavigate();

    const fetchReservas = async () => {
        try {
            setLoading(true);
            const data = await reservationsService.getAll();
            setReservas(data);
        } catch (error) {
            console.error('Erro ao carregar reservas:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchVeiculos = async () => {
        try {
            const data = await vehiclesService.getAll();
            setVeiculos(data);
        } catch (error) {
            console.error('Erro ao carregar veículos:', error);
        }
    };

    const fetchViagens = async () => {
        try {
            const data = await tripsService.getAll();
            setViagens(data);
        } catch (error) {
            console.error('Erro ao carregar viagens:', error);
        }
    };

    useEffect(() => {
        fetchReservas();
        fetchVeiculos();
        fetchViagens();

        const trip_id = searchParams.get('trip_id');
        if (trip_id) {
            setFiltroViagem(trip_id);
            setFiltroStatus([]);
        }
    }, [searchParams]);

    const handleEditClick = (reserva: IReserva) => {
        setEditingReserva(reserva);
        setEditForm({
            passenger_name: (reserva as any).passenger_name || '',
            passenger_document: (reserva as any).passenger_document || '',
            passenger_email: (reserva as any).passenger_email || '',
            passenger_phone: (reserva as any).passenger_phone || '',
            boarding_point: (reserva as any).boarding_point || '',
            dropoff_point: (reserva as any).dropoff_point || ''
        });
    };

    const handleSaveEdit = async () => {
        if (!editingReserva) return;
        try {
            setActionLoading(true);
            await reservationsService.update(editingReserva.id, editForm);
            setEditingReserva(null);
            fetchReservas();
        } catch (error) {
            console.error('Erro ao atualizar reserva:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelClick = (reserva: IReserva) => {
        setCancelingReserva(reserva);
        setCancelReason('');
        const amountPaid = Number(reserva.amount_paid || reserva.valor_pago || 0);
        setRefundAction(amountPaid > 0 ? 'REFUND' : 'NONE');
    };

    const handleConfirmCancel = async () => {
        if (!cancelingReserva) return;
        try {
            setActionLoading(true);
            const amountPaid = Number(cancelingReserva.amount_paid || cancelingReserva.valor_pago || 0);

            if (refundAction === 'REFUND' && amountPaid > 0) {
                await transactionsService.create({
                    tipo: TipoTransacao.EXPENSE,
                    descricao: `Reembolso Reserva ${cancelingReserva.ticket_code || cancelingReserva.codigo} - ${cancelingReserva.passenger_name}`,
                    valor: amountPaid,
                    moeda: cancelingReserva.moeda || 'BRL',
                    data_emissao: new Date().toISOString(),
                    data_vencimento: new Date().toISOString(),
                    data_pagamento: new Date().toISOString(),
                    status: StatusTransacao.PAID,
                    categoria_despesa: CategoriaDespesa.OUTROS,
                    reserva_id: cancelingReserva.id,
                    criado_por: 'Sistema',
                    observacoes: `Motivo cancelamento: ${cancelReason}`
                });
            } else if (refundAction === 'CREDIT' && amountPaid > 0) {
                let clientId = (cancelingReserva as any).client_id || cancelingReserva.cliente_id;
                if (!clientId) {
                    const doc = (cancelingReserva as any).passenger_document || (cancelingReserva as any).passenger_cpf;
                    const email = (cancelingReserva as any).passenger_email;
                    if (doc || email) {
                        try {
                            if (doc) {
                                const cleanDoc = doc.replace(/\D/g, '');
                                const searchRes = await clientsService.getAll(doc);
                                const match = searchRes.find((c: any) => {
                                    const cDoc = (c.documento || '').replace(/\D/g, '');
                                    const cCpf = (c.cpf || '').replace(/\D/g, '');
                                    const cCnpj = (c.cnpj || '').replace(/\D/g, '');
                                    return (cDoc && cDoc === cleanDoc) || (cCpf && cCpf === cleanDoc) || (cCnpj && cCnpj === cleanDoc);
                                });
                                if (match) clientId = match.id;
                            }
                            if (!clientId && email) {
                                const searchRes = await clientsService.getAll(email);
                                const match = searchRes.find((c: any) => c.email && c.email.toLowerCase() === email.toLowerCase());
                                if (match) clientId = match.id;
                            }
                        } catch (err) {
                            console.warn('Erro ao buscar cliente para vinculo:', err);
                        }
                    }
                }

                if (clientId) {
                    try {
                        const clientData = await clientsService.getById(clientId);
                        const currentCredit = Number(clientData.saldo_creditos || 0);
                        await clientsService.update(clientId, {
                            saldo_creditos: currentCredit + amountPaid
                        });
                    } catch (err) {
                        console.error('Erro ao buscar cliente para crédito:', err);
                    }
                }
            }

            await reservationsService.update(cancelingReserva.id, {
                status: ReservationStatus.CANCELLED,
                observacoes: cancelingReserva.observacoes
                    ? `${cancelingReserva.observacoes}\n[Cancelamento]: ${cancelReason}`
                    : `[Cancelamento]: ${cancelReason}`
            });

            setCancelingReserva(null);
            fetchReservas();
        } catch (error) {
            console.error('Erro ao cancelar reserva:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handlePaymentClick = (reserva: IReserva) => {
        setPaymentReserva(reserva);
        setPaymentMethod(FormaPagamento.PIX);
        const pending = Math.max(0, Number(reserva.valor_total || reserva.price || 0) - Number(reserva.amount_paid || reserva.valor_pago || 0));
        setAmountToPay(pending.toFixed(2));
    };

    const handleConfirmPayment = async () => {
        if (!paymentReserva || !amountToPay) return;
        const paidAmount = Number(amountToPay.replace(',', '.'));
        if (isNaN(paidAmount) || paidAmount <= 0) return;

        try {
            setActionLoading(true);
            await transactionsService.create({
                tipo: TipoTransacao.INCOME,
                descricao: `Pagamento Reserva ${paymentReserva.ticket_code || paymentReserva.codigo} - ${paymentReserva.passenger_name}`,
                valor: paidAmount,
                moeda: paymentReserva.moeda || 'BRL',
                data_emissao: new Date().toISOString(),
                data_vencimento: new Date().toISOString(),
                data_pagamento: new Date().toISOString(),
                status: StatusTransacao.PAID,
                forma_pagamento: paymentMethod,
                categoria_receita: CategoriaReceita.VENDA_PASSAGEM,
                reserva_id: paymentReserva.id,
                criado_por: 'Sistema'
            });

            const currentTotalPaid = Number(paymentReserva.amount_paid || paymentReserva.valor_pago || 0) + paidAmount;
            const totalPrice = Number(paymentReserva.valor_total || paymentReserva.price || 0);
            const newStatus = (currentTotalPaid >= totalPrice && totalPrice > 0) ? ReservationStatus.CONFIRMED : paymentReserva.status;

            await reservationsService.update(paymentReserva.id, {
                status: newStatus,
                forma_pagamento: paymentMethod,
                valor_pago: currentTotalPaid,
                amount_paid: currentTotalPaid
            });

            setPaymentReserva(null);
            fetchReservas();
        } catch (error) {
            console.error('Erro ao registrar pagamento:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleTransferClick = (id: string) => {
        // Transfer logic
    };

    const handleStatusChange = async (reserva: IReserva, newStatus: string) => {
        try {
            setActionLoading(true);
            await reservationsService.update(reserva.id, { status: newStatus });
            fetchReservas();
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const toggleStatus = (status: string) => {
        setFiltroStatus(prev =>
            prev.includes(status)
                ? prev.filter(s => s !== status)
                : [...prev, status]
        );
    };

    const statusOptions = [
        { value: ReservationStatus.PENDING, label: ReservationStatusLabel[ReservationStatus.PENDING] },
        { value: ReservationStatus.CONFIRMED, label: ReservationStatusLabel[ReservationStatus.CONFIRMED] },
        { value: ReservationStatus.CHECKED_IN, label: ReservationStatusLabel[ReservationStatus.CHECKED_IN] },
        { value: ReservationStatus.USED, label: ReservationStatusLabel[ReservationStatus.USED] },
        { value: ReservationStatus.NO_SHOW, label: ReservationStatusLabel[ReservationStatus.NO_SHOW] },
        { value: ReservationStatus.CANCELLED, label: ReservationStatusLabel[ReservationStatus.CANCELLED] },
    ];

    const reservasFiltradas = reservas.filter(r => {
        const matchStatus = filtroStatus.length === 0 || filtroStatus.includes(r.status);

        const matchVeiculo = filtroVeiculo === 'TODOS' || (r as any).vehicle_id === filtroVeiculo;
        const matchViagem = filtroViagem === 'TODOS' || (r as any).trip_id === filtroViagem;
        const passengerName = (r as any).passenger_name || '';
        const ticketCode = (r as any).ticket_code || r.codigo || '';

        const matchBusca = busca === '' ||
            ticketCode.toLowerCase().includes(busca.toLowerCase()) ||
            passengerName.toLowerCase().includes(busca.toLowerCase());
        return matchStatus && matchVeiculo && matchViagem && matchBusca;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-12 h-14 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Ticket size={16} className="text-primary animate-pulse" />
                    </div>
                </div>
                <p className="text-muted-foreground font-medium animate-pulse text-sm">Carregando reservas...</p>
            </div>
        );
    }

    return (
        <div key="reservas-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header Module */}
            <PageHeader
                title="Gestão de Reservas"
                subtitle="Acompanhe passagens, pagamentos e embarques em tempo real"
                icon={Ticket}
                rightElement={
                    <Button
                        onClick={() => navigate('/admin/reservas/nova')}
                        className="h-14 px-6 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                    >
                        <Plus size={20} className="mr-2" strokeWidth={3} />
                        NOVA RESERVA
                    </Button>
                }
            />

            {/* Quick Stats Overlay */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <DashboardCard
                    title="Total Reservas"
                    value={reservas.length}
                    icon={Inbox}
                    variant="primary"
                />
                <DashboardCard
                    title="Aguardando"
                    value={reservas.filter(r => r.status === ReservationStatus.PENDING).length}
                    icon={Clock}
                    variant="amber"
                />
                <DashboardCard
                    title="Confirmadas"
                    value={reservas.filter(r => r.status === ReservationStatus.CONFIRMED).length}
                    icon={ShieldCheck}
                    variant="emerald"
                />
                <DashboardCard
                    title="Valor Total"
                    value={`R$ ${reservas.reduce((acc, r) => acc + (Number(r.valor_total || r.price || 0)), 0).toLocaleString()}`}
                    icon={Wallet}
                    variant="blue"
                />
            </div>

            {/* Filters Section */}
            <ListFilterSection className="lg:grid-cols-4">
                {/* Busca */}
                <div className="space-y-1.5 flex flex-col">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80 ml-1">Buscar Reserva</label>
                    <div className="relative group flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors" size={18} />
                        <Input
                            placeholder="Código ou passageiro..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="h-14 pl-12 pr-4 bg-muted/40 border-input rounded-xl focus-visible:ring-primary/20 font-bold"
                        />
                    </div>
                </div>

                {/* Veículo */}
                <div className="space-y-1.5 flex flex-col">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80 ml-1">Veículo</label>
                    <Select value={filtroVeiculo} onValueChange={(v) => setFiltroVeiculo(v)}>
                        <SelectTrigger className="h-14 w-full bg-muted/40 border-input rounded-xl font-bold shadow-none focus:ring-primary/20">
                            <div className="flex items-center">
                                <Bus size={16} className="mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Todos" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl">
                            <SelectItem value="TODOS" className="rounded-xl font-bold">Todos os Veículos</SelectItem>
                            {veiculos.map(v => (
                                <SelectItem key={v.id} value={v.id} className="rounded-xl font-bold">
                                    {v.modelo} - {v.placa}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Viagem */}
                <div className="space-y-1.5 flex flex-col">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80 ml-1">Viagem / Rota</label>
                    <Select value={filtroViagem} onValueChange={(v) => setFiltroViagem(v)}>
                        <SelectTrigger className="h-14 w-full bg-muted/40 border-input rounded-xl font-bold shadow-none focus:ring-primary/20">
                            <div className="flex items-center">
                                <Calendar size={16} className="mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Todas" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl max-h-[300px]">
                            <SelectItem value="TODOS" className="rounded-xl font-bold">Todas as Viagens</SelectItem>
                            {viagens.map(v => (
                                <SelectItem key={v.id} value={v.id} className="rounded-xl font-bold">
                                    {formatDate(v.departure_date)} - {v.title || v.route_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Status */}
                <div className="space-y-1.5 flex flex-col">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80 ml-1">Status da Reserva</label>
                    <Popover open={isStatusDropdownOpen} onOpenChange={setIsStatusDropdownOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="h-14 w-full bg-muted/40 border-input rounded-xl font-bold justify-between hover:bg-muted/60"
                            >
                                <div className="flex items-center gap-2">
                                    <Filter size={16} strokeWidth={2.5} />
                                    <span className="truncate">
                                        {filtroStatus.length === 0
                                            ? 'Todos Status'
                                            : `${filtroStatus.length} selecionado(s)`}
                                    </span>
                                </div>
                                <ChevronDown size={16} className={cn("transition-transform", isStatusDropdownOpen && "rotate-180")} />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[240px] p-3 rounded-xl border-none shadow-2xl bg-card/95 backdrop-blur-md" align="end">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">Selecionar Status</span>
                                    {filtroStatus.length > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setFiltroStatus([])}
                                            className="h-6 px-2 text-xs font-bold"
                                        >
                                            Limpar
                                        </Button>
                                    )}
                                </div>
                                {statusOptions.map((option) => (
                                    <div
                                        key={option.value}
                                        className="flex items-center space-x-3 px-2 py-2 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors"
                                        onClick={() => toggleStatus(option.value)}
                                    >
                                        <div className={cn(
                                            "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                                            filtroStatus.includes(option.value)
                                                ? "bg-primary border-primary"
                                                : "border-muted-foreground/30"
                                        )}>
                                            {filtroStatus.includes(option.value) && <Check size={10} className="text-white" strokeWidth={4} />}
                                        </div>
                                        <span className={cn(
                                            "text-xs font-bold transition-colors",
                                            filtroStatus.includes(option.value) ? "text-foreground" : "text-muted-foreground"
                                        )}>
                                            {option.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </ListFilterSection>


            {/* Table Module */}
            {/* Reservations Table Container */}
            <Card className="shadow-2xl shadow-muted/20 overflow-hidden rounded-3xl bg-card/50 backdrop-blur-sm">
                <div className="p-8 border-b border-border/50 flex justify-between items-center bg-muted/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Ticket className="w-5 h-5 text-primary" strokeWidth={2.5} />
                        </div>
                        <h2 className="text-xl font-semibold tracking-tight">Registro de Passageiros</h2>
                    </div>
                </div>

                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="pl-8 h-14 text-[12px] font-semibold uppercase tracking-widest">Código / Passageiro</TableHead>
                            <TableHead className="h-14 text-[12px] font-semibold uppercase tracking-widest">Viagem / Veículo</TableHead>
                            <TableHead className="h-14 text-[12px] font-semibold uppercase tracking-widest text-center">Status</TableHead>
                            <TableHead className="h-14 text-[12px] font-semibold uppercase tracking-widest">Investimento</TableHead>
                            <TableHead className="pr-8 h-14 text-[12px] font-semibold uppercase tracking-widest text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center gap-3 animate-pulse">
                                        <div className="w-12 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                        </div>
                                        <p className="font-semibold text-sm tracking-widest text-muted-foreground uppercase">Carregando registro...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : reservasFiltradas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Inbox className="w-12 h-14 text-muted-foreground/30" />
                                        <p className="font-bold text-sm text-muted-foreground">Nenhuma reserva encontrada</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            reservasFiltradas.map((reserva) => {
                                const ticketCode = (reserva as any).ticket_code || reserva.codigo || 'S/N';
                                const passengerName = (reserva as any).passenger_name || 'Passageiro não identificado';
                                const tripName = (reserva as any).trip_name || 'Viagem não identificada';
                                const vehicleName = (reserva as any).vehicle_name || 'Veículo não atribuído';
                                const valorTotal = Number(reserva.valor_total || reserva.price || 0);
                                const valorPago = Number((reserva as any).amount_paid || (reserva as any).valor_pago || 0);
                                const pendente = Math.max(0, valorTotal - valorPago);

                                return (
                                    <TableRow key={reserva.id} className="group hover:bg-muted/20 border-border/30 transition-colors">
                                        <TableCell className="pl-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary transition-transform group-hover:scale-110">
                                                    <User size={20} strokeWidth={2.5} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm tracking-tight text-foreground">{passengerName}</span>
                                                    <span className="text-[12px] font-bold text-muted-foreground/60 tracking-wider">
                                                        #{ticketCode}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
                                                    <Bus size={14} className="text-primary" />
                                                    {vehicleName}
                                                </div>
                                                <span className="text-[12px] font-medium text-muted-foreground">
                                                    {tripName}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <StatusBadge status={reserva.status} />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-foreground">
                                                    R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                                {pendente > 0 ? (
                                                    <div className="flex items-center gap-1 text-[9px] font-semibold text-amber-600 uppercase tracking-widest mt-1">
                                                        <Clock size={10} /> Faltam {pendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-[9px] font-semibold text-emerald-600 uppercase tracking-widest mt-1">
                                                        <CheckCircle size={10} /> Quitado
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="pr-8 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors">
                                                        <MoreHorizontal className="h-5 w-5" strokeWidth={2.5} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-2xl border-none bg-card/95 backdrop-blur-md">
                                                    <DropdownMenuLabel className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground px-3 py-2">Operações</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleEditClick(reserva)} className="rounded-xl px-3 py-2.5 font-bold focus:bg-primary focus:text-primary-foreground gap-3 transition-all">
                                                        <Edit className="h-4 w-4" />
                                                        Editar Cadastro
                                                    </DropdownMenuItem>

                                                    {pendente > 0 && (
                                                        <DropdownMenuItem onClick={() => handlePaymentClick(reserva)} className="rounded-xl px-3 py-2.5 font-bold text-emerald-600 focus:bg-emerald-500 focus:text-white gap-3 transition-all">
                                                            <DollarSign className="h-4 w-4" />
                                                            Baixar Pagamento
                                                        </DropdownMenuItem>
                                                    )}

                                                    <DropdownMenuSeparator className="bg-border/50 my-2" />

                                                    <DropdownMenuLabel className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground px-3 py-2">Fluxo Operacional</DropdownMenuLabel>
                                                    {[ReservationStatus.CHECKED_IN, ReservationStatus.USED].map(st => (
                                                        <DropdownMenuItem key={st} onClick={() => handleStatusChange(reserva, st)} className="rounded-xl px-3 py-2.5 font-bold gap-3 transition-all">
                                                            <div className={cn("w-1.5 h-1.5 rounded-full",
                                                                st === ReservationStatus.CHECKED_IN ? 'bg-indigo-500' : 'bg-emerald-500'
                                                            )} />
                                                            {ReservationStatusLabel[st]}
                                                        </DropdownMenuItem>
                                                    ))}

                                                    <DropdownMenuSeparator className="bg-border/50 my-2" />

                                                    {reserva.status !== ReservationStatus.CANCELLED && (
                                                        <DropdownMenuItem onClick={() => handleCancelClick(reserva)} className="rounded-xl px-3 py-2.5 font-bold text-destructive focus:bg-destructive focus:text-destructive-foreground gap-3 transition-all">
                                                            <XCircle className="h-4 w-4" />
                                                            Cancelar Reserva
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Edit Modal */}
            <Dialog open={!!editingReserva} onOpenChange={(open) => !open && setEditingReserva(null)}>
                <DialogContent className="sm:max-w-[600px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-8 bg-primary/5 border-b border-primary/10">
                        <DialogTitle className="text-2xl font-semibold flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <Edit size={22} className="text-primary" />
                            </div>
                            Editar Reserva
                        </DialogTitle>
                        <DialogDescription className="font-medium">
                            Ajuste os dados do passageiro e pontos de embarque/desembarque.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Nome Completo</Label>
                                <Input
                                    value={editForm.passenger_name}
                                    onChange={e => setEditForm({ ...editForm, passenger_name: e.target.value })}
                                    className="h-14 bg-muted/40 border-none rounded-xl font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Documento / CPF</Label>
                                <Input
                                    value={editForm.passenger_document}
                                    onChange={e => setEditForm({ ...editForm, passenger_document: e.target.value })}
                                    className="h-14 bg-muted/40 border-none rounded-xl font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">E-mail</Label>
                                <Input
                                    value={editForm.passenger_email}
                                    onChange={e => setEditForm({ ...editForm, passenger_email: e.target.value })}
                                    className="h-14 bg-muted/40 border-none rounded-xl font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Telefone</Label>
                                <Input
                                    value={editForm.passenger_phone}
                                    onChange={e => setEditForm({ ...editForm, passenger_phone: e.target.value })}
                                    className="h-14 bg-muted/40 border-none rounded-xl font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-border/50">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Ponto de Embarque</Label>
                                    {(() => {
                                        const linkedViagem = viagens.find(v => v.id === (editingReserva?.viagem_id || (editingReserva as any)?.trip_id));
                                        const stops = Array.isArray(linkedViagem?.route_stops) ? linkedViagem?.route_stops : [];
                                        const boardingOptions = stops.filter((s: any) => s.permite_embarque || s.tipo === 'ORIGEM');

                                        if (boardingOptions.length > 0) {
                                            return (
                                                <Select
                                                    value={editForm.boarding_point}
                                                    onValueChange={v => setEditForm({ ...editForm, boarding_point: v })}
                                                >
                                                    <SelectTrigger className="h-14 bg-muted/40 border-none rounded-xl font-bold">
                                                        <SelectValue placeholder="Selecione o ponto" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-none shadow-2xl">
                                                        {boardingOptions.map((s: any, idx: number) => (
                                                            <SelectItem key={idx} value={s.nome} className="rounded-xl font-bold">
                                                                {s.nome}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            );
                                        }
                                        return (
                                            <Input
                                                value={editForm.boarding_point}
                                                onChange={e => setEditForm({ ...editForm, boarding_point: e.target.value })}
                                                className="h-14 bg-muted/40 border-none rounded-2xl font-bold"
                                                placeholder="Digite o ponto..."
                                            />
                                        );
                                    })()}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Ponto de Desembarque</Label>
                                    {(() => {
                                        const linkedViagem = viagens.find(v => v.id === (editingReserva?.viagem_id || (editingReserva as any)?.trip_id));
                                        const stops = Array.isArray(linkedViagem?.route_stops) ? linkedViagem?.route_stops : [];
                                        const dropoffOptions = stops.filter((s: any) => s.permite_desembarque || s.tipo === 'DESTINO');

                                        if (dropoffOptions.length > 0) {
                                            return (
                                                <Select
                                                    value={editForm.dropoff_point}
                                                    onValueChange={v => setEditForm({ ...editForm, dropoff_point: v })}
                                                >
                                                    <SelectTrigger className="h-14 bg-muted/40 border-none rounded-xl font-bold">
                                                        <SelectValue placeholder="Selecione o ponto" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-none shadow-2xl">
                                                        {dropoffOptions.map((s: any, idx: number) => (
                                                            <SelectItem key={idx} value={s.nome} className="rounded-xl font-bold">
                                                                {s.nome}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            );
                                        }
                                        return (
                                            <Input
                                                value={editForm.dropoff_point}
                                                onChange={e => setEditForm({ ...editForm, dropoff_point: e.target.value })}
                                                className="h-14 bg-muted/40 border-none rounded-2xl font-bold"
                                                placeholder="Digite o ponto..."
                                            />
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-8 bg-muted/30 border-t border-border/50">
                        <Button variant="ghost" onClick={() => setEditingReserva(null)} className="rounded-xl font-bold">Cancelar</Button>
                        <Button
                            onClick={handleSaveEdit}
                            disabled={actionLoading}
                            className="rounded-xl font-semibold px-8 bg-primary shadow-lg shadow-primary/20 gap-2"
                        >
                            {actionLoading ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                            Salvar Alterações
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Modal */}
            <Dialog open={!!cancelingReserva} onOpenChange={(open) => !open && setCancelingReserva(null)}>
                <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-8 bg-destructive/5 border-b border-destructive/10 text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle size={32} className="text-destructive" />
                        </div>
                        <DialogTitle className="text-2xl font-semibold text-destructive">Cancelar Reserva?</DialogTitle>
                        <DialogDescription className="font-bold text-destructive/60 mt-1">
                            Esta ação é irreversível e afetará a disponibilidade de assentos.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Motivo do Cancelamento</Label>
                            <Textarea
                                value={cancelReason}
                                onChange={e => setCancelReason(e.target.value)}
                                placeholder="Descreva brevemente o motivo..."
                                className="min-h-[100px] bg-muted/40 border-none rounded-2xl font-semibold resize-none focus-visible:ring-destructive/20"
                            />
                        </div>

                        {cancelingReserva && Number(cancelingReserva.amount_paid || cancelingReserva.valor_pago || 0) > 0 && (
                            <div className="bg-muted/30 rounded-[1.5rem] p-6 border border-border/50 space-y-4 shadow-inner">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Valor Pago</span>
                                    <span className="font-semibold text-lg">R$ {Number(cancelingReserva.amount_paid || cancelingReserva.valor_pago || 0).toFixed(2)}</span>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { id: 'NONE', label: 'Reter Valor (Multa)', icon: ShieldCheck, color: 'text-slate-500' },
                                        { id: 'REFUND', label: 'Reembolsar Dinheiro', icon: Banknote, color: 'text-emerald-500' },
                                        { id: 'CREDIT', label: 'Gerar Crédito Cliente', icon: CreditCard, color: 'text-blue-500' },
                                    ].map((opt) => (
                                        <label key={opt.id} className={cn(
                                            "flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer group",
                                            refundAction === opt.id ? "border-primary bg-primary/5" : "border-transparent bg-background/50 hover:border-muted-foreground/20"
                                        )}>
                                            <div className="flex items-center gap-3">
                                                <div className={cn("p-1.5 rounded-lg bg-background shadow-sm", opt.color)}>
                                                    <opt.icon size={14} strokeWidth={3} />
                                                </div>
                                                <span className="text-xs font-bold">{opt.label}</span>
                                            </div>
                                            <input
                                                type="radio"
                                                name="refund"
                                                checked={refundAction === opt.id}
                                                onChange={() => setRefundAction(opt.id as any)}
                                                className="w-4 h-4 accent-primary"
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="p-8 bg-muted/30 border-t border-border/50">
                        <Button variant="ghost" onClick={() => setCancelingReserva(null)} className="rounded-xl font-bold">Voltar</Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmCancel}
                            disabled={actionLoading}
                            className="rounded-xl font-semibold px-8 shadow-lg shadow-destructive/20 gap-2"
                        >
                            {actionLoading ? <Loader size={18} className="animate-spin" /> : <XCircle size={18} />}
                            Confirmar Cancelamento
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Payment Modal */}
            <Dialog open={!!paymentReserva} onOpenChange={(open) => !open && setPaymentReserva(null)}>
                <DialogContent className="sm:max-w-[450px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                    <div className="p-8 bg-emerald-500 flex flex-col items-center text-white relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <DollarSign size={120} />
                        </div>
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 shadow-xl border border-white/30">
                            <DollarSign size={32} strokeWidth={3} />
                        </div>
                        <h3 className="text-2xl font-semibold tracking-tight">Receber Pagamento</h3>
                        <p className="font-bold opacity-80 mt-1">Registro financeiro de caixa</p>
                    </div>

                    <div className="p-8 space-y-6">
                        {paymentReserva && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-muted/30 rounded-2xl border border-border/40 text-center">
                                    <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground/60">Total Reserva</p>
                                    <p className="font-semibold text-lg">R$ {Number(paymentReserva.valor_total || paymentReserva.price || 0).toFixed(2)}</p>
                                </div>
                                <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 text-center">
                                    <p className="text-[12px] font-semibold uppercase tracking-widest text-emerald-600/60">Pendente</p>
                                    <p className="font-semibold text-lg text-emerald-600">
                                        R$ {(Number(paymentReserva.valor_total || paymentReserva.price || 0) - Number(paymentReserva.amount_paid || paymentReserva.valor_pago || 0)).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Método de Pagamento</Label>
                                <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                                    <SelectTrigger className="h-14 bg-muted/40 border-none rounded-2xl font-bold">
                                        <CreditCard size={16} className="mr-2 text-muted-foreground" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-none shadow-2xl">
                                        <SelectItem value={FormaPagamento.PIX} className="rounded-xl font-bold">PIX</SelectItem>
                                        <SelectItem value={FormaPagamento.CASH} className="rounded-xl font-bold">Dinheiro / Espécie</SelectItem>
                                        <SelectItem value={FormaPagamento.CREDIT_CARD} className="rounded-xl font-bold">Cartão de Crédito</SelectItem>
                                        <SelectItem value={FormaPagamento.DEBIT_CARD} className="rounded-xl font-bold">Cartão de Débito</SelectItem>
                                        <SelectItem value={FormaPagamento.BOLETO} className="rounded-xl font-bold">Boleto Bancário</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Valor a Receber</Label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-emerald-600/40">R$</div>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={amountToPay}
                                        onChange={e => setAmountToPay(e.target.value)}
                                        className="h-16 pl-12 pr-4 bg-muted/40 border-none rounded-2xl font-semibold text-2xl text-emerald-600 focus-visible:ring-emerald-500/20"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-8 bg-muted/30 border-t border-border/50">
                        <Button variant="ghost" onClick={() => setPaymentReserva(null)} className="rounded-xl font-bold">Cancelar</Button>
                        <Button
                            onClick={handleConfirmPayment}
                            disabled={actionLoading}
                            className="rounded-xl font-semibold px-8 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 gap-2"
                        >
                            {actionLoading ? <Loader size={18} className="animate-spin" /> : <ShieldCheck size={18} strokeWidth={3} />}
                            Confirmar Recebimento
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
};
