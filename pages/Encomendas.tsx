import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IEncomenda, TipoEncomenda, Moeda } from '../types';
import { Package, Truck, Bus, MapPin, Calendar, TrendingUp, Check, Loader } from 'lucide-react';
import { parcelsService } from '../services/parcelsService';

const TipoTag: React.FC<{ tipo: TipoEncomenda }> = ({ tipo }) => {
    if (tipo === TipoEncomenda.CARGA_ONIBUS) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                <Bus size={14} />
                Carga Ônibus
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-semibold">
            <Truck size={14} />
            Frete Caminhão
        </span>
    );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const configs: any = {
        AGUARDANDO: { color: 'slate', label: 'Aguardando' },
        PENDING: { color: 'slate', label: 'Aguardando' },
        EM_TRANSITO: { color: 'blue', label: 'Em Trânsito' },
        IN_TRANSIT: { color: 'blue', label: 'Em Trânsito' },
        ENTREGUE: { color: 'green', label: 'Entregue' },
        DELIVERED: { color: 'green', label: 'Entregue' },
        DEVOLVIDA: { color: 'red', label: 'Devolvida' },
        RETURNED: { color: 'red', label: 'Devolvida' }
    };

    const config = configs[status] || configs['AGUARDANDO'];

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${config.color}-100 dark:bg-${config.color}-900/30 text-${config.color}-700 dark:text-${config.color}-300`}>
            {config.label}
        </span>
    );
};

export const Encomendas: React.FC = () => {
    const navigate = useNavigate();
    const [encomendas, setEncomendas] = useState<IEncomenda[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtroTipo, setFiltroTipo] = useState<'TODOS' | TipoEncomenda>('TODOS');

    useEffect(() => {
        loadEncomendas();
    }, []);

    const loadEncomendas = async () => {
        try {
            setLoading(true);
            const data = await parcelsService.getAll();
            setEncomendas(data);
        } catch (error) {
            console.error('Erro ao carregar encomendas:', error);
        } finally {
            setLoading(false);
        }
    };

    const encomendasFiltradas = filtroTipo === 'TODOS'
        ? encomendas
        : encomendas.filter(e => e.tipo === filtroTipo);

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
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Encomendas</h1>
                    <p className="text-slate-500 dark:text-slate-400">Logística híbrida: Ônibus e Caminhões</p>
                </div>
                <button
                    onClick={() => navigate('/admin/encomendas/nova')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    <Package size={18} />
                    Nova Encomenda
                </button>
            </div>

            {/* Filtros */}
            <div className="flex gap-2">
                <button
                    onClick={() => setFiltroTipo('TODOS')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filtroTipo === 'TODOS' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                >
                    Todos
                </button>
                <button
                    onClick={() => setFiltroTipo(TipoEncomenda.CARGA_ONIBUS)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${filtroTipo === TipoEncomenda.CARGA_ONIBUS ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                >
                    <Bus size={16} />
                    Carga Ônibus
                </button>
                <button
                    onClick={() => setFiltroTipo(TipoEncomenda.FRETE_CAMINHAO)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${filtroTipo === TipoEncomenda.FRETE_CAMINHAO ? 'bg-orange-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                >
                    <Truck size={16} />
                    Frete Caminhão
                </button>
            </div>

            {/* Lista de Encomendas */}
            <div className="grid gap-4">
                {encomendasFiltradas.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                        <Package size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">Nenhuma encomenda encontrada</p>
                    </div>
                ) : (
                    encomendasFiltradas.map((encomenda: any) => (
                        <div key={encomenda.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                                        <Package size={24} className="text-slate-600 dark:text-slate-300" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{encomenda.tracking_code || encomenda.codigo}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            {/* Default to CARGA_ONIBUS if not specified, or handle logic */}
                                            <TipoTag tipo={encomenda.trip_id ? TipoEncomenda.CARGA_ONIBUS : TipoEncomenda.FRETE_CAMINHAO} />
                                            <StatusBadge status={encomenda.status} />
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Valor Declarado</p>
                                    <p className="text-lg font-bold text-slate-800 dark:text-white">
                                        {encomenda.moeda || 'R$'} {Number(encomenda.price || encomenda.valor_declarado || 0).toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Origem</p>
                                    <div className="flex items-center gap-2">
                                        <MapPin size={16} className="text-green-600" />
                                        <p className="font-semibold text-slate-800 dark:text-white">{encomenda.origin_city} - {encomenda.origin_state}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Destino</p>
                                    <div className="flex items-center gap-2">
                                        <MapPin size={16} className="text-red-600" />
                                        <p className="font-semibold text-slate-800 dark:text-white">{encomenda.destination_city} - {encomenda.destination_state}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Previsão de Entrega</p>
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} className="text-blue-600" />
                                        <p className="font-semibold text-slate-800 dark:text-white">
                                            {encomenda.previsao_entrega ? new Date(encomenda.previsao_entrega).toLocaleDateString('pt-BR') : '--'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Peso</p>
                                    <p className="font-semibold text-slate-800 dark:text-white">{encomenda.weight} kg</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Volume</p>
                                    <p className="font-semibold text-slate-800 dark:text-white">{encomenda.dimensions || '--'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Remetente</p>
                                    <p className="font-semibold text-slate-800 dark:text-white">{encomenda.sender_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Destinatário</p>
                                    <p className="font-semibold text-slate-800 dark:text-white">{encomenda.recipient_name}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
