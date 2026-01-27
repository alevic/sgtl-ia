import React from 'react';
import { data as json } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData, useNavigate, useFetcher, Link } from "react-router";
import {
    Ticket, User, Bus, Calendar, DollarSign, Clock, MapPin,
    ArrowLeft, CheckCircle2, XCircle, Printer, Share2,
    CreditCard, BadgeCheck, ShieldAlert, History
} from 'lucide-react';
import { db } from "@/db/db.server";
import { reservation as reservationTable, trips as tripsTable, routes as routesTable, clients as clientsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/Layout/PageHeader';
import { cn } from '@/lib/utils';
import { ReservationStatus, ReservationStatusLabel } from '@/types';

export const loader = async ({ request, params }: { request: Request, params: { id?: string } }) => {
    const { id } = params;
    if (!id) throw new Response("ID não fornecido", { status: 400 });

    const reservation = await db.query.reservation.findFirst({
        where: eq(reservationTable.id, id),
        with: {
            trip: {
                with: {
                    route: true
                }
            },
            client: true
        }
    });

    if (!reservation) throw new Response("Reserva não encontrada", { status: 404 });

    return json({ reservation });
};

export const action = async ({ request, params }: { request: Request, params: { id?: string } }) => {
    const { id } = params;
    if (!id) return null;

    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "cancel") {
        await db.update(reservationTable).set({
            status: ReservationStatus.CANCELLED,
            updatedAt: new Date()
        } as any).where(eq(reservationTable.id, id));
        return json({ success: true });
    }

    return null;
};

