import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import {
    ArrowLeft,
    Package,
    Truck,
    MapPin,
    User,
    Calendar,
    Clock,
    AlertCircle,
    CheckCircle2,
    Info,
    ChevronRight,
    Search,
    History,
    FileText,
    RefreshCcw
} from 'lucide-react';
import { authClient } from '../../lib/auth-client';

export const EncomendaDetalhesCliente: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const { formatDate } = useDateFormatter();

    useEffect(() => {
        fetchParcelDetails();
    }, [id]);

    const fetchParcelDetails = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/client/parcels/${id}`, {
                credentials: 'include'
            });

            if (response.status === 401) {
                navigate('/cliente/login');
                return;
            }

            if (!response.ok) {
                throw new Error('Encomenda não encontrada');
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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
                <RefreshCcw className="animate-spin text-blue-600 mb-4" size={32} />
                <p className="text-slate-500 font-medium anim-pulse">Buscando sua encomenda...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border border-red-100 dark:border-red-800 max-w-sm">
                    <p className="text-red-600 dark:text-red-400 font-bold mb-4">{error || 'Encomenda não encontrada'}</p>
                    <button
                        onClick={() => navigate('/cliente/dashboard')}
                        className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700 transition"
                    >
                        Voltar ao Início
                    </button>
                </div>
            </div>
        );
    }

    const parcel = data;
    const status = parcel.status;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col pb-10">
            {/* Header */}
            <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-4 sticky top-0 z-10">
                <div className="flex items-center gap-4 max-w-lg mx-auto">
                    <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-slate-500 hover:text-blue-600 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="font-bold text-slate-800 dark:text-white text-lg">Detalhes da Encomenda</h1>
                </div>
            </header>

            <main className="flex-1 max-w-lg mx-auto w-full p-4 space-y-6">

                {/* Tracking Code & Badge */}
                <div className="text-center space-y-3">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Código: {parcel.tracking_code}</p>
                    <div className="flex justify-center">
                        {(status === 'PENDING' || status === 'PENDENTE' || status === 'COLETADO') && (
                            <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold border border-blue-200 dark:border-blue-800">
                                <Package size={16} />
                                Coletado / Aguardando Saída
                            </div>
                        )}
                        {(status === 'IN_TRANSIT' || status === 'EM_TRANSITO') && (
                            <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold border border-amber-200 dark:border-amber-800">
                                <Truck size={16} className="animate-pulse" />
                                Em Trânsito para o Destino
                            </div>
                        )}
                        {(status === 'DELIVERED' || status === 'ENTREGUE') && (
                            <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 size={16} />
                                Encomenda Entregue
                            </div>
                        )}
                    </div>
                </div>

                {/* Tracking Progress Card */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-8">
                    <div className="relative">
                        {/* Timeline bar */}
                        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-700"></div>
                        <div className="absolute left-[11px] top-2 h-[40%] w-0.5 bg-blue-500"></div>

                        <div className="space-y-8 relative">
                            {/* Step 1 */}
                            <div className="flex gap-4">
                                <div className="w-6 h-6 rounded-full bg-blue-500 border-4 border-white dark:border-slate-800 shadow-sm z-10"></div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">Encomenda Registrada</p>
                                    <p className="text-xs text-slate-500">{formatDate(parcel.created_at || new Date())}</p>
                                </div>
                            </div>

                            {/* Step 2 (Simplified tracking for prototype) */}
                            <div className="flex gap-4">
                                <div className={`w-6 h-6 rounded-full border-4 border-white dark:border-slate-800 shadow-sm z-10 ${status !== 'PENDING' ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                                <div>
                                    <p className={`text-sm font-bold ${status !== 'PENDING' ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>Processamento Logístico</p>
                                    <p className="text-xs text-slate-500">{status === 'PENDING' ? 'Aguardando embarque' : 'Em processamento'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Packet & Delivery Details */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                            <Package size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-white">{parcel.description || 'Encomenda'}</p>
                            <p className="text-xs text-slate-500">{parcel.weight ? `${parcel.weight}kg` : 'Peso não informado'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-2 border-t border-slate-100 dark:border-slate-700">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-400">
                                <User size={14} />
                                <span className="text-[12px] font-bold uppercase tracking-wider">Remetente</span>
                            </div>
                            <p className="text-sm font-bold dark:text-white">{parcel.sender_name}</p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-400">
                                <MapPin size={14} />
                                <span className="text-[12px] font-bold uppercase tracking-wider">Origem</span>
                            </div>
                            <p className="text-sm font-bold dark:text-white">{parcel.origin_city}, {parcel.origin_state}</p>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-400">
                                <User size={14} />
                                <span className="text-[12px] font-bold uppercase tracking-wider">Destinatário</span>
                            </div>
                            <p className="text-sm font-bold dark:text-white">{parcel.recipient_name}</p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-400">
                                <MapPin size={14} />
                                <span className="text-[12px] font-bold uppercase tracking-wider">Destino</span>
                            </div>
                            <p className="text-sm font-bold dark:text-white">{parcel.destination_city}, {parcel.destination_state}</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <button className="flex items-center justify-center gap-2 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-700 dark:text-white transition-colors hover:bg-slate-50">
                        <History size={18} className="text-slate-400" />
                        Histórico
                    </button>
                    <button className="flex items-center justify-center gap-2 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-700 dark:text-white transition-colors hover:bg-slate-50">
                        <FileText size={18} className="text-slate-400" />
                        Minha NF
                    </button>
                </div>

                {/* Support Info */}
                <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500">
                    <Info size={20} className="text-blue-500 shrink-0" />
                    <p className="text-xs">
                        Algum problema com sua encomenda? {' '}
                        <button className="text-blue-600 font-bold hover:underline">Contate o Suporte Especializado</button>
                    </p>
                </div>

            </main>
        </div>
    );
};
