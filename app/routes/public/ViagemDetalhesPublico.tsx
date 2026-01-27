import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import {
    ArrowLeft, Bus, MapPin, Calendar, Clock, Users,
    DollarSign, Loader, AlertCircle, Check, Briefcase, AlertTriangle,
    ChevronDown, ChevronRight
} from 'lucide-react';
import { tripsService } from '../../services/tripsService';
import { vehiclesService } from '../../services/vehiclesService';
import { reservationsService } from '../../services/reservationsService';
import { MapaAssentosReserva } from '../../components/Veiculos/MapaAssentosReserva';
import { publicService } from '../../services/publicService';
import { IViagem, IVeiculo, TipoAssento, ITag, AssentoStatus } from '../../types';
import { Circle, Star, Armchair, Moon, Bed, Crown, Lock } from 'lucide-react';

const SEAT_ICONS: Record<string, React.ElementType> = {
    'CONVENCIONAL': Circle,
    'EXECUTIVO': Star,
    'SEMI_LEITO': Armchair,
    'LEITO': Moon,
    'CAMA': Bed,
    'CAMA_MASTER': Crown,
    'BLOQUEADO': Lock,
};



// Helper to format time
const formatTime = (time: string) => {
    if (!time) return '--';
    return time.substring(0, 5);
};

// Get price for trip (minimum price)
const getMinPrice = (viagem: IViagem): number => {
    const prices = [
        viagem.price_conventional,
        viagem.price_executive,
        viagem.price_semi_sleeper,
        viagem.price_sleeper,
        viagem.price_bed,
        viagem.price_master_bed
    ].filter(p => p && Number(p) > 0).map(p => Number(p));

    return prices.length > 0 ? Math.min(...prices) : 0;
};

// Build precos map from viagem
const buildPrecosFromViagem = (viagem: IViagem): Record<string, number> => {
    const precos: Record<string, number> = {};
    if (viagem.price_conventional) precos['CONVENCIONAL'] = Number(viagem.price_conventional);
    if (viagem.price_executive) precos['EXECUTIVO'] = Number(viagem.price_executive);
    if (viagem.price_semi_sleeper) precos['SEMI_LEITO'] = Number(viagem.price_semi_sleeper);
    if (viagem.price_sleeper) precos['LEITO'] = Number(viagem.price_sleeper);
    if (viagem.price_bed) precos['CAMA'] = Number(viagem.price_bed);
    if (viagem.price_master_bed) precos['CAMA_MASTER'] = Number(viagem.price_master_bed);
    return precos;
};