export default function ReservationDetailPage() {
    const { reservation } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();
    const navigate = useNavigate();

    const statusConfigs: any = {
        [ReservationStatus.PENDING]: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Pendente' },
        [ReservationStatus.CONFIRMED]: { icon: BadgeCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Confirmada' },
        [ReservationStatus.CANCELLED]: { icon: ShieldAlert, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Cancelada' },
        [ReservationStatus.CHECKED_IN]: { icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Check-in Realizado' },
    };

    const config = statusConfigs[reservation.status] || statusConfigs[ReservationStatus.PENDING];
    const StatusIcon = config.icon;

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <PageHeader
                title={`Ticket #${reservation.ticket_code || reservation.id.substring(0, 8)}`}
                subtitle="Detalhes da reserva e status de embarque"
                backLink="/admin/reservations"
                rightElement={
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => window.print()} className="h-14 rounded-xl px-6 font-bold uppercase text-[12px]"><Printer size={18} className="mr-2" /> Imprimir</Button>
                        <Button variant="outline" className="h-14 rounded-xl px-4"><Share2 size={18} /></Button>
                        {reservation.status !== ReservationStatus.CANCELLED && (
                            <Button
                                variant="destructive"
                                onClick={() => fetcher.submit({ intent: "cancel" }, { method: "post" })}
                                className="h-14 rounded-xl px-8 font-bold uppercase text-[12px]"
                            >
                                CANCELAR RESERVA
                            </Button>
                        )}
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Visual do Ticket Digital (8/12) */}
                <div className="lg:col-span-8 space-y-8">
                    <Card className="rounded-[40px] overflow-hidden border-none shadow-2xl bg-gradient-to-br from-card to-muted/20 relative">
                        {/* Status Float */}
                        <div className={cn("absolute top-8 right-8 px-6 py-2 rounded-full flex items-center gap-2 font-black uppercase text-[12px] tracking-widest", config.bg, config.color)}>
                            <StatusIcon size={16} />
                            {config.label}
                        </div>

                        <div className="p-12 space-y-12">
                            {/* Header do Ticket */}
                            <div className="flex items-start gap-8">
                                <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Bus size={48} strokeWidth={1.5} />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-4xl font-black tracking-tighter uppercase">{reservation.trip?.route?.name || 'Viagem Operacional'}</h2>
                                    <p className="text-muted-foreground font-bold">{reservation.trip?.departure_date} • {reservation.trip?.departure_time}</p>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10 border-y border-border/50">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Passageiro</p>
                                    <p className="text-lg font-bold truncate">{reservation.passenger_name}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Documento</p>
                                    <p className="text-lg font-bold">{reservation.passenger_document || '---'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Assento</p>
                                    <p className="text-3xl font-black text-primary">{reservation.seat_number}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Valor</p>
                                    <p className="text-lg font-bold">R$ {Number(reservation.total_price).toFixed(2)}</p>
                                </div>
                            </div>

                            {/* Itinerário Simples */}
                            <div className="flex items-center gap-6">
                                <div className="flex-1 space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Origem
                                    </p>
                                    <p className="font-bold">{reservation.trip?.route?.origin_city || '---'}</p>
                                </div>
                                <ArrowLeft className="text-muted-foreground rotate-180" size={24} strokeWidth={1} />
                                <div className="flex-1 space-y-1 text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-end gap-1">
                                        Destino <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                                    </p>
                                    <p className="font-bold">{reservation.trip?.route?.destination_city || '---'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Serrilhado Fake Bottom */}
                        <div className="h-4 bg-muted/30 w-full flex gap-2 px-8 overflow-hidden">
                            {Array.from({ length: 30 }).map((_, i) => (
                                <div key={i} className="w-4 h-4 bg-background rounded-full -mt-2 shrink-0" />
                            ))}
                        </div>
                    </Card>

                    {/* Histórico/Timeline (Simulado) */}
                    <div className="space-y-4">
                        <h3 className="text-[12px] font-black uppercase tracking-widest text-muted-foreground ml-4 flex items-center gap-2">
                            <History size={16} /> Linha do Tempo
                        </h3>
                        <Card className="p-8 rounded-[32px] border-none shadow-xl space-y-8">
                            <div className="flex gap-6 relative">
                                <div className="w-1 h-full absolute left-3 top-2 bg-muted/50 rounded-full" />
                                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 z-10">
                                    <CheckCircle2 size={12} className="text-white" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-sm">Reserva Emitida</p>
                                    <p className="text-[11px] text-muted-foreground uppercase">{reservation.createdAt?.toLocaleString()}</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Sidebar (4/12) */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Financeiro */}
                    <Card className="p-8 rounded-[40px] border-none shadow-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[12px] font-black uppercase tracking-widest opacity-80">Pagamento</h3>
                            <CreditCard size={20} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium opacity-80">Total Pago</p>
                            <p className="text-4xl font-black">R$ {Number(reservation.total_price).toFixed(2)}</p>
                        </div>
                        <div className="pt-6 border-t border-white/20">
                            <Badge className="bg-white/20 hover:bg-white/30 text-white border-none rounded-lg px-4 py-1.5 font-bold text-[10px] uppercase">
                                LIQUIDADO EM CONTA
                            </Badge>
                        </div>
                    </Card>

                    {/* Cliente/Passageiro Rapido */}
                    <Card className="p-8 rounded-[40px] border-none shadow-2xl space-y-6">
                        <h3 className="text-[12px] font-black uppercase tracking-widest text-muted-foreground">Vínculo de Cliente</h3>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground font-black text-xl">
                                {reservation.client?.nome?.charAt(0) || 'P'}
                            </div>
                            <div>
                                <p className="font-bold">{reservation.client?.nome || reservation.passenger_name}</p>
                                <p className="text-xs text-muted-foreground truncate">{reservation.client?.email || 'Sem email cadastrado'}</p>
                            </div>
                        </div>
                        <Button asChild variant="outline" className="w-full h-14 rounded-xl font-bold uppercase text-[11px] tracking-widest border-border/50">
                            <Link to={`/admin/clients/${reservation.client_id}`}>VER PERFIL COMPLETO</Link>
                        </Button>
                    </Card>
                </div>
            </div>
        </div>
    );
}

