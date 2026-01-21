import React, { useState, useEffect, useRef } from 'react';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { Link, useNavigate } from 'react-router-dom';
import { IViagem, ITag, TripStatus, TripStatusLabel } from '../types';
import { tripsService } from '../services/tripsService';
import {
    Bus, Calendar, MapPin, Users, Filter, Plus, Search,
    CheckCircle, Clock, Loader, XCircle, TrendingUp,
    Edit, Trash2, ToggleLeft, ToggleRight, ClipboardList,
    ChevronDown, Check, Ticket
} from 'lucide-react';
import { PassengerListModal } from '../components/PassengerListModal';
import { DatePicker } from '../components/Form/DatePicker';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const configs: any = {
        [TripStatus.SCHEDULED]: { color: 'yellow', icon: Clock, label: TripStatusLabel[TripStatus.SCHEDULED] },
        [TripStatus.BOARDING]: { color: 'blue', icon: Loader, label: TripStatusLabel[TripStatus.BOARDING] },
        [TripStatus.IN_TRANSIT]: { color: 'blue', icon: Loader, label: TripStatusLabel[TripStatus.IN_TRANSIT] },
        [TripStatus.COMPLETED]: { color: 'slate', icon: CheckCircle, label: TripStatusLabel[TripStatus.COMPLETED] },
        [TripStatus.CANCELLED]: { color: 'red', icon: XCircle, label: TripStatusLabel[TripStatus.CANCELLED] },
        [TripStatus.DELAYED]: { color: 'orange', icon: Clock, label: TripStatusLabel[TripStatus.DELAYED] },
        // Legacy fallbacks
        'AGENDADA': { color: 'yellow', icon: Clock, label: TripStatusLabel[TripStatus.SCHEDULED] },
        'CONFIRMED': { color: 'green', icon: CheckCircle, label: TripStatusLabel[TripStatus.SCHEDULED] }, // Maps to scheduled or custom
        'CONFIRMADA': { color: 'green', icon: CheckCircle, label: TripStatusLabel[TripStatus.SCHEDULED] },
        'EM_CURSO': { color: 'blue', icon: Loader, label: TripStatusLabel[TripStatus.IN_TRANSIT] },
        'FINALIZADA': { color: 'slate', icon: CheckCircle, label: TripStatusLabel[TripStatus.COMPLETED] },
        'CANCELADA': { color: 'red', icon: XCircle, label: TripStatusLabel[TripStatus.CANCELLED] }
    };

    const config = configs[status] || configs[TripStatus.SCHEDULED];
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-${config.color}-100 dark:bg-${config.color}-900/30 text-${config.color}-700 dark:text-${config.color}-300`}>
            <Icon size={12} />
            {config.label}
        </span>
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
        if (confirm('Tem certeza que deseja excluir esta viagem?')) {
            try {
                await tripsService.delete(id);
                fetchViagens();
            } catch (error) {
                console.error('Erro ao excluir viagem:', error);
                alert('Erro ao excluir viagem. Pode haver reservas associadas.');
            }
        }
    };

    const handleToggleStatus = async (id: string) => {
        const viagem = viagens.find(v => v.id === id);
        if (!viagem) return;

        try {
            // Optimistic update
            const updatedViagens = viagens.map(v => v.id === id ? { ...v, active: !v.active } : v);
            setViagens(updatedViagens);

            await tripsService.update(id, { active: !viagem.active });
        } catch (error) {
            console.error('Erro ao alterar status da viagem:', error);
            alert('Erro ao alterar status da viagem.');
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
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                        Gerenciamento de Viagens
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Gestão de viagens e rotas
                    </p>
                </div>
                <Link
                    to="/admin/viagens/nova"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    <Plus size={18} />
                    Nova Viagem
                </Link>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total de Viagens</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{totalViagens}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <Bus size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Confirmadas</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{viagensConfirmadas}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                            <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Em Curso</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{viagensEmCurso}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <Loader size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Ocupação Média</p>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">--%</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                            <TrendingUp size={24} className="text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
                <div className="flex flex-wrap gap-4">
                    {/* Busca */}
                    <div className="flex-1 min-w-[250px]">
                        <div className="relative">
                            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                placeholder="Buscar por origem, destino ou rota..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Filtro Data Partida */}
                    <div className="flex items-center gap-2">
                        <DatePicker
                            value={filtroDataPartida}
                            onChange={setFiltroDataPartida}
                            placeholder="Data Partida"
                            showIcon={true}
                            containerClassName="min-w-[150px]"
                        />
                    </div>

                    {/* Filtro Status Operacional */}
                    <div className="flex items-center gap-2 relative" ref={dropdownRef}>
                        <Filter size={18} className="text-slate-500" />
                        <div className="relative">
                            <button
                                type="button"
                                className="flex items-center justify-between w-[200px] px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-left text-sm"
                                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                            >
                                <span className="truncate">
                                    {filtroStatus.length === 0
                                        ? 'Todos os status'
                                        : `${filtroStatus.length} selecionado(s)`}
                                </span>
                                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isStatusDropdownOpen && (
                                <div className="absolute top-full left-0 mt-1 w-[200px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                                    <div className="p-2 space-y-1">
                                        <button
                                            onClick={() => {
                                                setFiltroStatus([]);
                                                setIsStatusDropdownOpen(false);
                                            }}
                                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${filtroStatus.length === 0 ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'}`}
                                        >
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${filtroStatus.length === 0 ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-600'}`}>
                                                {filtroStatus.length === 0 && <Check size={12} className="text-white" />}
                                            </div>
                                            Todos os status
                                        </button>
                                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                                        {statusOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => toggleStatus(option.value)}
                                                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${filtroStatus.includes(option.value) ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'}`}
                                            >
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${filtroStatus.includes(option.value) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-600'}`}>
                                                    {filtroStatus.includes(option.value) && <Check size={12} className="text-white" />}
                                                </div>
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Filtro Ativa/Inativa */}
                    <div className="flex items-center gap-2">
                        <select
                            value={filtroAtiva}
                            onChange={(e) => setFiltroAtiva(e.target.value as any)}
                            className="px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="TODOS">Todas (Ativas/Inativas)</option>
                            <option value="ATIVA">Ativas</option>
                            <option value="INATIVA">Inativas</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Lista de Viagens */}
            {viagensFiltradas.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-12 text-center">
                    <Bus size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Nenhuma viagem encontrada
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">
                        {busca || filtroStatus !== 'TODOS' || filtroAtiva !== 'TODOS'
                            ? 'Tente ajustar os filtros de busca'
                            : 'Crie sua primeira viagem para começar'}
                    </p>
                    {!busca && filtroStatus === 'TODOS' && filtroAtiva === 'TODOS' && (
                        <Link
                            to="/admin/viagens/nova"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Criar Primeira Viagem
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid gap-6">
                    {viagensFiltradas.map((viagem) => (
                        <div
                            key={viagem.id}
                            className={`bg-white dark:bg-slate-800 rounded-xl border ${viagem.active === false ? 'border-slate-200 dark:border-slate-700 opacity-75' : 'border-slate-200 dark:border-slate-700'} shadow-sm overflow-hidden hover:shadow-md transition-all`}
                        >
                            {/* Card Header */}
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        {/* Header: Título, Tipo e Status */}
                                        <div className="flex flex-wrap items-center gap-3 mb-4">
                                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                                {viagem.title || 'Viagem sem título'}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                {viagem.tags && viagem.tags.map(tagName => {
                                                    const tagDef = allTags.find(t => t.nome === tagName);
                                                    const bgColor = tagDef?.cor || '#3b82f6'; // default blue-500
                                                    return (
                                                        <span
                                                            key={tagName}
                                                            className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white uppercase tracking-wide"
                                                            style={{ backgroundColor: bgColor }}
                                                        >
                                                            {tagName.replace('_', ' ')}
                                                        </span>
                                                    );
                                                })}
                                                <StatusBadge status={viagem.status} />
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${viagem.active !== false
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                                    }`}>
                                                    {viagem.active !== false ? 'ATIVA' : 'INATIVA'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Linha 1: Origem + Data/Hora Partida */}
                                        <div className="flex items-center gap-3 mb-2 text-sm">
                                            <div className="flex items-center gap-2 min-w-[200px]">
                                                <MapPin size={16} className="text-green-600 shrink-0" />
                                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                                    {viagem.route_name || 'Rota de Ida não definida'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    <span>{formatDate(viagem.departure_date)}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock size={14} />
                                                    <span>{viagem.departure_time?.substring(0, 5)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Linha 2: Destino + Data/Hora Chegada */}
                                        <div className="flex items-center gap-3 mb-4 text-sm">
                                            <div className="flex items-center gap-2 min-w-[200px]">
                                                <MapPin size={16} className="text-red-600 shrink-0" />
                                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                                    {viagem.return_route_name || viagem.destination_city || 'Rota de Volta não definida'}
                                                </span>
                                            </div>
                                            {(viagem.arrival_date || viagem.arrival_time) ? (
                                                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                                                    {viagem.arrival_date && (
                                                        <div className="flex items-center gap-1">
                                                            <Calendar size={14} />
                                                            <span>{formatDate(viagem.arrival_date)}</span>
                                                        </div>
                                                    )}
                                                    {viagem.arrival_time && (
                                                        <div className="flex items-center gap-1">
                                                            <Clock size={14} />
                                                            <span>{viagem.arrival_time?.substring(0, 5)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">Previsão não disponível</span>
                                            )}
                                        </div>

                                        {/* Informações Adicionais (Rotas e Veículo) */}
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700/50 pt-3">
                                            {viagem.rota_ida && (
                                                <span className="text-xs bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded border border-slate-100 dark:border-slate-700">
                                                    Rota Ida: <strong>{viagem.rota_ida.nome}</strong>
                                                </span>
                                            )}
                                            {viagem.rota_volta && (
                                                <span className="text-xs bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded border border-slate-100 dark:border-slate-700">
                                                    Rota Volta: <strong>{viagem.rota_volta.nome}</strong>
                                                </span>
                                            )}
                                            {viagem.vehicle_plate && (
                                                <div className="flex items-center gap-1">
                                                    <Bus size={14} />
                                                    <span>{viagem.vehicle_plate}</span>
                                                </div>
                                            )}
                                            {viagem.driver_name && (
                                                <div className="flex items-center gap-1">
                                                    <Users size={14} />
                                                    <span>{viagem.driver_name}</span>
                                                </div>
                                            )}
                                            <span className="text-slate-400">|</span>
                                            <span>
                                                {viagem.seats_available} assentos livres
                                            </span>
                                        </div>
                                    </div>

                                    {/* Ações */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => navigate(`/admin/reservas?trip_id=${viagem.id}`)}
                                            className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                                            title="Ver Reservas"
                                        >
                                            <Ticket size={18} className="text-orange-600 dark:text-orange-400" />
                                        </button>
                                        <button
                                            onClick={() => handleOpenPassengerList(viagem)}
                                            className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                            title="Lista de Passageiros"
                                        >
                                            <ClipboardList size={18} className="text-blue-600 dark:text-blue-400" />
                                        </button>
                                        <button
                                            onClick={() => navigate(`/admin/viagens/editar/${viagem.id}`)}
                                            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                            title="Editar"
                                        >
                                            <Edit size={18} className="text-slate-600 dark:text-slate-400" />
                                        </button>
                                        <button
                                            onClick={() => handleToggleStatus(viagem.id)}
                                            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                            title={viagem.active !== false ? 'Desativar' : 'Ativar'}
                                        >
                                            {viagem.active !== false ? (
                                                <ToggleRight size={18} className="text-green-600 dark:text-green-400" />
                                            ) : (
                                                <ToggleLeft size={18} className="text-slate-400" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(viagem.id)}
                                            className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 size={18} className="text-red-600 dark:text-red-400" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {selectedTripForPassengers && (
                <PassengerListModal
                    isOpen={isPassengerModalOpen}
                    onClose={() => setIsPassengerModalOpen(false)}
                    tripId={selectedTripForPassengers.id}
                    tripData={selectedTripForPassengers}
                />
            )}
        </div>
    );
};
