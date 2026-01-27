import React, { useState, useEffect, useMemo } from 'react';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { Link } from 'react-router-dom';
import {
    Bus, MapPin, Calendar, Clock, Users, Search, Filter,
    ChevronRight, Loader, ArrowRight, ChevronDown, Briefcase, AlertTriangle
} from 'lucide-react';
import { tripsService } from '../../services/tripsService';
import { publicService } from '../../services/publicService';
import { IViagem, ITag, TripStatus } from '../../../types';
import { SwissDatePicker } from '../../components/Form/SwissDatePicker';



// Helper to format time
const formatTime = (time: string) => {
    if (!time) return '--';
    return time.substring(0, 5);
};

export const ViagensPublico: React.FC = () => {
    const [viagens, setViagens] = useState<IViagem[]>([]);
    const [allTags, setAllTags] = useState<ITag[]>([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');
    const [filtroData, setFiltroData] = useState('');
    const [filtroOrigem, setFiltroOrigem] = useState('');
    const [filtroDestino, setFiltroDestino] = useState('');
    const [settings, setSettings] = useState<any>(null);
    const { formatDate } = useDateFormatter();

    useEffect(() => {
        fetchViagens();
    }, []);

    const fetchViagens = async () => {
        try {
            setLoading(true);
            const [data, tagsData, settingsData] = await Promise.all([
                publicService.getTrips(),
                publicService.getTags(),
                publicService.getSettings('')
            ]);
            // Filter only active and future trips
            const activeTrips = data.filter((v: IViagem) =>
                v.active !== false &&
                (v.status === TripStatus.SCHEDULED || (v.status as string) === 'AGENDADA' ||
                    (v.status as string) === 'CONFIRMADA' || (v.status as string) === 'CONFIRMED' ||
                    (v.status as string) === 'SCHEDULED')
            );
            setViagens(activeTrips);
            setAllTags(tagsData);
            setSettings(settingsData);
        } catch (error) {
            console.error('Erro ao carregar viagens:', error);
        } finally {
            setLoading(false);
        }
    };

    // Extract unique origin (boarding) and destination cities from active trips
    // Includes intermediate stops where permite_embarque is true
    const { cidadesEmbarque, cidadesDestino } = useMemo(() => {
        const embarques = new Set<string>();
        const destinos = new Set<string>();

        viagens.forEach(v => {
            // Add main origin
            if (v.origin_city) embarques.add(v.origin_city);
            // Add main destination
            if (v.destination_city) destinos.add(v.destination_city);

            // Check route_stops for intermediate boarding points
            if (v.route_stops && Array.isArray(v.route_stops)) {
                v.route_stops.forEach((stop: any) => {
                    // Extract city name from stop.nome (format: "Bairro, Cidade - UF" or just "Cidade")
                    const nome = stop.nome || '';
                    let cidade = nome;

                    // Try to extract city from "Bairro, Cidade - UF" format
                    if (nome.includes(',')) {
                        const parts = nome.split(',');
                        if (parts.length >= 2) {
                            cidade = parts[1].split('-')[0].trim();
                        }
                    } else if (nome.includes('-')) {
                        cidade = nome.split('-')[0].trim();
                    }

                    // Add to boarding cities if permite_embarque
                    if (stop.permite_embarque && cidade) {
                        embarques.add(cidade);
                    }
                    // Add to destination cities if permite_desembarque
                    if (stop.permite_desembarque && cidade) {
                        destinos.add(cidade);
                    }
                });
            }
        });

        return {
            cidadesEmbarque: Array.from(embarques).sort(),
            cidadesDestino: Array.from(destinos).sort()
        };
    }, [viagens]);

    const viagensFiltradas = viagens.filter(v => {
        const matchBusca = busca === '' ||
            (v.route_name || '').toLowerCase().includes(busca.toLowerCase()) ||
            (v.origin_city || '').toLowerCase().includes(busca.toLowerCase()) ||
            (v.destination_city || '').toLowerCase().includes(busca.toLowerCase()) ||
            (v.title || '').toLowerCase().includes(busca.toLowerCase());

        const matchData = !filtroData ||
            (v.departure_date && String(v.departure_date).split('T')[0] === filtroData);

        // Check origin city OR any intermediate stop with permite_embarque
        let matchOrigem = !filtroOrigem || v.origin_city === filtroOrigem;
        if (!matchOrigem && v.route_stops && Array.isArray(v.route_stops)) {
            matchOrigem = v.route_stops.some((stop: any) => {
                if (!stop.permite_embarque) return false;
                const nome = stop.nome || '';
                let cidade = nome;
                if (nome.includes(',')) {
                    const parts = nome.split(',');
                    if (parts.length >= 2) cidade = parts[1].split('-')[0].trim();
                } else if (nome.includes('-')) {
                    cidade = nome.split('-')[0].trim();
                }
                return cidade === filtroOrigem;
            });
        }

        // Check destination city OR any intermediate stop with permite_desembarque
        let matchDestino = !filtroDestino || v.destination_city === filtroDestino;
        if (!matchDestino && v.route_stops && Array.isArray(v.route_stops)) {
            matchDestino = v.route_stops.some((stop: any) => {
                if (!stop.permite_desembarque) return false;
                const nome = stop.nome || '';
                let cidade = nome;
                if (nome.includes(',')) {
                    const parts = nome.split(',');
                    if (parts.length >= 2) cidade = parts[1].split('-')[0].trim();
                } else if (nome.includes('-')) {
                    cidade = nome.split('-')[0].trim();
                }
                return cidade === filtroDestino;
            });
        }

        return matchBusca && matchData && matchOrigem && matchDestino;
    });

    const hasFilters = busca || filtroData || filtroOrigem || filtroDestino;

    const clearFilters = () => {
        setBusca('');
        setFiltroData('');
        setFiltroOrigem('');
        setFiltroDestino('');
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-sm p-6 md:p-12 mb-8 text-white shadow-xl shadow-blue-500/20">
                <div className="max-w-5xl mx-auto">
                    <div className="mb-10 text-center md:text-left">
                        <h1 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">
                            {settings?.portal_hero_title || 'Encontre sua próxima viagem'}
                        </h1>
                        <p className="text-blue-100 text-base md:text-lg max-w-xl">
                            {settings?.portal_hero_subtitle || 'Viagens rodoviárias com conforto, segurança e os melhores preços garantidos para você.'}
                        </p>
                    </div>

                    {/* Search Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Origem */}
                        <div className="relative">
                            <MapPin size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500" />
                            <select
                                value={filtroOrigem}
                                onChange={(e) => setFiltroOrigem(e.target.value)}
                                className="w-full pl-10 pr-8 py-4 rounded-sm bg-white/95   text-slate-800 focus:ring-4 focus:ring-white/20 outline-none text-sm appearance-none cursor-pointer shadow-sm border border-white/20 transition-all hover:bg-white"
                            >
                                <option value="">Origem (embarque)</option>
                                {cidadesEmbarque.map(cidade => (
                                    <option key={cidade} value={cidade}>{cidade}</option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>

                        {/* Destino */}
                        <div className="relative">
                            <MapPin size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500" />
                            <select
                                value={filtroDestino}
                                onChange={(e) => setFiltroDestino(e.target.value)}
                                className="w-full pl-10 pr-8 py-4 rounded-sm bg-white/95   text-slate-800 focus:ring-4 focus:ring-white/20 outline-none text-sm appearance-none cursor-pointer shadow-sm border border-white/20 transition-all hover:bg-white"
                            >
                                <option value="">Destino</option>
                                {cidadesDestino.map(cidade => (
                                    <option key={cidade} value={cidade}>{cidade}</option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>

                        {/* Data */}
                        <div className="relative">
                            <SwissDatePicker
                                value={filtroData}
                                onChange={setFiltroData}
                                placeholder="Data"
                                showIcon={true}
                                className="!pl-10 !py-4 !rounded-sm !bg-white/95 !  !text-slate-800 !shadow-sm !border-white/20 !h-auto focus:ring-4 focus:ring-white/20"
                                containerClassName="h-full"
                            />
                        </div>

                        {/* Busca texto */}
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                className="w-full pl-10 pr-4 py-4 rounded-sm bg-white/95   text-slate-800 placeholder-slate-400 focus:ring-4 focus:ring-white/20 outline-none text-sm shadow-sm border border-white/20 transition-all hover:bg-white"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                    {loading ? 'Carregando...' : `${viagensFiltradas.length} viagens disponíveis`}
                </h2>
                {hasFilters && (
                    <button
                        onClick={clearFilters}
                        className="text-sm text-blue-600 hover:text-blue-500 flex items-center gap-1"
                    >
                        <Filter size={14} />
                        Limpar filtros
                    </button>
                )}
            </div>

            {/* Active Filters */}
            {hasFilters && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {filtroOrigem && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
                            <MapPin size={12} />
                            Origem: {filtroOrigem}
                        </span>
                    )}
                    {filtroDestino && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm">
                            <MapPin size={12} />
                            Destino: {filtroDestino}
                        </span>
                    )}
                    {filtroData && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                            <Calendar size={12} />
                            {formatDate(filtroData + 'T00:00:00')}
                        </span>
                    )}
                    {busca && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-sm">
                            <Search size={12} />
                            "{busca}"
                        </span>
                    )}
                </div>
            )}

            {/* Trip Cards */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader className="animate-spin text-blue-600" size={32} />
                </div>
            ) : viagensFiltradas.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-sm p-12 text-center border border-slate-200 dark:border-slate-700">
                    <Bus size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Nenhuma viagem encontrada
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400">
                        Tente ajustar os filtros de busca ou verifique novamente mais tarde.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {viagensFiltradas.map((viagem) => (
                        <Link
                            key={viagem.id}
                            to={`/viagens/${viagem.id}`}
                            className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 p-4 md:p-6 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
                        >
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                {/* Cover Image */}
                                <div className="flex-shrink-0">
                                    {viagem.cover_image ? (
                                        <img
                                            src={viagem.cover_image}
                                            alt={viagem.title || 'Viagem'}
                                            className="w-full md:w-32 h-24 object-cover rounded-sm"
                                        />
                                    ) : (
                                        <div className="w-full md:w-32 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-sm flex items-center justify-center">
                                            <Bus size={32} className="text-white opacity-50" />
                                        </div>
                                    )}
                                </div>

                                {/* Route Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        {viagem.tags && viagem.tags.length > 0 ? (
                                            viagem.tags.map(tagName => {
                                                const tagDef = allTags.find(t => t.nome === tagName);
                                                const bgColor = tagDef?.cor || '#3b82f6'; // default blue-500
                                                return (
                                                    <span
                                                        key={tagName}
                                                        className="text-xs font-semibold px-2 py-1 rounded text-white"
                                                        style={{ backgroundColor: bgColor }}
                                                    >
                                                        {tagName.replace('_', ' ')}
                                                    </span>
                                                );
                                            })
                                        ) : (
                                            <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                                REGULAR
                                            </span>
                                        )}
                                        {viagem.seats_available && viagem.seats_available <= 5 && (
                                            <span className="text-xs font-semibold px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                                                Últimas vagas!
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                                        {viagem.title || viagem.route_name || 'Viagem'}
                                    </h3>

                                    {/* Route Path */}
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-3">
                                        <div className="flex items-center gap-1">
                                            <MapPin size={14} className="text-green-600" />
                                            <span>
                                                {(() => {
                                                    const stops = viagem.route_stops && Array.isArray(viagem.route_stops) ? viagem.route_stops : [];
                                                    if (stops.length > 0) return stops[0].nome;

                                                    return viagem.origin_neighborhood
                                                        ? `${viagem.origin_neighborhood}, ${viagem.origin_city}/${viagem.origin_state}`
                                                        : viagem.origin_city && viagem.origin_state
                                                            ? `${viagem.origin_city}, ${viagem.origin_state}`
                                                            : (viagem.origin_city || 'Origem');
                                                })()}
                                            </span>
                                        </div>
                                        <ArrowRight size={14} className="text-slate-400" />
                                        <div className="flex items-center gap-1">
                                            <MapPin size={14} className="text-red-600" />
                                            <span>
                                                {(() => {
                                                    const stops = viagem.route_stops && Array.isArray(viagem.route_stops) ? viagem.route_stops : [];
                                                    if (stops.length > 0) return stops[stops.length - 1].nome;

                                                    return viagem.destination_neighborhood
                                                        ? `${viagem.destination_neighborhood}, ${viagem.destination_city}/${viagem.destination_state}`
                                                        : viagem.destination_city && viagem.destination_state
                                                            ? `${viagem.destination_city}, ${viagem.destination_state}`
                                                            : (viagem.destination_city || 'Destino');
                                                })()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Date & Time */}
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            <span>{formatDate(viagem.departure_date)}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock size={14} />
                                            <span>{formatTime(viagem.departure_time)}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Users size={14} />
                                            <span>{viagem.seats_available || 0} vagas</span>
                                        </div>
                                        {viagem.baggage_limit && (
                                            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                                                <Briefcase size={14} />
                                                <span>{viagem.baggage_limit}</span>
                                            </div>
                                        )}
                                        {viagem.alerts && (
                                            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                                                <AlertTriangle size={14} className="shrink-0" />
                                                <span className="truncate max-w-[150px] md:max-w-[200px]">{viagem.alerts}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Price & CTA */}
                                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-700 md:pl-6">
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">A partir de</p>
                                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                            R$ {viagem.price_conventional ? Number(viagem.price_conventional).toFixed(0) : '0'}
                                        </p>
                                    </div>
                                    <div className="px-4 py-2 bg-blue-600 group-hover:bg-blue-500 text-white rounded-sm font-semibold text-sm transition-colors flex items-center gap-1">
                                        Ver Detalhes
                                        <ChevronRight size={16} />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};
