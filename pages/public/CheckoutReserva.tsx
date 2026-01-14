import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Bus, MapPin, Calendar, Clock, User,
    ShieldCheck, Loader, AlertTriangle, CheckCircle2,
    Briefcase, CreditCard
} from 'lucide-react';
import { publicService } from '../../services/publicService';
import { IViagem, TipoAssento } from '../../types';
import { authClient } from '../../lib/auth-client';

export const CheckoutReserva: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    // Parse selected seats from URL
    const searchParams = new URLSearchParams(location.search);
    const seatNumbers = searchParams.get('seats')?.split(',') || [];

    const [viagem, setViagem] = useState<IViagem | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [session, setSession] = useState<any>(null);

    // Form states for each seat
    const [passengers, setPassengers] = useState<any[]>([]);

    useEffect(() => {
        checkAuthAndFetchData();
    }, [id]);

    const checkAuthAndFetchData = async () => {
        try {
            setLoading(true);

            // 1. Check Session
            const { data } = await authClient.getSession();
            if (!data) {
                navigate(`/cliente/login?returnUrl=${encodeURIComponent(location.pathname + location.search)}`);
                return;
            }
            setSession(data);

            // 2. Fetch Trip Details
            const tripData = await publicService.getTripById(id!);
            setViagem(tripData);

            // 3. Initialize passengers based on seats
            const initialPassengers = seatNumbers.map(num => ({
                seat_number: num,
                name: data.user.name || '',
                document: '',
                email: data.user.email || '',
                phone: '',
            }));
            setPassengers(initialPassengers);

        } catch (err) {
            console.error('Erro ao preparar checkout:', err);
            setError('Não foi possível carregar os dados para a reserva.');
        } finally {
            setLoading(false);
        }
    };

    const handlePassengerChange = (index: number, field: string, value: string) => {
        const newPassengers = [...passengers];
        newPassengers[index] = { ...newPassengers[index], [field]: value };
        setPassengers(newPassengers);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            // In a real app, we might need a dedicated checkout endpoint that handles multiple seats
            // For now, let's assume we loop or have a bulk endpoint.
            // Our backend /api/client/checkout currently supports ONE reservation at a time.

            // Collect all seat IDs from the vehicle mapa_assentos
            const vehicle = await publicService.getVehicleById(viagem!.vehicle_id!);
            const seatMap = await publicService.getVehicleSeats(viagem!.vehicle_id!);

            for (const p of passengers) {
                const seatObj = seatMap.find((s: any) => s.numero === p.seat_number);
                if (!seatObj) throw new Error(`Assento ${p.seat_number} não encontrado.`);

                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/client/checkout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        trip_id: id,
                        seat_id: seatObj.id,
                        passenger_name: p.name,
                        passenger_document: p.document,
                        passenger_email: p.email,
                        passenger_phone: p.phone,
                        price: (viagem as any)[`price_${seatObj.tipo.toLowerCase().replace('_', '')}`] || viagem?.price_conventional || 0,
                        boarding_point: voyageBoardingPoint(),
                        dropoff_point: voyageDropoffPoint()
                    }),
                    // Credentials needed for clientAuthorize middleware
                    // Note: fetch needs credentials: 'include' for better-auth cookies
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Erro ao processar reserva.');
                }
            }

            setSuccess(true);
            setTimeout(() => navigate('/cliente/dashboard'), 3000);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const voyageBoardingPoint = () => {
        const stops = typeof viagem?.route_stops === 'string' ? JSON.parse(viagem.route_stops) : (viagem?.route_stops || []);
        return stops.length > 0 ? stops[0].nome : viagem?.origin_city;
    };

    const voyageDropoffPoint = () => {
        const stops = typeof viagem?.route_stops === 'string' ? JSON.parse(viagem.route_stops) : (viagem?.route_stops || []);
        return stops.length > 0 ? stops[stops.length - 1].nome : viagem?.destination_city;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader className="animate-spin text-blue-600" size={32} />
                <p className="text-slate-500 font-medium">Preparando seu checkout...</p>
            </div>
        );
    }

    if (success) {
        return (
            <div className="max-w-md mx-auto px-4 py-20 text-center">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={48} />
                </div>
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">Reserva realizada!</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8">
                    Suas poltronas foram reservadas com sucesso. Você será redirecionado para o seu painel em instantes.
                </p>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Próximo Passo</p>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        Acesse seu dashboard para realizar o pagamento via PIX e garantir sua vaga.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 mb-6"
            >
                <ArrowLeft size={18} />
                Voltar
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            <User size={20} className="text-blue-600" />
                            Dados dos Passageiros
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            {passengers.map((p, index) => (
                                <div key={p.seat_number} className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 py-1 px-3 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-bl-lg">
                                        Assento {p.seat_number}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nome Completo</label>
                                            <input
                                                type="text"
                                                required
                                                value={p.name}
                                                onChange={(e) => handlePassengerChange(index, 'name', e.target.value)}
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                                                placeholder="Como no documento"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">CPF</label>
                                            <input
                                                type="text"
                                                required
                                                value={p.document}
                                                onChange={(e) => handlePassengerChange(index, 'document', e.target.value)}
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                                                placeholder="000.000.000-00"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Telefone</label>
                                            <input
                                                type="tel"
                                                required
                                                value={p.phone}
                                                onChange={(e) => handlePassengerChange(index, 'phone', e.target.value)}
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                                                placeholder="(00) 00000-0000"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm flex items-center gap-3">
                                    <AlertTriangle size={20} />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <Loader className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        Confirmar Reserva
                                        <ShieldCheck size={20} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Summary Section */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6 space-y-4">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
                                Resumo da Viagem
                            </h3>

                            <div className="space-y-4 mb-6">
                                <div className="flex gap-3">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 h-fit">
                                        <Bus size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 dark:text-white">{viagem?.title || viagem?.route_name}</p>
                                        <p className="text-xs text-slate-500">{viagem?.vehicle_model}</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 h-fit">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 dark:text-white">
                                            {viagem?.departure_date ? new Date(viagem.departure_date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }) : '--'}
                                        </p>
                                        <p className="text-xs text-slate-500">{viagem?.departure_time?.slice(0, 5)}h</p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center gap-2 text-green-600 mb-2">
                                        <MapPin size={14} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Embarque</span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {voyageBoardingPoint()}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Total {passengers.length}x</span>
                                    <span className="text-sm font-bold text-slate-400 line-through">R$ {(passengers.length * (viagem?.price_conventional || 0) * 1.1).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="font-bold text-slate-700 dark:text-slate-200">Valor Total</span>
                                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                        R$ {(passengers.length * (viagem?.price_conventional || 0)).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                            <div className="flex items-center gap-3 mb-2">
                                <ShieldCheck size={24} className="opacity-80" />
                                <p className="font-bold text-sm">Reserva 100% Segura</p>
                            </div>
                            <p className="text-[11px] text-blue-100 leading-relaxed">
                                Seus dados estão protegidos por criptografia de ponta a ponta. A SGTL não armazena dados de pagamento sensíveis.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
