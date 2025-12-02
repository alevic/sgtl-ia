import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IViagem } from '../types';
import { tripsService } from '../services/tripsService';
import {
    Bus, Calendar, MapPin, Users, Filter, Plus, Search,
    CheckCircle, Clock, Loader, XCircle, TrendingUp
} from 'lucide-react';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const configs: any = {
        SCHEDULED: { color: 'yellow', icon: Clock, label: 'Agendada' },
        AGENDADA: { color: 'yellow', icon: Clock, label: 'Agendada' },
        CONFIRMED: { color: 'green', icon: CheckCircle, label: 'Confirmada' },
        CONFIRMADA: { color: 'green', icon: CheckCircle, label: 'Confirmada' },
        IN_TRANSIT: { color: 'blue', icon: Loader, label: 'Em Curso' },
        EM_CURSO: { color: 'blue', icon: Loader, label: 'Em Curso' },
        COMPLETED: { color: 'slate', icon: CheckCircle, label: 'Finalizada' },
        FINALIZADA: { color: 'slate', icon: CheckCircle, label: 'Finalizada' },
        CANCELLED: { color: 'red', icon: XCircle, label: 'Cancelada' },
        CANCELADA: { color: 'red', icon: XCircle, label: 'Cancelada' },
        DELAYED: { color: 'orange', icon: Clock, label: 'Atrasada' }
    };

    const config = configs[status] || configs['SCHEDULED'];
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-${config.color}-100 dark:bg-${config.color}-900/30 text-${config.color}-700 dark:text-${config.color}-300`}>
            <Icon size={14} />
            {config.label}
        </span>
    );
};

export const Viagens: React.FC = () => {
    const [viagens, setViagens] = useState<IViagem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
    const [busca, setBusca] = useState('');
    const navigate = useNavigate();

    const fetchViagens = async () => {
        try {
            setLoading(true);
            const data = await tripsService.getAll();
            setViagens(data);
        } catch (error) {
            console.error('Erro ao carregar viagens:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchViagens();
    }, []);

    const viagensFiltradas = viagens.filter(v => {
        const matchStatus = filtroStatus === 'TODOS' || v.status === filtroStatus;
        const matchBusca = busca === '' ||
            (v.route_name || '').toLowerCase().includes(busca.toLowerCase()) ||
            (v.origin_city || '').toLowerCase().includes(busca.toLowerCase()) ||
            (v.destination_city || '').toLowerCase().includes(busca.toLowerCase());
        return matchStatus && matchBusca;
    });

    // Estatísticas
    const totalViagens = viagens.length;
    const viagensConfirmadas = viagens.filter(v => v.status === 'CONFIRMED' || v.status === 'CONFIRMADA').length;
    const viagensEmCurso = viagens.filter(v => v.status === 'IN_TRANSIT' || v.status === 'EM_CURSO').length;

    // Calculate average occupancy if possible (needs capacity)
    const ocupacaoMedia = 0; // Placeholder

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
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Viagens</h1>
                    <p className="text-slate-500 dark:text-slate-400">Gestão de viagens e rotas</p>
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
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por origem, destino ou rota..."
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
                            onClick={() => setFiltroStatus('SCHEDULED')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filtroStatus === 'SCHEDULED' ? 'bg-yellow-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            Agendada
                        </button>
                        <button
                            onClick={() => setFiltroStatus('CONFIRMED')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filtroStatus === 'CONFIRMED' ? 'bg-green-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            Confirmada
                        </button>
                    </div>
                </div>
            </div>

            {/* Lista de Viagens */}
            <div className="grid gap-4">
                {viagensFiltradas.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                        <Bus size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">Nenhuma viagem encontrada</p>
                    </div>
                ) : (
                    viagensFiltradas.map((viagem) => {
                        return (
                            <div
                                key={viagem.id}
                                onClick={() => navigate(`/admin/viagens/${viagem.id}`)}
                                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                                            <Bus size={28} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                {viagem.route_name || 'Rota sem nome'}
                                            </h3>
                                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                <MapPin size={14} className="text-green-600" />
                                                <span>{viagem.origin_city}</span>
                                                <span>→</span>
                                                <MapPin size={14} className="text-red-600" />
                                                <span>{viagem.destination_city}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mt-2">
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    <span>{new Date(viagem.departure_date).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock size={14} />
                                                    <span>{viagem.departure_time}</span>
                                                </div>
                                                {viagem.vehicle_plate && (
                                                    <div className="flex items-center gap-1">
                                                        <Bus size={14} />
                                                        <span>{viagem.vehicle_plate}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <StatusBadge status={viagem.status} />
                                        <span className="text-sm text-slate-500">
                                            {viagem.seats_available} assentos livres
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
