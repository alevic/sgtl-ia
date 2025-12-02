import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IReserva } from '../types';
import { reservationsService } from '../services/reservationsService';
import { Ticket, User, Bus, Calendar, DollarSign, Filter, Plus, Search, Loader } from 'lucide-react';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const configs: any = {
        PENDENTE: { color: 'yellow', label: 'Pendente' },
        PENDING: { color: 'yellow', label: 'Pendente' },
        CONFIRMADA: { color: 'green', label: 'Confirmada' },
        CONFIRMED: { color: 'green', label: 'Confirmada' },
        CANCELADA: { color: 'red', label: 'Cancelada' },
        CANCELLED: { color: 'red', label: 'Cancelada' },
        UTILIZADA: { color: 'blue', label: 'Utilizada' },
        COMPLETED: { color: 'blue', label: 'Utilizada' }
    };

    const config = configs[status] || configs['PENDENTE'];

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${config.color}-100 dark:bg-${config.color}-900/30 text-${config.color}-700 dark:text-${config.color}-300`}>
            {config.label}
        </span>
    );
};

export const Reservas: React.FC = () => {
    const [reservas, setReservas] = useState<IReserva[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
    const [busca, setBusca] = useState('');
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

    useEffect(() => {
        fetchReservas();
    }, []);

    const reservasFiltradas = reservas.filter(r => {
        const matchStatus = filtroStatus === 'TODOS' || r.status === filtroStatus;
        // Backend returns joined fields: passenger_name, route_name, etc.
        // We need to cast or update types, but for now we access them safely.
        const passengerName = (r as any).passenger_name || '';
        const ticketCode = (r as any).ticket_code || r.codigo || '';

        const matchBusca = busca === '' ||
            ticketCode.toLowerCase().includes(busca.toLowerCase()) ||
            passengerName.toLowerCase().includes(busca.toLowerCase());
        return matchStatus && matchBusca;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Reservas</h1>
                    <p className="text-slate-500 dark:text-slate-400">Gestão de reservas de passagens</p>
                </div>
                <Link
                    to="/admin/reservas/nova"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    <Plus size={18} />
                    Nova Reserva
                </Link>
            </div>

            {/* Filtros */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por código ou nome do passageiro..."
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setFiltroStatus('TODOS')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${filtroStatus === 'TODOS' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            <Filter size={16} />
                            Todos
                        </button>
                        <button
                            onClick={() => setFiltroStatus('CONFIRMED')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filtroStatus === 'CONFIRMED' ? 'bg-green-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            Confirmada
                        </button>
                        <button
                            onClick={() => setFiltroStatus('CANCELLED')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filtroStatus === 'CANCELLED' ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            Cancelada
                        </button>
                    </div>
                </div>
            </div>

            {/* Lista de Reservas */}
            <div className="grid gap-4">
                {reservasFiltradas.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                        <Ticket size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">Nenhuma reserva encontrada</p>
                    </div>
                ) : (
                    reservasFiltradas.map((reserva: any) => {
                        return (
                            <div key={reserva.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                            <Ticket size={24} className="text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{reserva.ticket_code || reserva.codigo}</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                Reservado em {new Date(reserva.created_at || reserva.data_reserva).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                    <StatusBadge status={reserva.status} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Passageiro</p>
                                        <div className="flex items-center gap-2">
                                            <User size={16} className="text-blue-600" />
                                            <p className="font-semibold text-slate-800 dark:text-white">{reserva.passenger_name}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Rota</p>
                                        <div className="flex items-center gap-2">
                                            <Bus size={16} className="text-blue-600" />
                                            <p className="font-semibold text-slate-800 dark:text-white">{reserva.route_name}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Assento</p>
                                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{reserva.seat_number || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Valor</p>
                                        <div className="flex items-center gap-2">
                                            <DollarSign size={16} className="text-green-600" />
                                            <p className="font-bold text-green-600 dark:text-green-400">
                                                {reserva.price ? `R$ ${Number(reserva.price).toFixed(2)}` : 'R$ 0.00'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-700 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} className="text-slate-400" />
                                        <span className="text-slate-600 dark:text-slate-400">
                                            Partida: {reserva.departure_date ? new Date(reserva.departure_date).toLocaleDateString('pt-BR') : '--'} às {reserva.departure_time || '--'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
