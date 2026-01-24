import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { IEncomenda, TipoEncomenda, Moeda, EncomendaStatus, EncomendaStatusLabel } from '../types';
import { Package, Truck, Bus, MapPin, Calendar, TrendingUp, Check, Loader, Search } from 'lucide-react';
import { parcelsService } from '../services/parcelsService';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { PageHeader } from '../components/Layout/PageHeader';
import { DashboardCard } from '../components/Layout/DashboardCard';
import { ListFilterSection } from '../components/Layout/ListFilterSection';
import { cn } from '../lib/utils';

const TipoTag: React.FC<{ tipo: TipoEncomenda }> = ({ tipo }) => {
    if (tipo === TipoEncomenda.BUS_CARGO || (tipo as any) === 'CARGA_ONIBUS') {
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

const StatusBadge: React.FC<{ status: EncomendaStatus }> = ({ status }) => {
    const configs: Record<string, { color: string }> = {
        [EncomendaStatus.AWAITING]: { color: 'slate' },
        [EncomendaStatus.IN_TRANSIT]: { color: 'blue' },
        [EncomendaStatus.DELIVERED]: { color: 'green' },
        [EncomendaStatus.RETURNED]: { color: 'red' },
        // Legacy fallbacks
        'AGUARDANDO': { color: 'slate' },
        'PENDING': { color: 'slate' },
        'EM_TRANSITO': { color: 'blue' },
        'ENTREGUE': { color: 'green' },
        'DEVOLVIDA': { color: 'red' }
    };

    const config = configs[status] || configs[EncomendaStatus.AWAITING];

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${config.color}-100 dark:bg-${config.color}-900/30 text-${config.color}-700 dark:text-${config.color}-300`}>
            {EncomendaStatusLabel[status] || (status as string)}
        </span>
    );
};

export const Encomendas: React.FC = () => {
    const navigate = useNavigate();
    const { formatDate } = useDateFormatter();
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

    // KPIs
    const total = encomendas.length;
    const busCargo = encomendas.filter(e => e.tipo === TipoEncomenda.BUS_CARGO || (e.tipo as any) === 'CARGA_ONIBUS').length;
    const truckFreight = encomendas.filter(e => e.tipo === TipoEncomenda.TRUCK_FREIGHT || (e.tipo as any) === 'FRETE_CAMINHAO').length;
    const inTransit = encomendas.filter(e => e.status === EncomendaStatus.IN_TRANSIT || (e.status as any) === 'EM_TRANSITO').length;

    return (
        <div key="encomendas-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header */}
            <PageHeader
                title="Gestão de Encomendas"
                subtitle="Logística híbrida: Ônibus e Caminhões"
                icon={Package}
                rightElement={
                    <Button
                        onClick={() => navigate('/admin/encomendas/nova')}
                        className="h-14 px-6 rounded-xl font-semibold gap-2 shadow-lg shadow-primary/20"
                    >
                        <Package size={20} />
                        NOVA ENCOMENDA
                    </Button>
                }
            />

            {/* Stat Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <DashboardCard
                    title="Total Encomendas"
                    value={total}
                    icon={Package}
                    variant="primary"
                />
                <DashboardCard
                    title="Carga Ônibus"
                    value={busCargo}
                    icon={Bus}
                    variant="blue"
                />
                <DashboardCard
                    title="Frete Caminhão"
                    value={truckFreight}
                    icon={Truck}
                    variant="amber"
                />
                <DashboardCard
                    title="Em Trânsito"
                    value={inTransit}
                    icon={TrendingUp}
                    variant="emerald"
                />
            </div>

            {/* Filters */}
            <ListFilterSection>
                <div className="space-y-1.5 flex flex-col lg:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80 ml-1">Modalidade de Envio</label>
                    <Tabs value={filtroTipo} onValueChange={(v: any) => setFiltroTipo(v)} className="w-full">
                        <TabsList className="bg-muted/40 p-1.5 rounded-xl h-14 flex w-full border border-border/50">
                            <TabsTrigger value="TODOS" className="flex-1 rounded-xl font-black text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm">TODOS</TabsTrigger>
                            <TabsTrigger value={TipoEncomenda.BUS_CARGO} className="flex-1 rounded-xl font-black text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm text-blue-600 gap-2">
                                <Bus size={14} /> ONIBUS
                            </TabsTrigger>
                            <TabsTrigger value={TipoEncomenda.TRUCK_FREIGHT} className="flex-1 rounded-xl font-black text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm text-amber-600 gap-2">
                                <Truck size={14} /> CAMINHAO
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </ListFilterSection>

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
                                    <div className="w-12 h-14 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                                        <Package size={24} className="text-slate-600 dark:text-slate-300" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{encomenda.tracking_code || encomenda.codigo}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            {/* Default to BUS_CARGO if not specified, or handle logic */}
                                            <TipoTag tipo={encomenda.trip_id ? TipoEncomenda.BUS_CARGO : TipoEncomenda.TRUCK_FREIGHT} />
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
                                            {encomenda.previsao_entrega ? formatDate(encomenda.previsao_entrega) : '--'}
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
