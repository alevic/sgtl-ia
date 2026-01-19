import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Ticket, Package, User, LogOut, Wallet, RefreshCcw, MapPin, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authClient } from '../../lib/auth-client';

export const DashboardCliente: React.FC = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/client/dashboard`, {
                credentials: 'include'
            });

            if (response.status === 401) {
                console.warn('[DASHBOARD] Unauthorized access, redirecting to login');
                navigate('/cliente/login');
                return;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('[DASHBOARD] Fetch error:', response.status, errorData);
                throw new Error(errorData.error || `Erro ao carregar dados do dashboard (Status: ${response.status})`);
            }

            const result = await response.json();
            console.log('[DASHBOARD] Data loaded successfully');
            setData(result);
        } catch (err: any) {
            console.error('[DASHBOARD] Catch block error:', err);
            setError(err.message || 'Erro inesperado ao carregar o dashboard');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        await authClient.signOut();
        navigate('/cliente/login');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
                <RefreshCcw className="animate-spin text-blue-600 mb-4" size={32} />
                <p className="text-slate-500 font-medium anim-pulse">Carregando seu portal...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border border-red-100 dark:border-red-800 max-w-sm">
                    <p className="text-red-600 dark:text-red-400 font-bold mb-4">{error}</p>
                    <button
                        onClick={fetchDashboardData}
                        className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700 transition"
                    >
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
                <RefreshCcw className="animate-spin text-blue-600 mb-4" size={32} />
                <p className="text-slate-500 font-medium anim-pulse">Processando seus dados...</p>
            </div>
        );
    }

    const { profile = {}, reservations = [], parcels = [] } = data;
    const nextTrip = reservations[0];
    const latestParcel = parcels[0];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
            {/* Mobile Header */}
            <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-4 sticky top-0 z-10">
                <div className="flex items-center justify-between max-w-lg mx-auto">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs font-bold">JJ</span>
                        </div>
                        <span className="font-bold text-slate-800 dark:text-white">Olá, {profile?.nome?.split(' ')[0]}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 max-w-lg mx-auto w-full p-4 space-y-6 pb-24">

                {/* Balance Card */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20">
                    <p className="text-blue-100 text-sm font-medium">Seu saldo de créditos</p>
                    <h2 className="text-3xl font-bold mt-1">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(profile?.saldo_creditos || 0)}
                    </h2>
                    <div className="mt-4 pt-4 border-t border-blue-500/30 flex justify-between items-center text-xs">
                        <span>Disponível para uso</span>
                        <button className="bg-white/20 px-3 py-1.5 rounded-full font-bold hover:bg-white/30 transition-colors">
                            Ver histórico
                        </button>
                    </div>
                </div>

                {/* Section Title: Próxima Viagem */}
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">Próxima Viagem</h3>
                    <button className="text-blue-600 text-sm font-bold">Ver todas</button>
                </div>

                {nextTrip ? (
                    <div
                        onClick={() => navigate(`/cliente/reservas/${nextTrip.id}`)}
                        className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer active:scale-[0.98] transition-all"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex flex-col gap-1">
                                <span className={`self-start px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${nextTrip.status === 'CONFIRMED' || nextTrip.status === 'CONFIRMADA'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                                    }`}>
                                    {nextTrip.status === 'CONFIRMED' || nextTrip.status === 'CONFIRMADA' ? 'Confirmada' :
                                        nextTrip.status === 'PENDING' || nextTrip.status === 'PENDENTE' ? 'Pendente' :
                                            nextTrip.status}
                                </span>
                                <p className="text-sm font-bold text-slate-800 dark:text-white mt-1">
                                    {nextTrip.trip_title}
                                </p>
                            </div>
                            <span className="text-slate-400 text-[10px] font-medium font-mono">#{nextTrip.ticket_code}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                                <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                                    {nextTrip.boarding_point || (() => {
                                        const stops = nextTrip.route_stops && (typeof nextTrip.route_stops === 'string' ? JSON.parse(nextTrip.route_stops) : nextTrip.route_stops);
                                        if (Array.isArray(stops) && stops.length > 0) return stops[0].nome;
                                        return nextTrip.origin_neighborhood
                                            ? `${nextTrip.origin_neighborhood}, ${nextTrip.origin_city}/${nextTrip.origin_state}`
                                            : nextTrip.origin_city ? `${nextTrip.origin_city}/${nextTrip.origin_state}` : 'Embarque';
                                    })()}
                                </p>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="w-8 h-[2px] bg-slate-200 dark:bg-slate-700"></div>
                                <span className="text-[10px]">🚌</span>
                            </div>
                            <div className="flex-1 text-right">
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Destino</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                                    {nextTrip.dropoff_point || (() => {
                                        const stops = nextTrip.route_stops && (typeof nextTrip.route_stops === 'string' ? JSON.parse(nextTrip.route_stops) : nextTrip.route_stops);
                                        if (Array.isArray(stops) && stops.length > 0) return stops[stops.length - 1].nome;
                                        return nextTrip.destination_neighborhood
                                            ? `${nextTrip.destination_neighborhood}, ${nextTrip.destination_city}/${nextTrip.destination_state}`
                                            : nextTrip.destination_city ? `${nextTrip.destination_city}/${nextTrip.destination_state}` : 'Destino';
                                    })()}
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-xs">💺</div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Reserva de Viagem</p>
                                    {nextTrip.seat_number && (
                                        <p className="text-[10px] text-blue-600 font-bold uppercase">
                                            Poltrona: {nextTrip.seat_number} - {nextTrip.seat_type}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <p className="text-sm font-bold text-blue-600">
                                {new Date(nextTrip.departure_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                {', '}
                                {nextTrip.departure_time?.slice(0, 5)}h
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-dashed border-slate-300 dark:border-slate-700 text-center">
                        <Calendar className="mx-auto text-slate-300 mb-2" size={32} />
                        <p className="text-slate-500 text-sm italic">Nenhuma viagem agendada no momento.</p>
                        <button
                            className="mt-4 text-blue-600 font-bold text-sm"
                            onClick={() => navigate('/viagens')}
                        >
                            Explorar Destinos →
                        </button>
                    </div>
                )}

                {/* Minhas Encomendas */}
                <div className="flex items-center justify-between mt-8">
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">Minhas Encomendas</h3>
                    <button className="text-blue-600 text-sm font-bold">Ver todas</button>
                </div>

                {latestParcel ? (
                    <div
                        onClick={() => navigate(`/cliente/encomendas/${latestParcel.id}`)}
                        className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 cursor-pointer active:scale-[0.98] transition-all"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
                                    <Package size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate max-w-[150px]">
                                        {latestParcel.description}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-medium truncate">
                                        Para: {latestParcel.recipient_name}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${latestParcel.status === 'DELIVERED'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                                    }`}>
                                    {latestParcel.status}
                                </span>
                                <p className="text-[10px] text-slate-400 mt-1">Cod: {latestParcel.tracking_code}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-dashed border-slate-300 dark:border-slate-700 text-center">
                        <Package className="mx-auto text-slate-300 mb-2" size={32} />
                        <p className="text-slate-500 text-sm italic">Nenhum pacote encontrado.</p>
                    </div>
                )}


                {/* Quick Actions */}
                <h3 className="font-bold text-slate-800 dark:text-white text-lg mt-8">Ações Rápidas</h3>
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => navigate('/viagens')}
                        className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-2 hover:bg-slate-50 transition-colors"
                    >
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
                            <Ticket size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Nova Viagem</span>
                    </button>
                    <button className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-2 hover:bg-slate-50 transition-colors">
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
                            <Package size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Nova Encomenda</span>
                    </button>

                </div>
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-3 flex justify-between items-center z-10 max-w-lg mx-auto shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                <button
                    onClick={() => navigate('/cliente/dashboard')}
                    className="flex flex-col items-center gap-1 text-blue-600"
                >
                    <LayoutDashboard size={24} />
                    <span className="text-[10px] font-bold">Início</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-500 transition-colors">
                    <Ticket size={24} />
                    <span className="text-[10px] font-bold">Viagens</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-500 transition-colors">
                    <Wallet size={24} />
                    <span className="text-[10px] font-bold">Extrato</span>
                </button>
                <button
                    onClick={() => navigate('/cliente/perfil')}
                    className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-500 transition-colors"
                >
                    <User size={24} />
                    <span className="text-[10px] font-bold">Perfil</span>
                </button>
            </nav>
        </div>
    );
};
