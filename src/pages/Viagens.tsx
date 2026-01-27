import React, { useState, useEffect, useRef } from 'react';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { Link, useNavigate } from 'react-router-dom';
import { IViagem, ITag, TripStatus, TripStatusLabel } from '@/types';
import { tripsService } from '../services/tripsService';
import {
    Bus, Calendar, MapPin, Users, Filter, Plus, Search,
    CheckCircle, Clock, Loader, XCircle, TrendingUp, AlertTriangle,
    Edit, Trash2, ToggleLeft, ToggleRight, ClipboardList,
    ChevronDown, Check, Ticket, MoreHorizontal, ArrowRight,
    MapPinned, Gauge, Settings2, CalendarArrowDown, ChevronLeft
} from 'lucide-react';
import { PassengerListModal } from '../components/PassengerListModal';
import { SwissDatePicker } from '../components/Form/SwissDatePicker';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../components/ui/popover";
import { Card, CardContent } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
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
import { PageHeader } from "../components/Layout/PageHeader";
import { DashboardCard } from "../components/Layout/DashboardCard";
import { ListFilterSection } from "../components/Layout/ListFilterSection";
import { cn } from "../lib/utils";

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const configs: any = {
        [TripStatus.SCHEDULED]: { color: 'yellow', icon: Clock, label: TripStatusLabel[TripStatus.SCHEDULED], class: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20' },
        [TripStatus.BOARDING]: { color: 'blue', icon: Loader, label: TripStatusLabel[TripStatus.BOARDING], class: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20' },
        [TripStatus.IN_TRANSIT]: { color: 'blue', icon: Loader, label: TripStatusLabel[TripStatus.IN_TRANSIT], class: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/20' },
        [TripStatus.COMPLETED]: { color: 'slate', icon: CheckCircle, label: TripStatusLabel[TripStatus.COMPLETED], class: 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/20' },
        [TripStatus.CANCELLED]: { color: 'red', icon: XCircle, label: TripStatusLabel[TripStatus.CANCELLED], class: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20' },
        [TripStatus.DELAYED]: { color: 'orange', icon: Clock, label: TripStatusLabel[TripStatus.DELAYED], class: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/20' }
    };

    const config = configs[status] || configs[TripStatus.SCHEDULED];
    const Icon = config.icon;

    return (
        <Badge variant="outline" className={cn("flex items-center gap-1 font-bold px-2 py-0.5 rounded-full", config.class.replace('border-none', '').trim())}>
            <Icon size={12} className={status === TripStatus.BOARDING || status === TripStatus.IN_TRANSIT ? "animate-spin" : ""} />
            {config.label}
        </Badge>
    );
};

export const Viagens: React.FC = () => {
    const [viagens, setViagens] = useState<IViagem[]>([]);
    const [allTags, setAllTags] = useState<ITag[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtroStatus, setFiltroStatus] = useState<string[]>([TripStatus.SCHEDULED, TripStatus.BOARDING, TripStatus.IN_TRANSIT]);
    const [filtroAtiva, setFiltroAtiva] = useState<'TODOS' | 'ATIVA' | 'INATIVA'>('TODOS');
    const [busca, setBusca] = useState('');
    const [filtroDataPartida, setFiltroDataPartida] = useState('');
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [tripToDelete, setTripToDelete] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Passenger Modal State
    const [isPassengerModalOpen, setIsPassengerModalOpen] = useState(false);
    const [selectedTripForPassengers, setSelectedTripForPassengers] = useState<{
        id: string;
        title: string;
        vehicle: string;
        departureDate: string;
        arrivalDate: string;
    } | null>(null);

    const fetchViagens = async () => {
        try {
            setLoading(true);
            const [viagensData, tagsData] = await Promise.all([
                tripsService.getAll(),
                tripsService.getTags()
            ]);
            setViagens(viagensData);
            setAllTags(tagsData);
        } catch (error) {
            console.error('Erro ao carregar viagens:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchViagens();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsStatusDropdownOpen(false);
            }
        };

        if (isStatusDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isStatusDropdownOpen]);

    const handleDelete = async (id: string) => {
        try {
            setError(null);
            await tripsService.delete(id);
            setSuccess('Viagem excluída com sucesso!');
            setTimeout(() => setSuccess(null), 3000);
            fetchViagens();
        } catch (error: any) {
            console.error('Erro ao excluir viagem:', error);
            setError('Erro ao excluir viagem. Pode haver reservas associadas.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setTripToDelete(null);
        }
    };

    const handleToggleStatus = async (id: string) => {
        const viagem = viagens.find(v => v.id === id);
        if (!viagem) return;

        try {
            setError(null);
            // Optimistic update
            const updatedViagens = viagens.map(v => v.id === id ? { ...v, active: !v.active } : v);
            setViagens(updatedViagens);

            await tripsService.update(id, { active: !viagem.active });
            setSuccess(`Viagem ${!viagem.active ? 'ativada' : 'desativada'} com sucesso!`);
            setTimeout(() => setSuccess(null), 3000);
        } catch (error: any) {
            console.error('Erro ao alterar status da viagem:', error);
            setError('Erro ao alterar status da viagem.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            fetchViagens(); // Revert on error
        }
    };

    const handleOpenPassengerList = (viagem: IViagem) => {
        const vehicleInfo = viagem.vehicle_plate
            ? `${viagem.vehicle_plate} - ${viagem.vehicle_model || 'Modelo não inf.'}`
            : 'Veículo não definido';

        setSelectedTripForPassengers({
            id: viagem.id,
            title: viagem.title || viagem.route_name || 'Viagem sem título',
            vehicle: vehicleInfo,
            departureDate: formatDate(viagem.departure_date),
            arrivalDate: viagem.arrival_date ? formatDate(viagem.arrival_date) : 'N/A'
        });
        setIsPassengerModalOpen(true);
    };

    const viagensFiltradas = viagens.filter(v => {
        const matchStatus = filtroStatus.length === 0 || filtroStatus.includes(v.status);
        const matchAtiva = filtroAtiva === 'TODOS' ||
            (filtroAtiva === 'ATIVA' && (v.active !== false)) || // Default to true if undefined
            (filtroAtiva === 'INATIVA' && v.active === false);

        const matchData = !filtroDataPartida || (() => {
            if (!v.departure_date) return false;
            const dateVal = v.departure_date;
            // Handle Date object
            if (dateVal instanceof Date) {
                return dateVal.toISOString().split('T')[0] === filtroDataPartida;
            }
            // Handle string (ISO or YYYY-MM-DD)
            return String(dateVal).split('T')[0] === filtroDataPartida;
        })();

        const matchBusca = busca === '' ||
            (v.route_name || '').toLowerCase().includes(busca.toLowerCase()) ||
            (v.origin_city || '').toLowerCase().includes(busca.toLowerCase()) ||
            (v.destination_city || '').toLowerCase().includes(busca.toLowerCase());
        return matchStatus && matchAtiva && matchBusca && matchData;
    });

    const statusOptions = [
        { value: TripStatus.SCHEDULED, label: TripStatusLabel[TripStatus.SCHEDULED] },
        { value: TripStatus.BOARDING, label: TripStatusLabel[TripStatus.BOARDING] },
        { value: TripStatus.IN_TRANSIT, label: TripStatusLabel[TripStatus.IN_TRANSIT] },
        { value: TripStatus.COMPLETED, label: TripStatusLabel[TripStatus.COMPLETED] },
        { value: TripStatus.DELAYED, label: TripStatusLabel[TripStatus.DELAYED] },
        { value: TripStatus.CANCELLED, label: TripStatusLabel[TripStatus.CANCELLED] },
    ];

    const toggleStatus = (status: string) => {
        setFiltroStatus(prev =>
            prev.includes(status)
                ? prev.filter(s => s !== status)
                : [...prev, status]
        );
    };

    // Estatísticas
    const totalViagens = viagens.length;
    const viagensConfirmadas = viagens.filter(v => v.status === TripStatus.SCHEDULED || v.status === 'CONFIRMADA').length;
    const viagensEmCurso = viagens.filter(v => v.status === TripStatus.IN_TRANSIT || v.status === TripStatus.BOARDING || v.status === 'EM_CURSO').length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    const { formatDate: formatSystemDate } = useDateFormatter();

    const formatDate = (dateValue: string | Date | undefined) => {
        if (!dateValue) return 'Data não definida';

        try {
            let dateStr = '';
            if (dateValue instanceof Date) {
                dateStr = dateValue.toISOString().split('T')[0];
            } else if (typeof dateValue === 'string') {
                // Handle ISO string or YYYY-MM-DD
                if (dateValue.includes('T')) {
                    dateStr = dateValue.split('T')[0];
                } else {
                    dateStr = dateValue;
                }
            }

            if (!dateStr || dateStr.length !== 10) return 'Data Inválida';

            const [year, month, day] = dateStr.split('-').map(Number);
            // Create date at noon to avoid timezone shifts
            const dateObj = new Date(year, month - 1, day, 12);
            return formatSystemDate(dateObj);
        } catch (error) {
            return 'Erro Data';
        }
    };

    return (
        <div key="viagens-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
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
            <PageHeader
                title="Gerenciamento de Viagens"
                subtitle="Monitoramento em tempo real e controle operacional"
                icon={Bus}
                rightElement={
                    <Button asChild className="h-14 px-6 rounded-sm font-semibold gap-2 shadow-lg shadow-primary/20">
                        <Link to="/admin/viagens/nova" className="flex items-center gap-2">
                            <Plus size={20} strokeWidth={2.5} />
                            NOVA VIAGEM
                        </Link>
                    </Button>
                }
            />

            {/* Executive KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-foreground">
                <DashboardCard
                    title="Total de Viagens"
                    value={totalViagens}
                    icon={Bus}
                    variant="primary"
                />
                <DashboardCard
                    title="Confirmadas"
                    value={viagensConfirmadas}
                    icon={CheckCircle}
                    variant="emerald"
                />
                <DashboardCard
                    title="Em Curso"
                    value={viagensEmCurso}
                    icon={Loader}
                    variant="blue"
                />
                <DashboardCard
                    title="Ocupação Média"
                    value="78%"
                    icon={TrendingUp}
                    variant="purple"
                    trend="+5% vs mês anterior"
                />
            </div>

            {/* Executive Filters Module */}
            <ListFilterSection>
                {/* Busca */}
                <div className="space-y-1.5 flex flex-col">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80 ml-1">Buscar Viagem</label>
                    <div className="relative group flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                        <Input
                            placeholder="Origem, destino ou rota..."
                            className="pl-12 h-14 bg-muted border-input rounded-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary/20"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                        />
                    </div>
                </div>

                {/* Data de Partida */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80 ml-1">Data de Partida</label>
                    <SwissDatePicker
                        value={filtroDataPartida}
                        onChange={setFiltroDataPartida}
                        placeholder="Qualquer data"
                        showIcon={true}
                        className="h-14 bg-muted border-input rounded-sm font-bold"
                        containerClassName="w-full"
                    />
                </div>

                {/* Visibilidade */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80 ml-1">Visibilidade</label>
                    <Select value={filtroAtiva} onValueChange={(v) => setFiltroAtiva(v as any)}>
                        <SelectTrigger className="h-14 w-full bg-muted border-input rounded-sm font-bold">
                            <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent className="rounded-sm border-none shadow-2xl bg-card  ">
                            <SelectItem value="TODOS">Todas</SelectItem>
                            <SelectItem value="ATIVA">Somente Ativas</SelectItem>
                            <SelectItem value="INATIVA">Somente Inativas</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Status da Viagem */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80 ml-1">Status da Viagem</label>
                    <Popover open={isStatusDropdownOpen} onOpenChange={setIsStatusDropdownOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="h-14 w-full bg-muted border-input rounded-sm font-bold justify-between hover:bg-muted"
                            >
                                <div className="flex items-center gap-2">
                                    <Filter size={16} strokeWidth={2.5} />
                                    <span className="truncate">
                                        {filtroStatus.length === 0
                                            ? 'Todos os Status'
                                            : `${filtroStatus.length} selecionado(s)`}
                                    </span>
                                </div>
                                <ChevronDown size={16} className={cn("transition-transform", isStatusDropdownOpen && "rotate-180")} />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[240px] p-3 rounded-sm border-none shadow-2xl bg-card  " align="end">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80">Selecionar Status</span>
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
                                        className="flex items-center space-x-3 px-2 py-2 rounded-sm hover:bg-muted cursor-pointer transition-colors"
                                        onClick={() => toggleStatus(option.value)}
                                    >
                                        <div className={cn(
                                            "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                                            filtroStatus.includes(option.value)
                                                ? "bg-primary border-primary"
                                                : "border-muted-foreground/30"
                                        )}>
                                            {filtroStatus.includes(option.value) && (
                                                <Check size={12} className="text-primary-foreground" strokeWidth={3} />
                                            )}
                                        </div>
                                        <span className="text-sm font-semibold flex-1">{option.label}</span>
                                    </div>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </ListFilterSection>

            {/* Executive Table Module */}
            {viagensFiltradas.length === 0 ? (
                <div className="bg-card   rounded-sm border border-dashed border-border p-12 text-center">
                    <Bus size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-bold tracking-tight mb-2">Nenhuma viagem encontrada</h3>
                    <p className="text-muted-foreground font-medium mb-6">Tente ajustar seus filtros para encontrar o que procura.</p>
                </div>
            ) : (
                <Card className="shadow-2xl shadow-muted/20 overflow-hidden rounded-sm bg-card  ">
                    <Table>
                        <TableHeader className="bg-muted">
                            <TableRow className="hover:bg-transparent border-border/50">
                                <TableHead className="pl-8 w-[300px] h-14 text-[12px] font-semibold uppercase tracking-widest">Informações da Viagem</TableHead>
                                <TableHead className="h-14 text-[12px] font-semibold uppercase tracking-widest">Itinerário</TableHead>
                                <TableHead className="h-14 text-[12px] font-semibold uppercase tracking-widest">Veículo / Motorista</TableHead>
                                <TableHead className="h-14 text-[12px] font-semibold uppercase tracking-widest">Assentos</TableHead>
                                <TableHead className="h-14 text-[12px] font-semibold uppercase tracking-widest">Status</TableHead>
                                <TableHead className="pr-8 text-right h-14 text-[12px] font-semibold uppercase tracking-widest">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {viagensFiltradas.map((viagem) => (
                                <TableRow
                                    key={viagem.id}
                                    className={cn(
                                        "group hover:bg-muted border-border/30 transition-colors",
                                        viagem.active === false && "opacity-60 grayscale-[0.5]"
                                    )}
                                >
                                    <TableCell className="pl-8 py-5">
                                        <div className="space-y-2">
                                            <div className="font-semibold text-base group-hover:text-primary transition-colors">
                                                {viagem.title || 'Sem título'}
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {viagem.tags?.map(tagName => {
                                                    const tagDef = allTags.find(t => t.nome === tagName);
                                                    return (
                                                        <Badge
                                                            key={tagName}
                                                            className="text-[12px] uppercase font-semibold px-2 py-0 h-4"
                                                            style={{ backgroundColor: tagDef?.cor || '#3b82f6' }}
                                                        >
                                                            {tagName.replace('_', ' ')}
                                                        </Badge>
                                                    );
                                                })}
                                                {viagem.active === false && (
                                                    <Badge variant="outline" className="text-[12px] uppercase font-semibold px-2 py-0 h-4 text-muted-foreground border-muted-foreground/30">
                                                        Inativa
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 group/route">
                                                <div className="p-1.5 rounded-sm bg-emerald-500/10 text-emerald-600 transition-colors group-hover/route:bg-emerald-500/20"><MapPinned size={14} /></div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Partida</span>
                                                    <span className="text-sm font-semibold">{viagem.route_name || 'N/D'}</span>
                                                    <div className="flex items-center gap-2 text-[12px] font-medium text-muted-foreground mt-0.5">
                                                        <span className="flex items-center gap-0.5"><Calendar size={10} /> {formatDate(viagem.departure_date)}</span>
                                                        <span className="flex items-center gap-0.5"><Clock size={10} /> {viagem.departure_time?.substring(0, 5)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 group/route">
                                                <div className="p-1.5 rounded-sm bg-rose-500/10 text-rose-600 transition-colors group-hover/route:bg-rose-500/20"><MapPinned size={14} /></div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Retorno</span>
                                                    <span className="text-sm font-semibold">{viagem.return_route_name || 'N/D'}</span>
                                                    {viagem.arrival_date && (
                                                        <div className="flex items-center gap-2 text-[12px] font-medium text-muted-foreground mt-0.5">
                                                            <span className="flex items-center gap-0.5"><Calendar size={10} /> {formatDate(viagem.arrival_date)}</span>
                                                            <span className="flex items-center gap-0.5"><Clock size={10} /> {viagem.arrival_time?.substring(0, 5)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-2">
                                            {viagem.vehicle_plate && (
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 rounded-sm bg-blue-500/10 text-blue-600"><Bus size={14} /></div>
                                                    <span className="text-sm font-bold tracking-tight">{viagem.vehicle_plate}</span>
                                                </div>
                                            )}
                                            {viagem.driver_name && (
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 rounded-sm bg-indigo-500/10 text-indigo-600"><Users size={14} /></div>
                                                    <span className="text-sm font-medium">{viagem.driver_name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-sm bg-purple-500/10 text-purple-600"><Gauge size={14} /></div>
                                                <span className="text-sm font-semibold">{viagem.seats_available}</span>
                                                <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">Livres</span>
                                            </div>
                                            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary"
                                                    style={{ width: `${Math.min(100, (1 - (viagem.seats_available || 0) / 46) * 100)}%` }} // Assuming 46 seats
                                                />
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={viagem.status} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 rounded-full text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                                                onClick={() => navigate(`/admin/reservas?trip_id=${viagem.id}`)}
                                                title="Gerenciar Reservas"
                                            >
                                                <Ticket size={18} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 rounded-full text-blue-600 hover:text-blue-700 hover:bg-blue-500/10"
                                                onClick={() => handleOpenPassengerList(viagem)}
                                                title="Lista de Passageiros"
                                            >
                                                <ClipboardList size={18} />
                                            </Button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-sm hover:bg-primary/10 hover:text-primary">
                                                        <MoreHorizontal size={18} strokeWidth={2.5} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 rounded-sm shadow-2xl border-none bg-card   p-2">
                                                    <DropdownMenuLabel className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 py-2">Ações Rápidas</DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        onClick={() => navigate(`/admin/viagens/editar/${viagem.id}`)}
                                                        className="rounded-sm h-10 gap-3 font-bold cursor-pointer focus:bg-primary focus:text-primary-foreground px-3"
                                                    >
                                                        <Edit size={16} strokeWidth={2.5} />
                                                        Editar Viagem
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleToggleStatus(viagem.id)}
                                                        className="rounded-sm h-10 gap-3 font-bold cursor-pointer focus:bg-primary focus:text-primary-foreground px-3"
                                                    >
                                                        {viagem.active !== false ? (
                                                            <>
                                                                <ToggleRight size={16} strokeWidth={2.5} />
                                                                Desativar
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ToggleLeft size={16} strokeWidth={2.5} />
                                                                Ativar
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-border/40 my-1" />
                                                    <DropdownMenuItem
                                                        onClick={() => setTripToDelete(viagem.id)}
                                                        className="rounded-sm h-10 gap-3 font-bold cursor-pointer text-destructive focus:text-destructive-foreground focus:bg-destructive px-3"
                                                    >
                                                        <Trash2 size={16} strokeWidth={2.5} />
                                                        Excluir Definitivamente
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}
            {selectedTripForPassengers && (
                <PassengerListModal
                    isOpen={isPassengerModalOpen}
                    onClose={() => setIsPassengerModalOpen(false)}
                    tripId={selectedTripForPassengers.id}
                    tripData={selectedTripForPassengers}
                />
            )}
            <AlertDialog open={!!tripToDelete} onOpenChange={(open) => !open && setTripToDelete(null)}>
                <AlertDialogContent className="rounded-sm border-none shadow-2xl bg-card  ">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-semibold tracking-tighter">Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription className="font-medium text-muted-foreground">
                            Tem certeza que deseja excluir esta viagem? Esta ação não pode ser desfeita e pode afetar reservas existentes.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel className="rounded-sm font-bold border-none bg-muted hover:bg-muted">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => tripToDelete && handleDelete(tripToDelete)}
                            className="rounded-sm font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            EXCLUIR VIAGEM
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
