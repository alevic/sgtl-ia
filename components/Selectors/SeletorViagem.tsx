import React, { useState } from 'react';
import { IViagem } from '../../types';
import {
    Calendar, MapPin, Search, Bus, Clock, Check, Users,
    CheckCircle, Loader, XCircle, TrendingUp
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
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-${config.color}-100 dark:bg-${config.color}-900/30 text-${config.color}-700 dark:text-${config.color}-300`}>
            <Icon size={12} />
            {config.label}
        </span>
    );
};

interface SeletorViagemProps {
    viagens: IViagem[];
    viagemSelecionada: IViagem | null;
    onChange: (viagem: IViagem | null) => void;
}

export const SeletorViagem: React.FC<SeletorViagemProps> = ({
    viagens,
    viagemSelecionada,
    onChange
}) => {
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState<'TODOS' | 'AGENDADA' | 'CONFIRMADA'>('TODOS');

    const formatarDataHora = (dateValue: string | Date | undefined) => {
        if (!dateValue) return 'Data não definida';

        try {
            let dateStr = '';
            if (dateValue instanceof Date) {
                dateStr = dateValue.toISOString().split('T')[0];
            } else if (typeof dateValue === 'string') {
                if (dateValue.includes('T')) {
                    dateStr = dateValue.split('T')[0];
                } else {
                    dateStr = dateValue;
                }
            }

            if (!dateStr || dateStr.length !== 10) return 'Data Inválida';

            const [year, month, day] = dateStr.split('-').map(Number);
            return new Date(year, month - 1, day, 12).toLocaleDateString();
        } catch (error) {
            return 'Erro Data';
        }
    };

    const viagensFiltradas = viagens.filter(v => {
        const matchStatus = filtroStatus === 'TODOS' ||
            (filtroStatus === 'AGENDADA' && (v.status === 'AGENDADA' || v.status === 'SCHEDULED')) ||
            (filtroStatus === 'CONFIRMADA' && (v.status === 'CONFIRMADA' || v.status === 'CONFIRMED'));

        const matchBusca = busca === '' ||
            v.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
            v.origem?.toLowerCase().includes(busca.toLowerCase()) ||
            v.destino?.toLowerCase().includes(busca.toLowerCase()) ||
            v.route_name?.toLowerCase().includes(busca.toLowerCase()) ||
            v.origin_city?.toLowerCase().includes(busca.toLowerCase()) ||
            v.destination_city?.toLowerCase().includes(busca.toLowerCase());

        return matchStatus && matchBusca && (
            v.status === 'AGENDADA' || v.status === 'CONFIRMADA' ||
            v.status === 'SCHEDULED' || v.status === 'CONFIRMED'
        );
    });

    return (
        <div className="space-y-4">
            {/* Busca e Filtros */}
            <div className="space-y-3">
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por origem, destino ou título..."
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-sm focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFiltroStatus('TODOS')}
                        className={`px-3 py-1.5 rounded-sm text-sm font-medium transition-colors ${filtroStatus === 'TODOS'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                    >
                        Todas
                    </button>
                    <button
                        onClick={() => setFiltroStatus('AGENDADA')}
                        className={`px-3 py-1.5 rounded-sm text-sm font-medium transition-colors ${filtroStatus === 'AGENDADA'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                    >
                        Agendadas
                    </button>
                    <button
                        onClick={() => setFiltroStatus('CONFIRMADA')}
                        className={`px-3 py-1.5 rounded-sm text-sm font-medium transition-colors ${filtroStatus === 'CONFIRMADA'
                            ? 'bg-green-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                    >
                        Confirmadas
                    </button>
                </div>
            </div>

            {/* Viagem Selecionada */}
            {viagemSelecionada && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 rounded-sm p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">Viagem Selecionada</span>
                        <Check size={20} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h4 className="font-bold text-slate-800 dark:text-white">{viagemSelecionada.title || viagemSelecionada.titulo || 'Viagem sem título'}</h4>
                        <StatusBadge status={viagemSelecionada.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{formatarDataHora(viagemSelecionada.departure_date)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{viagemSelecionada.departure_time?.substring(0, 5)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <MapPin size={14} className="text-green-600" />
                            <span>{viagemSelecionada.route_name || viagemSelecionada.origem}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <MapPin size={14} className="text-red-600" />
                            <span>{viagemSelecionada.return_route_name || viagemSelecionada.destino}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Lista de Viagens */}
            {!viagemSelecionada && (
                <div className="max-h-96 overflow-y-auto space-y-4">
                    {viagensFiltradas.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                            <Bus size={48} className="mx-auto mb-2 opacity-50" />
                            <p>Nenhuma viagem disponível</p>
                        </div>
                    ) : (
                        viagensFiltradas.map((viagem) => (
                            <div
                                key={viagem.id}
                                onClick={() => onChange(viagem)}
                                className={`cursor-pointer bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 
                                shadow-sm hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 transition-all overflow-hidden group`}
                            >
                                <div className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            {/* Header */}
                                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                                <h3 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                    {viagem.title || viagem.titulo || 'Viagem sem título'}
                                                </h3>
                                                {viagem.trip_type && (
                                                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 uppercase">
                                                        {viagem.trip_type.replace('_', ' ')}
                                                    </span>
                                                )}
                                                <StatusBadge status={viagem.status} />
                                            </div>

                                            {/* Origem/Destino */}
                                            <div className="space-y-2 mb-3">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <MapPin size={16} className="text-green-600 shrink-0" />
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                                        {viagem.route_name || viagem.origem || 'Origem não definida'}
                                                    </span>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 ml-auto">
                                                        <Calendar size={12} /> {formatarDataHora(viagem.departure_date)}
                                                        <Clock size={12} /> {viagem.departure_time?.substring(0, 5)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <MapPin size={16} className="text-red-600 shrink-0" />
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                                        {viagem.return_route_name || viagem.destino || 'Destino não definido'}
                                                    </span>
                                                    {(viagem.arrival_date || viagem.arrival_time) && (
                                                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 ml-auto">
                                                            {viagem.arrival_date && <><Calendar size={12} /> {formatarDataHora(viagem.arrival_date)}</>}
                                                            {viagem.arrival_time && <><Clock size={12} /> {viagem.arrival_time?.substring(0, 5)}</>}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Info Extra */}
                                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700/50 pt-2">
                                                {viagem.vehicle_plate && (
                                                    <div className="flex items-center gap-1">
                                                        <Bus size={12} />
                                                        <span>{viagem.vehicle_plate}</span>
                                                    </div>
                                                )}
                                                {viagem.driver_name && (
                                                    <div className="flex items-center gap-1">
                                                        <Users size={12} />
                                                        <span>{viagem.driver_name}</span>
                                                    </div>
                                                )}
                                                <span className="text-slate-300">|</span>
                                                <span className="font-medium text-blue-600 dark:text-blue-400">
                                                    {viagem.seats_available} lugares livres
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

