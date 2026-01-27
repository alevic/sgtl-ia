import React, { useState } from 'react';
import { data as json } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData, useNavigate, Link, useFetcher } from "react-router";
import { useDateFormatter } from '@/hooks/useDateFormatter';
import { EncomendaStatus, EncomendaStatusLabel, TipoEncomenda, TipoEncomendaLabel } from '@/types';
import {
    Package, Truck, Bus, MapPin, Calendar, TrendingUp, Check, Loader,
    Search, Plus, MoreHorizontal, Edit, Trash2, Clock, AlertTriangle, FileText
} from 'lucide-react';
import { db } from "@/db/db.server";
import { parcel as parcelTable } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/Layout/PageHeader';
import { DashboardCard } from '@/components/Layout/DashboardCard';
import { ListFilterSection } from '@/components/Layout/ListFilterSection';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

export const loader = async ({ request, params }: { request: Request, params: any }) => {
    const parcelsData = await db.select().from(parcelTable).orderBy(desc(parcelTable.createdAt));
    return json({ parcels: parcelsData });
};

export const action = async ({ request, params }: { request: Request, params: any }) => {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const id = formData.get("id") as string;

    if (intent === "delete") {
        await db.delete(parcelTable).where(eq(parcelTable.id, id));
        return json({ success: true, message: "Encomenda removida" });
    }

    return null;
};

const TipoTag: React.FC<{ tipo: string }> = ({ tipo }) => {
    const isBus = tipo === TipoEncomenda.BUS_CARGO;
    const Icon = isBus ? Bus : Truck;
    return (
        <Badge variant="outline" className={cn(
            "rounded-lg font-bold gap-1.5 px-2 py-0.5 border-none",
            isBus ? "bg-blue-500/10 text-blue-600" : "bg-orange-500/10 text-orange-600"
        )}>
            <Icon size={14} strokeWidth={2.5} />
            {isBus ? 'ÔNIBUS' : 'CAMINHÃO'}
        </Badge>
    );
};

const StatusBadge: React.FC<{ status: EncomendaStatus }> = ({ status }) => {
    const configs: Record<string, { className: string }> = {
        [EncomendaStatus.AWAITING]: { className: 'bg-slate-500/10 text-slate-600' },
        [EncomendaStatus.IN_TRANSIT]: { className: 'bg-blue-500/10 text-blue-600' },
        [EncomendaStatus.DELIVERED]: { className: 'bg-emerald-500/10 text-emerald-600' },
        [EncomendaStatus.RETURNED]: { className: 'bg-rose-500/10 text-rose-600' }
    };

    const config = configs[status] || configs[EncomendaStatus.AWAITING];

    return (
        <Badge variant="outline" className={cn('rounded-lg font-bold px-2 py-0.5 border-none uppercase tracking-tighter shadow-sm', config.className)}>
            {EncomendaStatusLabel[status] || (status as string)}
        </Badge>
    );
};

