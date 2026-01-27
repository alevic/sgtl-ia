import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import {
    ArrowLeft,
    Calendar,
    Clock,
    MapPin,
    User,
    CreditCard,
    AlertCircle,
    QrCode,
    XCircle,
    CheckCircle2,
    Info,
    ChevronRight,
    Map,
    RefreshCcw
} from 'lucide-react';
import { authClient } from '../../lib/auth-client';

export const ReservaDetalhesCliente: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCancelModal, setShowCancelModal] = useState(false);
    const { formatDate } = useDateFormatter();

    useEffect(() => {
        fetchReservaDetails();
    }, [id]);

    const fetchReservaDetails = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/client/reservations/${id}`, {
                credentials: 'include'
            });

            if (response.status === 401) {
                navigate('/cliente/login');
                return;
            }

            if (!response.ok) {
                throw new Error('Reserva não encontrada');
            }

            const result = await response.json();
            setData(result);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = async () => {
        // TODO: Implementar cancelamento real via API
        setError('Funcionalidade de cancelamento será implementada em breve.');
        setShowCancelModal(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
                <RefreshCcw className="animate-spin text-blue-600 mb-4" size={32} />
                <p className="text-slate-500 font-medium anim-pulse">Buscando sua reserva...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-sm border border-red-100 dark:border-red-800 max-w-sm">
                    <p className="text-red-600 dark:text-red-400 font-bold mb-4">{error || 'Reserva não encontrada'}</p>
                    <button
                        onClick={() => navigate('/cliente/dashboard')}
                        className="bg-red-600 text-white px-6 py-2 rounded-sm font-bold hover:bg-red-700 transition"
                    >
                        Voltar ao Início
                    </button>
                </div>
            </div>
        );
    }

    const reservation = data;
    const status = reservation.status;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col pb-10">
            {/* Header */}
            <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-4 sticky top-0 z-10">
                <div className="flex items-center gap-4 max-w-lg mx-auto">
                    <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-slate-500 hover:text-blue-600 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="font-bold text-slate-800 dark:text-white text-lg">Detalhes da Reserva</h1>
                </div>
            </header>

            <main className="flex-1 max-w-lg mx-auto w-full p-4 space-y-6">

                {/* Status Badge */}
                <div className="flex justify-center">
                    {(status === 'PENDENTE' || status === 'PENDING') && (
                        <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold border border-amber-200 dark:border-amber-800">
                            <Clock size={16} />
                            Aguardando Pagamento
                        </div>
                    )}
                    {(status === 'CONFIRMADA' || status === 'CONFIRMED') && (
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 size={16} />
                            Reserva Confirmada
                        </div>
                    )}
                    {status === 'CANCELADA' && (
                        <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold border border-red-200 dark:border-red-800">
                            <XCircle size={16} />
                            Reserva Cancelada
                        </div>
                    )}
                </div>

                {/* Ticket/QR Card */}
                <div className={`bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden ${status === 'CANCELADA' ? 'opacity-60 grayscale' : ''}`}>
                    <div className="p-6 text-center border-b border-dashed border-slate-200 dark:border-slate-700 relative">
                        {/* Decorative side cuts */}
                        <div className="absolute -left-3 top-full -translate-y-1/2 w-6 h-6 bg-slate-50 dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-700"></div>
                        <div className="absolute -right-3 top-full -translate-y-1/2 w-6 h-6 bg-slate-50 dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-700"></div>

                        {(status === 'PENDENTE' || status === 'PENDING') ? (
                            <div className="py-4 space-y-4">
                                <div className="w-24 h-24 mx-auto bg-slate-100 dark:bg-slate-900 rounded-sm flex items-center justify-center text-slate-300">
                                    <QrCode size={48} />
                                </div>
                                <p className="text-sm text-slate-500 px-8">Pague para liberar seu QR Code de embarque.</p>
                                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all">
                                    <CreditCard size={20} />
                                    Pagar R$ {reservation.price?.toFixed(2)}
                                </button>
                            </div>
                        ) : (status === 'CONFIRMADA' || status === 'CONFIRMED') ? (
                            <div className="py-4 space-y-4">
                                <div className="p-4 bg-white rounded-sm inline-block shadow-inner ring-1 ring-slate-100">
                                    <div className="w-32 h-32 bg-slate-900 flex items-center justify-center text-white">
                                        <QrCode size={96} />
                                    </div>
                                </div>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">Apresente no Embarque</p>
                                <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">RESERVA: {reservation.ticket_code}</p>
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <AlertCircle size={48} className="mx-auto text-slate-300 mb-2" />
                                <p className="text-slate-400 font-bold italic">Processando Reserva</p>
                                <p className="text-xs text-slate-400">Verifique novamente em instantes</p>
                            </div>
                        )}
                    </div>

                    <div className="px-6 pt-4 pb-2 border-b border-slate-100 dark:border-slate-700">
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Viagem</p>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                            {reservation.trip_title}
                        </h2>
                    </div>

                    {/* Trip Info Section */}
                    <div className="p-6 space-y-6">
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex flex-col items-center gap-1 mt-1">
                                    <div className="w-3 h-3 rounded-full bg-blue-600 ring-4 ring-blue-500/20"></div>
                                    <div className="w-0.5 h-10 bg-slate-200 dark:bg-slate-700 border-dashed border-l"></div>
                                    <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20"></div>
                                </div>
                                <div className="flex-1 space-y-8">
                                    <div>
                                        <p className="text-[12px] font-bold text-slate-400 uppercase">Origem</p>
                                        <p className="font-bold text-slate-800 dark:text-white leading-tight">
                                            {reservation.boarding_point || (() => {
                                                const stops = reservation.route_stops && (typeof reservation.route_stops === 'string' ? JSON.parse(reservation.route_stops) : reservation.route_stops);
                                                if (Array.isArray(stops) && stops.length > 0) return stops[0].nome;
                                                return reservation.origin_neighborhood
                                                    ? `${reservation.origin_neighborhood}, ${reservation.origin_city}/${reservation.origin_state}`
                                                    : `${reservation.origin_city}/${reservation.origin_state}`;
                                            })()}
                                        </p>
                                        <p className="text-xs text-slate-500">Local de Embarque</p>
                                    </div>
                                    <div>
                                        <p className="text-[12px] font-bold text-slate-400 uppercase">Destino</p>
                                        <p className="font-bold text-slate-800 dark:text-white leading-tight">
                                            {reservation.dropoff_point || (() => {
                                                const stops = reservation.route_stops && (typeof reservation.route_stops === 'string' ? JSON.parse(reservation.route_stops) : reservation.route_stops);
                                                if (Array.isArray(stops) && stops.length > 0) return stops[stops.length - 1].nome;
                                                return reservation.destination_neighborhood
                                                    ? `${reservation.destination_neighborhood}, ${reservation.destination_city}/${reservation.destination_state}`
                                                    : `${reservation.destination_city}/${reservation.destination_state}`;
                                            })()}
                                        </p>
                                        <p className="text-xs text-slate-500">Local de Desembarque</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-sm border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2 text-slate-400 mb-1">
                                    <Calendar size={14} />
                                    <span className="text-[12px] font-bold uppercase">Data</span>
                                </div>
                                <p className="text-sm font-bold dark:text-white">
                                    {formatDate(reservation.departure_date, 'dd MMM yyyy')}
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-sm border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2 text-slate-400 mb-1">
                                    <Clock size={14} />
                                    <span className="text-[12px] font-bold uppercase">Horário</span>
                                </div>
                                <p className="text-sm font-bold dark:text-white">{reservation.departure_time?.slice(0, 5)}h</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Passenger Info Card */}
                <div className="bg-white dark:bg-slate-800 rounded-sm p-4 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                        <User size={18} className="text-slate-400" />
                        Informações do Passageiro
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Nome:</span>
                            <span className="font-bold dark:text-white">{reservation.passenger_name}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Poltrona:</span>
                            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 px-2 py-0.5 rounded text-xs font-bold">
                                {reservation.seat_number || 'Não def.'} {reservation.seat_type ? `- ${reservation.seat_type}` : ''}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Documento:</span>
                            <span className="font-bold dark:text-white">{reservation.passenger_document}</span>
                        </div>
                    </div>
                </div>

                {/* Tracking/Map Placeholder */}
                <button className="w-full bg-white dark:bg-slate-800 p-4 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-sm flex items-center justify-center">
                            <Map size={24} />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold text-slate-800 dark:text-white">Rastrear Ônibus</p>
                            <p className="text-xs text-slate-500">Veja a localização em tempo real</p>
                        </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-300" />
                </button>

                {/* Help/Support */}
                <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-sm text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
                    <Info size={20} />
                    <p className="text-xs font-medium">Dúvidas sobre o embarque? <button className="font-bold underline">Falar com a JJê no WhatsApp</button></p>
                </div>

                {/* Cancel Action */}
                {status !== 'CANCELADA' && (
                    <div className="pt-4 text-center">
                        <button
                            onClick={() => setShowCancelModal(true)}
                            className="text-red-500 text-sm font-bold hover:text-red-600 transition-colors flex items-center justify-center gap-2 mx-auto"
                        >
                            <XCircle size={18} />
                            Cancelar Reserva
                        </button>
                    </div>
                )}
            </main>

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60  " onClick={() => setShowCancelModal(false)}></div>
                    <div className="bg-white dark:bg-slate-800 rounded-sm p-6 max-w-sm w-full relative shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-sm flex items-center justify-center mb-6 mx-auto">
                            <AlertCircle size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-center text-slate-800 dark:text-white mb-2">Confirmar Cancelamento?</h2>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-sm mb-6 space-y-2">
                            <p className="text-sm text-slate-600 dark:text-slate-400">Política da JJê Turismo:</p>
                            <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4">
                                <li>O crédito cai na sua conta em instantes.</li>
                                <li>Válido por 12 meses para qualquer destino.</li>
                            </ul>
                        </div>
                        <div className="space-y-3">
                            <button
                                onClick={handleCancel}
                                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-sm transition-all shadow-lg shadow-red-500/20"
                            >
                                Sim, Cancelar e Gerar Crédito
                            </button>
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="w-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3.5 rounded-sm transition-all"
                            >
                                Não, Voltar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