export const ViagemDetalhesPublico: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [viagem, setViagem] = useState<IViagem | null>(null);
    const [allTags, setAllTags] = useState<ITag[]>([]);
    const [veiculo, setVeiculo] = useState<IVeiculo | null>(null);
    const [assentosReservados, setAssentosReservados] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [assentosSelecionados, setAssentosSelecionados] = useState<{ numero: string; tipo: TipoAssento; valor: number }[]>([]);
    const [precosAbertos, setPrecosAbertos] = useState(false);
    const [veiculoAberto, setVeiculoAberto] = useState(false);
    const { formatDate, formatDateTime } = useDateFormatter();

    useEffect(() => {
        if (id) {
            fetchViagem();
        }
    }, [id]);

    const fetchViagem = async () => {
        try {
            setLoading(true);
            const [tripData, tagsData] = await Promise.all([
                publicService.getTripById(id!),
                publicService.getTags()
            ]);
            setViagem(tripData);
            setAllTags(tagsData);

            // Fetch vehicle if exists
            if (tripData.vehicle_id) {
                try {
                    const vehicleData = await publicService.getVehicleById(tripData.vehicle_id);

                    // If vehicle doesn't have mapa_assentos, try to fetch seats separately
                    if (!vehicleData.mapa_assentos || vehicleData.mapa_assentos.length === 0) {
                        try {
                            const seatsData = await publicService.getVehicleSeats(tripData.vehicle_id);
                            if (seatsData && seatsData.length > 0) {
                                setVeiculo({ ...vehicleData, mapa_assentos: seatsData });
                            } else {
                                setVeiculo(vehicleData);
                            }
                        } catch (e) {
                            console.error('Erro ao carregar assentos do veículo:', e);
                            setVeiculo(vehicleData);
                        }
                    } else {
                        setVeiculo(vehicleData);
                    }
                } catch (e) {
                    console.error('Erro ao carregar veículo:', e);
                }
            }

            // Fetch reserved seats from public API
            try {
                const reservedSeats = await publicService.getReservedSeats(id!);
                setAssentosReservados(reservedSeats);
            } catch (e) {
                console.error('Erro ao carregar assentos reservados:', e);
                setAssentosReservados([]);
            }

        } catch (error) {
            console.error('Erro ao carregar viagem:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelecionarAssento = (assento: { numero: string; tipo: TipoAssento; valor: number }) => {
        // Toggle seat selection - allow multiple seats
        const jaExiste = assentosSelecionados.some(a => a.numero === assento.numero);
        if (jaExiste) {
            setAssentosSelecionados(assentosSelecionados.filter(a => a.numero !== assento.numero));
        } else {
            setAssentosSelecionados([...assentosSelecionados, assento]);
        }
    };

    const handleReservar = () => {
        if (assentosSelecionados.length === 0) return;
        // Redirect to checkout with selected seats
        const seatNumbers = assentosSelecionados.map(a => a.numero).join(',');
        navigate(`/viagens/${id}/checkout?seats=${encodeURIComponent(seatNumbers)}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    if (!viagem) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-12 text-center">
                <Bus size={48} className="mx-auto text-slate-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Viagem não encontrada</h2>
                <Link to="/viagens" className="text-blue-600 hover:underline">Voltar para viagens</Link>
            </div>
        );
    }

    const minPrice = getMinPrice(viagem);
    const availableSeats = viagem.seats_available || 0;
    const precos = buildPrecosFromViagem(viagem);
    const totalSelecionado = assentosSelecionados.reduce((sum, a) => sum + a.valor, 0);

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            {/* Back Button */}
            <Link
                to="/viagens"
                className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 mb-6"
            >
                <ArrowLeft size={18} />
                Voltar para viagens
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Cover Image Banner */}
                    {viagem.cover_image && (
                        <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700">
                            <img
                                src={viagem.cover_image}
                                alt={viagem.title || 'Viagem'}
                                className="w-full h-48 md:h-64 object-cover"
                            />
                        </div>
                    )}

                    {/* Trip Header */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                        <div className="flex flex-col gap-4">
                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    {viagem.tags && viagem.tags.length > 0 ? (
                                        viagem.tags.map(tagName => {
                                            const tagDef = allTags.find(t => t.nome === tagName);
                                            const bgColor = tagDef?.cor || '#3b82f6';
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
                                    {availableSeats <= 5 && availableSeats > 0 && (
                                        <span className="text-xs font-semibold px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                                            Últimas {availableSeats} vagas!
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white leading-tight">
                                    {viagem.title || viagem.route_name || 'Viagem'}
                                </h1>
                            </div>

                            {/* Alertas - Showing inline if exists */}
                            {viagem.alerts && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/30 p-4 flex items-start gap-3">
                                    <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                    <p className="text-amber-700 dark:text-amber-400 text-sm font-medium leading-relaxed">
                                        {viagem.alerts}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Route Path */}
                        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl my-6 border border-slate-100 dark:border-slate-800">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 text-green-600 mb-1">
                                    <MapPin size={16} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Origem</span>
                                </div>
                                <p className="font-bold text-slate-800 dark:text-white">
                                    {(() => {
                                        const stops = typeof viagem.route_stops === 'string' ? JSON.parse(viagem.route_stops) : (viagem.route_stops || []);
                                        if (stops && Array.isArray(stops) && stops.length > 0) {
                                            return stops[0].nome;
                                        }
                                        return viagem.origin_neighborhood
                                            ? `${viagem.origin_neighborhood}, ${viagem.origin_city}/${viagem.origin_state}`
                                            : (viagem.origin_city && viagem.origin_state)
                                                ? `${viagem.origin_city}, ${viagem.origin_state}`
                                                : (viagem.origin_city || 'Não informado');
                                    })()}
                                </p>
                            </div>
                            <div className="text-slate-300 dark:text-slate-600 self-center">→</div>
                            <div className="flex-1 text-right">
                                <div className="flex items-center gap-2 justify-end text-red-600 mb-1">
                                    <span className="text-xs font-bold uppercase tracking-wider">Destino</span>
                                    <MapPin size={16} />
                                </div>
                                <p className="font-bold text-slate-800 dark:text-white">
                                    {(() => {
                                        const stops = typeof viagem.route_stops === 'string' ? JSON.parse(viagem.route_stops) : (viagem.route_stops || []);
                                        if (stops && Array.isArray(stops) && stops.length > 0) {
                                            return stops[stops.length - 1].nome;
                                        }
                                        return viagem.destination_neighborhood
                                            ? `${viagem.destination_neighborhood}, ${viagem.destination_city}/${viagem.destination_state}`
                                            : (viagem.destination_city && viagem.destination_state)
                                                ? `${viagem.destination_city}, ${viagem.destination_state}`
                                                : (viagem.destination_city || 'Não informado');
                                    })()}
                                </p>
                            </div>
                        </div>

                        {/* Date & Time Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                    <Calendar size={20} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Data</p>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">
                                        {formatDate(viagem.departure_date)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                    <Clock size={20} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Horário</p>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">
                                        {formatTime(viagem.departure_time)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                    <Users size={20} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Vagas</p>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">
                                        {availableSeats} disponíveis
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                                    <DollarSign size={20} className="text-green-600" />
                                </div>
                                <div>
                                    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Mínimo</p>
                                    <p className="text-sm font-bold text-green-600">
                                        R$ {minPrice > 0 ? minPrice.toFixed(2) : '--'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Baggage Limit if exists */}
                    {viagem.baggage_limit && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30 p-4 flex items-center gap-3">
                            <Briefcase size={20} className="text-blue-600 shrink-0" />
                            <div>
                                <p className="text-xs font-bold text-blue-800/60 uppercase tracking-wider">Limite de Bagagens</p>
                                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">{viagem.baggage_limit}</p>
                            </div>
                        </div>
                    )}

                    {/* Price Table - Collapsible Section */}
                    {Object.keys(precos).length > 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                            <button
                                onClick={() => setPrecosAbertos(!precosAbertos)}
                                className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                                        <DollarSign size={20} className="text-green-600" />
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Tabela de Preços</h2>
                                </div>
                                <div className={`p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 transition-transform ${precosAbertos ? 'rotate-180' : ''}`}>
                                    <ChevronDown size={20} />
                                </div>
                            </button>

                            {precosAbertos && (
                                <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-700">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                        {Object.entries(precos).map(([tipo, valor]) => {
                                            const Icon = SEAT_ICONS[tipo] || Circle;
                                            return (
                                                <div key={tipo} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                                    <div className="flex items-center gap-2">
                                                        <Icon size={16} className="text-slate-400" />
                                                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400 capitalize">
                                                            {tipo.replace(/_/g, ' ').toLowerCase()}
                                                        </span>
                                                    </div>
                                                    <span className="font-bold text-slate-800 dark:text-white">
                                                        R$ {valor.toFixed(2)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Vehicle Gallery - Collapsible Section */}
                    {veiculo && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                            <button
                                onClick={() => setVeiculoAberto(!veiculoAberto)}
                                className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                        <Bus size={20} className="text-blue-600" />
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Conheça nosso veículo</h2>
                                </div>
                                <div className={`p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 transition-transform ${veiculoAberto ? 'rotate-180' : ''}`}>
                                    <ChevronDown size={20} />
                                </div>
                            </button>

                            {veiculoAberto && (
                                <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-700">
                                    <div className="space-y-6 mt-4">
                                        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <div>
                                                <p className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                                                    {veiculo.modelo || 'Ônibus'}
                                                </p>
                                                <div className="flex gap-2 mt-1">
                                                    {veiculo.placa && (
                                                        <span className="text-[12px] font-bold px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded uppercase">
                                                            {veiculo.placa}
                                                        </span>
                                                    )}
                                                    {veiculo.ano && (
                                                        <span className="text-[12px] font-bold px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded uppercase">
                                                            Ano {veiculo.ano}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {veiculo.features && veiculo.features.length > 0 && (
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Comodidades</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {veiculo.features.map((feature, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/30 rounded-lg text-sm text-slate-700 dark:text-slate-300">
                                                            <Check size={16} className="text-green-500 flex-shrink-0" />
                                                            <span>{feature.label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {(veiculo.imagem || (veiculo.galeria && veiculo.galeria.length > 0)) ? (
                                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                                {veiculo.imagem && (
                                                    <img
                                                        src={veiculo.imagem}
                                                        alt={veiculo.modelo || 'Veículo'}
                                                        className="flex-shrink-0 w-64 h-40 object-cover rounded-xl shadow-md border-2 border-white dark:border-slate-800"
                                                    />
                                                )}
                                                {veiculo.galeria?.map((img, idx) => (
                                                    <img
                                                        key={idx}
                                                        src={img}
                                                        alt={`Foto ${idx + 1}`}
                                                        className="flex-shrink-0 w-64 h-40 object-cover rounded-xl shadow-md border-2 border-white dark:border-slate-800"
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-sm italic">
                                                Galeria de fotos em breve
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Seat Map - The CORE interactive part */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                                Escolha seu assento
                            </h2>
                        </div>

                        {!veiculo || !veiculo.mapa_assentos || veiculo.mapa_assentos.length === 0 ? (
                            <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                <AlertCircle size={40} className="mx-auto text-amber-500 mb-3" />
                                <p className="font-bold text-slate-800 dark:text-white">Mapa indisponível</p>
                                <p className="text-sm text-slate-500 mt-1 max-w-[200px] mx-auto">
                                    Não foi possível carregar o mapa de assentos para esta viagem.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto pb-4 -mx-2 px-2 scrollbar-none">
                                <MapaAssentosReserva
                                    veiculo={veiculo}
                                    assentosReservados={assentosReservados}
                                    assentosSelecionados={assentosSelecionados}
                                    onSelecionarAssento={handleSelecionarAssento}
                                    precos={precos}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar - Summary Stickiness */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6 space-y-4">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-blue-600/20 dark:border-blue-500/10 p-6 shadow-lg">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
                                Resumo da Reserva
                            </h3>

                            {assentosSelecionados.length > 0 ? (
                                <>
                                    <div className="space-y-3 mb-8">
                                        {assentosSelecionados.map(assento => (
                                            <div key={assento.numero} className="group flex justify-between items-center p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-white">
                                                        Assento {assento.numero}
                                                    </p>
                                                    <p className="text-[12px] font-bold text-blue-500 uppercase tracking-widest">{assento.tipo}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-bold text-slate-800 dark:text-white px-2 py-1 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                                                        R$ {assento.valor.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                                            <div className="flex justify-between items-end">
                                                <span className="text-sm font-bold text-slate-400 uppercase">Total Geral</span>
                                                <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
                                                    R$ {totalSelecionado.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleReservar}
                                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transform active:scale-[0.98] transition-all"
                                    >
                                        Continuar Reserva
                                    </button>

                                    <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                                        <p className="text-[12px] text-slate-500 font-bold uppercase tracking-wider">
                                            Ambiente 100% Seguro
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-12 px-4">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-200 dark:border-slate-700">
                                        <Bus size={32} className="text-slate-300 dark:text-slate-600" />
                                    </div>
                                    <p className="font-bold text-slate-800 dark:text-white mb-2">Seu carrinho está vazio</p>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        Selecione os assentos desejados no mapa para prosseguir com sua reserva.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Additional Info / Security */}
                        <div className="px-4 flex items-center justify-center gap-4 text-slate-400">
                            <div className="flex items-center gap-1.5 grayscale opacity-50">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-[12px] font-bold uppercase">Pagamento via PIX</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                            <div className="flex items-center gap-1.5 grayscale opacity-50">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-[12px] font-bold uppercase">Suporte 24h</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