export default function ParcelsPage() {
    const { parcels: initialParcels } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();
    const navigate = useNavigate();
    const { formatDate } = useDateFormatter();
    const [busca, setBusca] = useState('');
    const [filtroTipo, setFiltroTipo] = useState<'TODOS' | string>('TODOS');
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const parcels = initialParcels as any[];

    // KPIs
    const total = parcels.length;
    const busCargo = parcels.filter(e => e.type === TipoEncomenda.BUS_CARGO).length;
    const truckFreight = parcels.filter(e => e.type === TipoEncomenda.TRUCK_FREIGHT).length;
    const inTransit = parcels.filter(e => e.status === EncomendaStatus.IN_TRANSIT).length;

    const filteredParcels = parcels.filter(e => {
        const matchesType = filtroTipo === 'TODOS' || e.type === filtroTipo;
        const matchesSearch = busca === '' ||
            (e.code || '').toLowerCase().includes(busca.toLowerCase()) ||
            (e.sender_name || '').toLowerCase().includes(busca.toLowerCase()) ||
            (e.recipient_name || '').toLowerCase().includes(busca.toLowerCase());
        return matchesType && matchesSearch;
    });

    return (
        <div key="parcels-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <PageHeader
                title="Gestão de Encomendas"
                subtitle="Logística híbrida e rastreamento em tempo real"
                icon={Package}
                rightElement={
                    <Button asChild className="h-14 px-6 rounded-xl font-semibold gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                        <Link to="/admin/parcels/new">
                            <Plus size={20} strokeWidth={2.5} />
                            NOVA ENCOMENDA
                        </Link>
                    </Button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <DashboardCard title="Total Encomendas" value={total} icon={Package} variant="primary" />
                <DashboardCard title="Carga Ônibus" value={busCargo} icon={Bus} variant="blue" />
                <DashboardCard title="Frete Caminhão" value={truckFreight} icon={Truck} variant="amber" />
                <DashboardCard title="Em Trânsito" value={inTransit} icon={TrendingUp} variant="emerald" />
            </div>

            <ListFilterSection>
                <div className="space-y-1.5 flex flex-col lg:col-span-2">
                    <label className="text-label-caps ml-1">Modalidade de Envio</label>
                    <Tabs value={filtroTipo} onValueChange={setFiltroTipo} className="w-full">
                        <TabsList className="bg-muted/40 p-1.5 rounded-xl h-14 flex w-full border border-border/50">
                            <TabsTrigger value="TODOS" className="flex-1 rounded-xl font-black text-[10px] tracking-widest">TODOS</TabsTrigger>
                            <TabsTrigger value={TipoEncomenda.BUS_CARGO} className="flex-1 rounded-xl font-black text-[10px] tracking-widest text-blue-600 gap-2"><Bus size={14} /> ÔNIBUS</TabsTrigger>
                            <TabsTrigger value={TipoEncomenda.TRUCK_FREIGHT} className="flex-1 rounded-xl font-black text-[10px] tracking-widest text-orange-600 gap-2"><Truck size={14} /> CAMINHÃO</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                <div className="space-y-1.5 flex flex-col lg:col-span-2">
                    <label className="text-label-caps ml-1">Buscar Logístico</label>
                    <div className="relative group flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                        <Input
                            placeholder="Código, remetente ou destinatário..."
                            className="pl-12 h-14 bg-muted/40 border-input rounded-xl font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary/20"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                        />
                    </div>
                </div>
            </ListFilterSection>

            <div className="grid gap-6">
                {filteredParcels.length === 0 ? (
                    <Card className="p-24 text-center bg-card/40 border-dashed rounded-[2.5rem]">
                        <Package size={64} className="mx-auto mb-6 text-muted-foreground/20" />
                        <p className="font-black text-muted-foreground uppercase tracking-widest text-sm">Nenhuma encomenda encontrada</p>
                    </Card>
                ) : (
                    filteredParcels.map((encomenda) => (
                        <Card key={encomenda.id} className="group shadow-xl bg-card/60 backdrop-blur-xl border border-border/40 rounded-[2.5rem] p-8 hover:border-primary/40 transition-all overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted/80">
                                            <MoreHorizontal size={20} />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 bg-card/95 backdrop-blur-md shadow-2xl border-none">
                                        <DropdownMenuItem asChild className="rounded-xl h-11 px-3 cursor-pointer"><Link to={`/admin/parcels/${encomenda.id}`} className="flex items-center gap-3 font-bold text-xs uppercase tracking-widest"><FileText size={16} /> Ver Detalhes</Link></DropdownMenuItem>
                                        <DropdownMenuItem className="rounded-xl h-11 px-3 cursor-pointer flex items-center gap-3 font-bold text-xs uppercase tracking-widest"><Edit size={16} /> Editar</DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-border/40 my-1" />
                                        <DropdownMenuItem onClick={() => setItemToDelete(encomenda.id)} className="rounded-xl h-11 px-3 cursor-pointer flex items-center gap-3 font-bold text-xs uppercase tracking-widest text-destructive focus:bg-destructive/10"><Trash2 size={16} /> Excluir</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="flex flex-col xl:flex-row justify-between gap-8 mb-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary transition-transform group-hover:scale-110 shadow-lg">
                                        <Package size={36} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black tracking-tighter leading-none mb-2 mb-2">{encomenda.code}</h3>
                                        <div className="flex flex-wrap gap-2">
                                            <TipoTag tipo={encomenda.type} />
                                            <StatusBadge status={encomenda.status} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col xl:items-end justify-center">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-60">VALOR DECLARADO</span>
                                    <div className="text-3xl font-black text-emerald-600 tracking-tighter">
                                        {encomenda.currency || 'R$'} {Number(encomenda.declared_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 bg-muted/20 border border-border/30 rounded-[2rem]">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60"><MapPin size={12} className="text-emerald-500" /> ORIGEM</div>
                                    <p className="font-black text-base uppercase tracking-tight">{encomenda.origin}</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60"><MapPin size={12} className="text-rose-500" /> DESTINO</div>
                                    <p className="font-black text-base uppercase tracking-tight">{encomenda.destination}</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60"><Calendar size={12} className="text-blue-500" /> PREVISÃO</div>
                                    <p className="font-black text-base uppercase tracking-tight">{encomenda.delivery_estimate ? formatDate(encomenda.delivery_estimate) : '--'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-8 px-4">
                                <div className="space-y-1"><span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">PESO</span><p className="font-bold text-sm">{encomenda.weight_kg} kg</p></div>
                                <div className="space-y-1"><span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">VOLUME</span><p className="font-bold text-sm tracking-tighter">{encomenda.volume_m3 ? `${encomenda.volume_m3} m³` : '--'}</p></div>
                                <div className="space-y-1"><span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">REMETENTE</span><p className="font-bold text-sm truncate uppercase">{encomenda.sender_name}</p></div>
                                <div className="space-y-1"><span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">DESTINATÁRIO</span><p className="font-bold text-sm truncate uppercase">{encomenda.recipient_name}</p></div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
                <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl bg-card/95 backdrop-blur-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter">Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription className="font-medium text-muted-foreground">
                            Tem certeza que deseja remover esta encomenda do sistema? Esta ação é definitiva e removerá todo o histórico de rastreamento.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel className="rounded-xl font-bold border-none bg-muted hover:bg-muted/80 h-12 px-6">CANCELAR</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (itemToDelete) {
                                    fetcher.submit({ intent: "delete", id: itemToDelete }, { method: "post" });
                                    setItemToDelete(null);
                                }
                            }}
                            className="rounded-xl font-black uppercase text-[10px] tracking-widest bg-destructive text-destructive-foreground hover:bg-destructive/90 h-12 px-8"
                        >
                            REMOVER ENCOMENDA
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
