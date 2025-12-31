import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Bus, MapPin, Calendar, Clock, Users,
    DollarSign, Loader, AlertCircle, Check, Briefcase, AlertTriangle
} from 'lucide-react';
import { tripsService } from '../../services/tripsService';
import { vehiclesService } from '../../services/vehiclesService';
import { reservationsService } from '../../services/reservationsService';
import { MapaAssentosReserva } from '../../components/Veiculos/MapaAssentosReserva';
import { publicService } from '../../services/publicService';
import { IViagem, IVeiculo, TipoAssento, ITag } from '../../types';

// Helper to format date
const formatDate = (date: string | Date) => {
    if (!date) return '--';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
    });
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
                tripsService.getTags().catch(() => []) // Fallback if tags fail (e.g. public access)
            ]);
            setViagem(tripData);
            setAllTags(tagsData);

            // Fetch vehicle if exists
            if (tripData.vehicle_id) {
                try {
                    const vehicleData = await vehiclesService.getById(tripData.vehicle_id);

                    // If vehicle doesn't have mapa_assentos, try to fetch seats separately
                    if (!vehicleData.mapa_assentos || vehicleData.mapa_assentos.length === 0) {
                        try {
                            const seatsData = await vehiclesService.getSeats(tripData.vehicle_id);
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

            // Fetch reserved seats from reservations API
            try {
                const reservedSeats = await reservationsService.getReservedSeats(id!);
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
        // Redirect to login with return URL containing all selected seats
        const seatNumbers = assentosSelecionados.map(a => a.numero).join(',');
        const returnUrl = `/viagens/${id}?seats=${seatNumbers}`;
        navigate(`/cliente/login?returnUrl=${encodeURIComponent(returnUrl)}`);
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
                        <div className="rounded-2xl overflow-hidden">
                            <img
                                src={viagem.cover_image}
                                alt={viagem.title || 'Viagem'}
                                className="w-full h-48 md:h-64 object-cover"
                            />
                        </div>
                    )}

                    {/* Trip Header */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Bus size={28} className="text-white" />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-1">
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
                                    {availableSeats <= 5 && availableSeats > 0 && (
                                        <span className="text-xs font-semibold px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                                            Últimas {availableSeats} vagas!
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">
                                    {viagem.title || viagem.route_name || 'Viagem'}
                                </h1>
                            </div>
                        </div>

                        {/* Route Path */}
                        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 text-green-600 mb-1">
                                    <MapPin size={16} />
                                    <span className="text-sm font-medium">Origem</span>
                                </div>
                                <p className="font-semibold text-slate-800 dark:text-white">
                                    {(() => {
                                        const stops = typeof viagem.route_stops === 'string' ? JSON.parse(viagem.route_stops) : viagem.route_stops;
                                        if (stops && stops.length > 0) {
                                            return stops[0].nome;
                                        }
                                        return (viagem.origin_city && viagem.origin_state)
                                            ? `${viagem.origin_city}, ${viagem.origin_state}`
                                            : (viagem.origin_city || 'Não informado');
                                    })()}
                                </p>
                            </div>
                            <div className="text-slate-300 dark:text-slate-600">→</div>
                            <div className="flex-1 text-right">
                                <div className="flex items-center gap-2 justify-end text-red-600 mb-1">
                                    <span className="text-sm font-medium">Destino</span>
                                    <MapPin size={16} />
                                </div>
                                <p className="font-semibold text-slate-800 dark:text-white">
                                    {(() => {
                                        const stops = typeof viagem.route_stops === 'string' ? JSON.parse(viagem.route_stops) : viagem.route_stops;
                                        if (stops && stops.length > 0) {
                                            return stops[stops.length - 1].nome;
                                        }
                                        return (viagem.destination_city && viagem.destination_state)
                                            ? `${viagem.destination_city}, ${viagem.destination_state}`
                                            : (viagem.destination_city || 'Não informado');
                                    })()}
                                </p>
                            </div>
                        </div>

                        {/* Date & Time */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                <Calendar size={18} className="text-blue-600" />
                                <div>
                                    <p className="text-xs text-slate-500">Data</p>
                                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                        {formatDate(viagem.departure_date)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                <Clock size={18} className="text-blue-600" />
                                <div>
                                    <p className="text-xs text-slate-500">Horário</p>
                                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                        {formatTime(viagem.departure_time)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                <Users size={18} className="text-blue-600" />
                                <div>
                                    <p className="text-xs text-slate-500">Vagas</p>
                                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                        {availableSeats} disponíveis
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                <DollarSign size={18} className="text-green-600" />
                                <div>
                                    <p className="text-xs text-slate-500">A partir de</p>
                                    <p className="text-sm font-semibold text-green-600">
                                        R$ {minPrice > 0 ? minPrice.toFixed(2) : 'Consulte'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Baggage and Alerts Section */}
                    {(viagem.baggage_limit || viagem.alerts) && (
                        <div className={`grid grid-cols-1 ${viagem.baggage_limit && viagem.alerts ? 'md:grid-cols-2' : ''} gap-4`}>
                            {viagem.baggage_limit && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30 p-6">
                                    <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                                        <Briefcase size={20} />
                                        Limite de Bagagens
                                    </h3>
                                    <p className="text-blue-700 dark:text-blue-400">
                                        {viagem.baggage_limit}
                                    </p>
                                </div>
                            )}
                            {viagem.alerts && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800/30 p-6">
                                    <h3 className="text-lg font-bold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
                                        <AlertTriangle size={20} />
                                        Alertas Importantes
                                    </h3>
                                    <p className="text-amber-700 dark:text-amber-400 whitespace-pre-line">
                                        {viagem.alerts}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}



                    {/* Seat Map */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
                            Escolha seu assento
                        </h2>

                        {!veiculo || !veiculo.mapa_assentos || veiculo.mapa_assentos.length === 0 ? (
                            <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                <AlertCircle size={32} className="mx-auto text-amber-500 mb-3" />
                                <p className="text-slate-600 dark:text-slate-400">
                                    Mapa de assentos não disponível para esta viagem.
                                </p>
                                <p className="text-sm text-slate-500 mt-1">
                                    Entre em contato para mais informações.
                                </p>
                            </div>
                        ) : (
                            <MapaAssentosReserva
                                veiculo={veiculo}
                                assentosReservados={assentosReservados}
                                assentosSelecionados={assentosSelecionados}
                                onSelecionarAssento={handleSelecionarAssento}
                                precos={precos}
                            />
                        )}
                    </div>

                    {/* Vehicle Gallery */}
                    {veiculo && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <Bus size={20} className="text-blue-600" />
                                Conheça nosso veículo
                            </h2>

                            {/* Vehicle Info */}
                            <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                    <Bus size={24} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-white">
                                        {veiculo.modelo || 'Ônibus'}
                                    </p>
                                    {veiculo.placa && (
                                        <p className="text-sm text-slate-500">{veiculo.placa}</p>
                                    )}
                                    {veiculo.ano && (
                                        <p className="text-xs text-slate-400">Ano {veiculo.ano}</p>
                                    )}
                                </div>
                            </div>

                            {/* Vehicle Features */}
                            {veiculo.features && veiculo.features.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Comodidades e Características</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                        {veiculo.features.map((feature, idx) => (
                                            <div key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                                                <span>{feature.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Gallery Images */}
                            {(veiculo.imagem || (veiculo.galeria && veiculo.galeria.length > 0)) ? (
                                <div className="flex gap-3 overflow-x-auto pb-2">
                                    {veiculo.imagem && (
                                        <img
                                            src={veiculo.imagem}
                                            alt={veiculo.modelo || 'Veículo'}
                                            className="flex-shrink-0 w-48 h-32 object-cover rounded-xl"
                                        />
                                    )}
                                    {veiculo.galeria?.map((img, idx) => (
                                        <img
                                            key={idx}
                                            src={img}
                                            alt={`Foto ${idx + 1}`}
                                            className="flex-shrink-0 w-48 h-32 object-cover rounded-xl"
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 italic">
                                    Fotos do veículo em breve disponíveis.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar - Booking Summary */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Price Table - Moved from Main Column */}
                    {Object.keys(precos).length > 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <DollarSign size={20} className="text-green-600" />
                                Tabela de Preços
                            </h2>
                            <div className="grid grid-cols-1 gap-3">
                                {viagem.price_conventional && Number(viagem.price_conventional) > 0 && (
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                        <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                            <span className="text-lg">💺</span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Convencional</p>
                                            <p className="font-bold text-green-600">R$ {Number(viagem.price_conventional).toFixed(2)}</p>
                                        </div>
                                    </div>
                                )}
                                {viagem.price_executive && Number(viagem.price_executive) > 0 && (
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                        <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                            <span className="text-lg">⭐</span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Executivo</p>
                                            <p className="font-bold text-green-600">R$ {Number(viagem.price_executive).toFixed(2)}</p>
                                        </div>
                                    </div>
                                )}
                                {viagem.price_semi_sleeper && Number(viagem.price_semi_sleeper) > 0 && (
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                            <span className="text-lg">🛋️</span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Semi-Leito</p>
                                            <p className="font-bold text-green-600">R$ {Number(viagem.price_semi_sleeper).toFixed(2)}</p>
                                        </div>
                                    </div>
                                )}
                                {viagem.price_sleeper && Number(viagem.price_sleeper) > 0 && (
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                            <span className="text-lg">🌙</span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Leito</p>
                                            <p className="font-bold text-green-600">R$ {Number(viagem.price_sleeper).toFixed(2)}</p>
                                        </div>
                                    </div>
                                )}
                                {viagem.price_bed && Number(viagem.price_bed) > 0 && (
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                        <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                            <span className="text-lg">🛏️</span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Cama</p>
                                            <p className="font-bold text-green-600">R$ {Number(viagem.price_bed).toFixed(2)}</p>
                                        </div>
                                    </div>
                                )}
                                {viagem.price_master_bed && Number(viagem.price_master_bed) > 0 && (
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                                            <span className="text-lg">👑</span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Cama Master</p>
                                            <p className="font-bold text-green-600">R$ {Number(viagem.price_master_bed).toFixed(2)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 sticky top-24">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Resumo da Reserva</h3>

                        {assentosSelecionados.length > 0 ? (
                            <>
                                <div className="space-y-3 mb-6">
                                    {assentosSelecionados.map(assento => (
                                        <div key={assento.numero} className="flex justify-between text-sm p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <div>
                                                <p className="font-semibold text-slate-800 dark:text-white">
                                                    Assento {assento.numero}
                                                </p>
                                                <p className="text-xs text-slate-500">{assento.tipo}</p>
                                            </div>
                                            <span className="font-semibold text-blue-600">
                                                R$ {assento.valor.toFixed(2)}
                                            </span>
                                        </div>
                                    ))}

                                    <div className="border-t border-slate-100 dark:border-slate-700 pt-3">
                                        <div className="flex justify-between">
                                            <span className="text-slate-600 dark:text-slate-400">Total</span>
                                            <span className="text-2xl font-bold text-blue-600">
                                                R$ {totalSelecionado.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleReservar}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors"
                                >
                                    Reservar Agora
                                </button>

                                <p className="text-xs text-center text-slate-500 mt-3">
                                    Você será redirecionado para fazer login
                                </p>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <Bus size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                <p className="text-slate-500 dark:text-slate-400 text-sm">
                                    Selecione um assento no mapa para continuar
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
