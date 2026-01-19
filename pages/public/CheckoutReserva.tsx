import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Bus, MapPin, Calendar, Clock, User,
    ShieldCheck, Loader, AlertTriangle, CheckCircle2,
    Briefcase, CreditCard, ChevronDown, Wallet, QrCode, Copy, ExternalLink, Link as LinkIcon
} from 'lucide-react';
import { publicService } from '../../services/publicService';
import { IViagem, TipoAssento } from '../../types';
import { authClient } from '../../lib/auth-client';
import { paymentService, IPaymentResponse } from '../../services/paymentService';

// Interface for checkout response
interface ICheckoutResponse {
    success: boolean;
    reservations: Array<{
        id: string;
        trip_id: string;
        seat_id: string;
        passenger_name: string;
        passenger_document: string;
        status: string;
        ticket_code: string;
        price: number;
        [key: string]: any;
    }>;
}

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
    const { data: sessionData, isPending: sessionPending } = authClient.useSession();
    const [session, setSession] = useState<any>(null);

    // Form states
    const [passengers, setPassengers] = useState<any[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'LINK'>('PIX');
    const [paymentResult, setPaymentResult] = useState<IPaymentResponse | null>(null);

    const [needsAuth, setNeedsAuth] = useState(false);

    // Credit and Partial Payment states
    const [clientProfile, setClientProfile] = useState<any>(null);
    const [useCredits, setUseCredits] = useState(false);
    const [creditsToUse, setCreditsToUse] = useState(0);
    const [isPartialPayment, setIsPartialPayment] = useState(false);
    const [entryValue, setEntryValue] = useState(0);

    useEffect(() => {
        checkAuthAndFetchData();
    }, [id, sessionData]);

    // Reactive logic for credits and partial payments
    useEffect(() => {
        const total = passengers.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
        let currentCredits = 0;

        if (useCredits && clientProfile) {
            currentCredits = Math.min(Number(clientProfile.saldo_creditos || 0), total);
            setCreditsToUse(currentCredits);
        } else {
            setCreditsToUse(0);
        }

        const effectiveTotal = Math.max(0, total - currentCredits);

        if (isPartialPayment) {
            setEntryValue(effectiveTotal * 0.20);
        } else {
            setEntryValue(effectiveTotal);
        }
    }, [useCredits, isPartialPayment, passengers, clientProfile]);

    const getPriceBySeatType = (v: IViagem, type: string) => {
        const t = (type || '').toUpperCase();
        if (t === TipoAssento.CONVENCIONAL) return Number(v.price_conventional || 0);
        if (t === TipoAssento.EXECUTIVO) return Number(v.price_executive || 0);
        if (t === TipoAssento.SEMI_LEITO) return Number(v.price_semi_sleeper || 0);
        if (t === TipoAssento.LEITO) return Number(v.price_sleeper || 0);
        if (t === TipoAssento.CAMA) return Number(v.price_bed || 0);
        if (t === TipoAssento.CAMA_MASTER) return Number(v.price_master_bed || 0);
        return Number(v.price_conventional || 0);
    };

    const checkAuthAndFetchData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Trip Details
            const tripData = await publicService.getTripById(id!);
            setViagem(tripData);

            // 2. Fetch Seats to get their types and prices
            const seatMap = await publicService.getVehicleSeats(tripData.vehicle_id!);

            // 3. Check Session (from useSession hook)
            if (!sessionData) {
                setSession(null);
                setNeedsAuth(true);

                // Initialize temporary price data for the summary even if not logged in
                const stops = typeof tripData.route_stops === 'string' ? JSON.parse(tripData.route_stops) : (tripData.route_stops || []);
                const returnStops = typeof tripData.return_route_stops === 'string' ? JSON.parse(tripData.return_route_stops) : (tripData.return_route_stops || []);

                const defaultBoarding = stops.length > 0 ? stops[0].nome : (tripData.origin_city || '');
                const defaultDropoff = returnStops.length > 0 ? returnStops[returnStops.length - 1].nome : (tripData.destination_city || '');

                const guestPassengers = seatNumbers.map(num => {
                    const seatObj = seatMap.find((s: any) => s.numero === num);
                    const price = seatObj ? getPriceBySeatType(tripData, seatObj.tipo) : Number(tripData.price_conventional || 0);
                    return {
                        seat_number: num,
                        price,
                        boarding_point: defaultBoarding,
                        dropoff_point: defaultDropoff
                    };
                });
                setPassengers(guestPassengers);
                return;
            }

            setSession(sessionData);
            setNeedsAuth(false);

            // 4. Fetch Client Profile for better pre-fill (CPF, etc)
            let clientProfile: any = null;
            try {
                const profileData = await fetch(`${import.meta.env.VITE_API_URL}/api/client/dashboard`, {
                    credentials: 'include'
                });
                if (profileData.ok) {
                    const result = await profileData.json();
                    clientProfile = result.profile;
                    setClientProfile(result.profile);
                }
            } catch (err) {
                console.error('Erro ao buscar perfil do cliente:', err);
            }

            // 5. Initialize passengers based on selected seats and their real prices
            const stops = typeof tripData.route_stops === 'string' ? JSON.parse(tripData.route_stops) : (tripData.route_stops || []);
            const returnStops = typeof tripData.return_route_stops === 'string' ? JSON.parse(tripData.return_route_stops) : (tripData.return_route_stops || []);

            const defaultBoarding = stops.length > 0 ? stops[0].nome : (tripData.origin_city || '');
            const defaultDropoff = returnStops.length > 0 ? returnStops[returnStops.length - 1].nome : (tripData.destination_city || '');

            const initialPassengers = seatNumbers.map((num, index) => {
                const seatObj = seatMap.find((s: any) => s.numero === num);
                const price = seatObj ? getPriceBySeatType(tripData, seatObj.tipo) : Number(tripData.price_conventional || 0);

                // Pre-fill only the first passenger with the logged-in user's data
                const name = (index === 0 && (clientProfile?.nome || sessionData?.user?.name)) ? (clientProfile?.nome || sessionData.user.name) : '';
                const email = (index === 0 && (clientProfile?.email || sessionData?.user?.email)) ? (clientProfile?.email || sessionData.user.email) : '';
                const phone = (index === 0 && (clientProfile?.telefone || sessionData?.user?.phoneNumber)) ? (clientProfile?.telefone || sessionData.user.phoneNumber) : '';
                const document = (index === 0 && clientProfile?.documento_numero) ? clientProfile.documento_numero : '';

                return {
                    seat_number: num,
                    seat_id: seatObj?.id,
                    name: name,
                    document: document,
                    email: email,
                    phone: phone,
                    price: price,
                    boarding_point: defaultBoarding,
                    dropoff_point: defaultDropoff
                };
            });
            setPassengers(initialPassengers);

            // Initialize entry value
            const total = initialPassengers.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
            setEntryValue(total);


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

        for (const p of passengers) {
            if (!p.name?.trim() || !p.document?.trim()) {
                setError('Por favor, preencha o nome e o documento de todos os passageiros.');
                return;
            }
            if (!p.boarding_point || !p.dropoff_point) {
                setError('Por favor, selecione os pontos de embarque e desembarque para todos os passageiros.');
                return;
            }
        }

        setIsSubmitting(true);

        try {
            // 1. Create Reservations (Batch)
            const resData = {
                trip_id: id,
                reservations: passengers.map(p => ({
                    seat_id: p.seat_id,
                    seat_number: p.seat_number,
                    passenger_name: p.name,
                    passenger_document: p.document,
                    passenger_email: p.email,
                    passenger_phone: p.phone,
                    price: p.price,
                    boarding_point: p.boarding_point,
                    dropoff_point: p.dropoff_point
                })),
                credits_used: creditsToUse,
                is_partial: isPartialPayment,
                entry_value: entryValue
            };

            const response = await authClient.$fetch('/api/client/checkout', {
                method: 'POST',
                body: resData
            });

            // Check if response has error or is missing required properties
            if (!response || (response as any).error || !(response as any).success || !(response as any).reservations) {
                const errorDetail = (response as any).error;
                const errorString = typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail);
                throw new Error(errorString || 'Erro ao processar as reservas.');
            }

            // Type assertion: we've confirmed response has success and reservations properties
            const checkoutResponse = response as unknown as ICheckoutResponse;

            // 2. Generate Payment via N8N/ASAAS
            // We pay the entryValue (which could be the full amount or just the signal)
            const amountToPayNow = entryValue;

            if (amountToPayNow <= 0) {
                // If everything was paid with credits
                setSuccess(true);
                return;
            }

            const mainPassenger = passengers[0];
            const payResponse = await paymentService.createPayment({
                amount: amountToPayNow,
                type: paymentMethod,
                customer: {
                    name: mainPassenger.name,
                    cpf: mainPassenger.document.replace(/\D/g, ''),
                    email: mainPassenger.email,
                    phone: mainPassenger.phone
                },
                items: [{
                    description: `Reserva de Viagem - ${viagem?.title || viagem?.route_name} (${passengers.length} assentos)`,
                    amount: amountToPayNow,
                    quantity: 1
                }],
                externalReference: checkoutResponse.reservations[0].id
            });

            if (payResponse.success) {
                setPaymentResult(payResponse);
                setSuccess(true);
            } else {
                throw new Error(payResponse.message || 'Erro ao gerar pagamento');
            }

        } catch (err: any) {
            console.error('Checkout error details:', err);
            const errorMessage = (err.data && typeof err.data.error === 'string')
                ? err.data.error
                : (typeof err.message === 'string' ? err.message : 'Erro inesperado ao processar a reserva. Por favor, tente novamente.');
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const stops = typeof viagem?.route_stops === 'string' ? JSON.parse(viagem.route_stops) : (viagem?.route_stops || []);
    const returnStops = typeof viagem?.return_route_stops === 'string' ? JSON.parse(viagem.return_route_stops) : (viagem?.return_route_stops || []);
    const boardingOptions = stops.filter((s: any) => s.permite_embarque !== false);
    const dropoffOptions = returnStops.filter((s: any) => s.permite_desembarque !== false);

    const totalSelecionado = passengers.length > 0
        ? passengers.reduce((sum, p) => sum + (Number(p.price) || 0), 0)
        : seatNumbers.length * (Number(viagem?.price_conventional) || 0); // fallback pricing for summary

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader className="animate-spin text-blue-600" size={32} />
                <p className="text-slate-500 font-medium">Preparando seu checkout...</p>
            </div>
        );
    }

    if (success && paymentResult) {
        return (
            <div className="max-w-xl mx-auto px-4 py-12">
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
                    <div className="p-8 text-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={48} />
                        </div>
                        <h2 className="text-3xl font-black mb-2">Reserva Realizada!</h2>
                        <p className="text-blue-100 font-medium">Sua vaga está garantida. Agora falta pouco para finalizarmos.</p>
                    </div>

                    <div className="p-8">
                        {paymentMethod === 'PIX' ? (
                            <div className="space-y-6 text-center">
                                <div className="inline-block p-4 bg-white rounded-2xl border-2 border-slate-100 shadow-sm mb-4">
                                    {paymentResult.qrCode ? (
                                        <img src={paymentResult.qrCode} alt="PIX QR Code" className="w-48 h-48 mx-auto" />
                                    ) : (
                                        <div className="w-48 h-48 bg-slate-100 flex items-center justify-center mx-auto">
                                            <QrCode size={48} className="text-slate-300" />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Pix Copia e Cola</p>
                                    <div className="flex gap-2">
                                        <input
                                            readOnly
                                            value={paymentResult.copyPasteCode}
                                            className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono truncate"
                                        />
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(paymentResult.copyPasteCode || '');
                                                alert('Código PIX copiado!');
                                            }}
                                            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                                        >
                                            <Copy size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800 text-left">
                                    <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
                                        <strong>⚠️ Atenção:</strong> O pagamento via PIX é instantâneo. Assim que o processamento for concluído, você receberá um e-mail de confirmação.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 text-center py-8">
                                <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <CreditCard size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Pague com Cartão ou Boleto</h3>
                                <p className="text-slate-500 dark:text-slate-400 mb-8 px-4">
                                    Utilizamos o ambiente seguro do ASAAS para processar seu pagamento. Clique no botão abaixo para continuar.
                                </p>
                                <a
                                    href={paymentResult.paymentLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-[0.98]"
                                >
                                    Pagar Agora
                                    <ExternalLink size={20} />
                                </a>
                            </div>
                        )}

                        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-700">
                            <button
                                onClick={() => navigate('/cliente/dashboard')}
                                className="w-full py-4 text-slate-500 font-bold hover:text-slate-800 transition-colors"
                            >
                                Ir para o meu Painel de Reservas
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (needsAuth) {
        const returnUrl = encodeURIComponent(location.pathname + location.search);
        return (
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                            <ShieldCheck size={14} />
                            Checkout Seguro
                        </div>
                        <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-6 leading-tight">
                            Quase lá! <br />
                            Precisa estar logado para continuar.
                        </h2>
                        <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 leading-relaxed">
                            Para garantir sua reserva e carregar seus dados automaticamente, escolha uma das opções abaixo:
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => navigate(`/cliente/login?returnUrl=${returnUrl}`)}
                                className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl hover:border-blue-500 transition-all group"
                            >
                                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <User size={24} />
                                </div>
                                <span className="font-bold text-slate-800 dark:text-white">Já sou cliente</span>
                                <span className="text-xs text-slate-400 mt-1">Fazer Login</span>
                            </button>

                            <button
                                onClick={() => navigate(`/cliente/signup?returnUrl=${returnUrl}`)}
                                className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl hover:border-emerald-500 transition-all group"
                            >
                                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <User size={24} />
                                </div>
                                <span className="font-bold text-slate-800 dark:text-white">Ainda não sou cliente</span>
                                <span className="text-xs text-slate-400 mt-1">Criar Cadastro</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Resumo da Reserva</h3>

                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 text-blue-600">
                                    <Bus size={24} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-white">{viagem?.title || viagem?.route_name}</p>
                                    <p className="text-xs text-slate-500">{viagem?.vehicle_model}</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 text-blue-600">
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-white">
                                        {viagem?.departure_date ? new Date(viagem.departure_date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', timeZone: 'UTC' }) : '--'}
                                    </p>
                                    <p className="text-xs text-slate-500">{viagem?.departure_time?.slice(0, 5)}h</p>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold text-slate-400 uppercase">Assentos selecionados</span>
                                    <span className="font-black text-slate-700 dark:text-slate-300">{seatNumbers.join(', ')}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-bold text-slate-400 uppercase">Valor Total</span>
                                    <span className="text-3xl font-black text-blue-600 dark:text-blue-400">R$ {totalSelecionado.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
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

                                    <div className="space-y-6">
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
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Documento (CPF/RG)</label>
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

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                                            <div className="relative">
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                                                    <MapPin size={14} className="text-blue-500" />
                                                    Embarque (IDA)
                                                </label>
                                                <select
                                                    value={p.boarding_point || ''}
                                                    onChange={(e) => handlePassengerChange(index, 'boarding_point', e.target.value)}
                                                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none transition-all dark:text-white font-medium"
                                                    required
                                                >
                                                    <option value="">Selecione...</option>
                                                    {boardingOptions.map((s: any) => (
                                                        <option key={s.nome} value={s.nome}>
                                                            {s.nome} {s.horario_partida ? `- ${s.horario_partida.slice(0, 5)}` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-4 top-9 pointer-events-none text-slate-400">
                                                    <ChevronDown size={18} />
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                                                    <MapPin size={14} className="text-purple-500" />
                                                    Desembarque (VOLTA)
                                                </label>
                                                <select
                                                    value={p.dropoff_point || ''}
                                                    onChange={(e) => handlePassengerChange(index, 'dropoff_point', e.target.value)}
                                                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none transition-all dark:text-white font-medium"
                                                    required
                                                >
                                                    <option value="">Selecione...</option>
                                                    {dropoffOptions.map((s: any) => (
                                                        <option key={s.nome} value={s.nome}>
                                                            {s.nome} {s.horario_chegada ? `- ${s.horario_chegada.slice(0, 5)}` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-4 top-9 pointer-events-none text-slate-400">
                                                    <ChevronDown size={18} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Credits and Partial Payment logic */}
                            {(clientProfile?.saldo_creditos > 0 || totalSelecionado > 0) && (
                                <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                                    {clientProfile?.saldo_creditos > 0 && (
                                        <div className={`p-4 rounded-2xl border transition-all ${useCredits ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${useCredits ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                                                    <Wallet size={24} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold text-slate-800 dark:text-white">Usar meus créditos</span>
                                                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Saldo: R$ {Number(clientProfile.saldo_creditos).toFixed(2)}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Abater valor do saldo disponível em conta.</p>
                                                </div>
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={useCredits}
                                                        onChange={(e) => setUseCredits(e.target.checked)}
                                                        className="w-6 h-6 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                            {useCredits && (
                                                <div className="mt-4 pt-4 border-t border-blue-200/50 dark:border-blue-800/50">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-slate-600 dark:text-slate-400">Créditos a aplicar:</span>
                                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">- R$ {creditsToUse.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className={`p-4 rounded-2xl border transition-all ${isPartialPayment ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isPartialPayment ? 'bg-purple-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                                                <CreditCard size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <span className="font-bold text-slate-800 dark:text-white">Pagamento Parcial (Sinal)</span>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pague 20% agora e o restante no embarque.</p>
                                            </div>
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isPartialPayment}
                                                    onChange={(e) => setIsPartialPayment(e.target.checked)}
                                                    className="w-6 h-6 rounded-lg border-slate-300 text-purple-600 focus:ring-purple-500 transition-all cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                        {isPartialPayment && (
                                            <div className="mt-4 pt-4 border-t border-purple-200/50 dark:border-purple-800/50 space-y-2">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-600 dark:text-slate-400">Valor da Entrada (Sinal):</span>
                                                    <span className="font-bold text-slate-800 dark:text-white">R$ {entryValue.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs text-slate-500 italic">
                                                    <span>Restante no embarque:</span>
                                                    <span>R$ {Math.max(0, (totalSelecionado - creditsToUse) - entryValue).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Payment Selection */}
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <CreditCard size={16} />
                                    Forma de Pagamento
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('PIX')}
                                        className={`flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 border-2 rounded-2xl transition-all ${paymentMethod === 'PIX' ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                                    >
                                        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-3">
                                            <QrCode size={24} />
                                        </div>
                                        <span className="font-bold text-slate-800 dark:text-white">PIX</span>
                                        <span className="text-xs text-slate-400 mt-1">Confirmação Instantânea</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('LINK')}
                                        className={`flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 border-2 rounded-2xl transition-all ${paymentMethod === 'LINK' ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                                    >
                                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-3">
                                            <CreditCard size={24} />
                                        </div>
                                        <span className="font-bold text-slate-800 dark:text-white">Cartão ou Boleto</span>
                                        <span className="text-xs text-slate-400 mt-1">Ambiente Seguro ASAAS</span>
                                    </button>
                                </div>
                            </div>

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
                    <div className="sticky top-8 space-y-6">
                        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl p-6">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <ShieldCheck size={20} className="text-blue-600" />
                                Resumo da Reserva
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
                                            {viagem?.departure_date ? new Date(viagem.departure_date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', timeZone: 'UTC' }) : '--'}
                                        </p>
                                        <p className="text-xs text-slate-500">{viagem?.departure_time?.slice(0, 5)}h</p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center gap-2 text-green-600 mb-2">
                                        <MapPin size={14} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Itinerário</span>
                                    </div>
                                    <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                        {passengers.length > 0 && Array.from(new Set(passengers.map(p => p.boarding_point))).length === 1
                                            ? passengers[0].boarding_point
                                            : 'Pontos Múltiplos'}
                                        <span className="text-slate-300 dark:text-slate-600 mx-1">→</span>
                                        {passengers.length > 0 && Array.from(new Set(passengers.map(p => p.dropoff_point))).length === 1
                                            ? passengers[0].dropoff_point
                                            : 'Pontos Múltiplos'}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/30 space-y-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Passagens ({passengers.length})</span>
                                        <span className="text-xs font-bold text-slate-400">{passengers.map(p => p.seat_number).join(', ')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Valor Total</span>
                                        <span className="font-medium text-slate-700">R$ {totalSelecionado.toFixed(2)}</span>
                                    </div>
                                </div>

                                {useCredits && (
                                    <div className="flex justify-between items-center text-sm pt-2 border-t border-emerald-200/30">
                                        <span className="text-slate-500">Créditos Aplicados</span>
                                        <span className="font-bold text-emerald-600">- R$ {creditsToUse.toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="pt-2 border-t border-emerald-200/50 flex justify-between items-end">
                                    <span className="font-bold text-slate-700 dark:text-slate-200 uppercase text-[10px] tracking-widest mb-1">
                                        {isPartialPayment ? 'Entrada / Sinal' : 'Total a Pagar'}
                                    </span>
                                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                        R$ {entryValue.toFixed(2)}
                                    </span>
                                </div>

                                {isPartialPayment && (
                                    <p className="text-[10px] text-slate-400 italic text-right mt-1">
                                        Restante de R$ {Math.max(0, (totalSelecionado - creditsToUse) - entryValue).toFixed(2)} no embarque
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                            <div className="flex items-center gap-3 mb-2">
                                <ShieldCheck size={24} className="opacity-80" />
                                <p className="font-bold text-sm">Reserva 100% Segura</p>
                            </div>
                            <p className="text-[11px] text-blue-100 leading-relaxed">
                                Seus dados estão protegidos por criptografia. A SGTL não armazena dados de pagamento sensíveis.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
