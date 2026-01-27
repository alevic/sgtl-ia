import React from 'react';
import { data as json } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData, useNavigate, useFetcher, Link } from "react-router";
import {
    Bus, Route, Users, Calendar, Clock, MapPin, DollarSign,
    ArrowLeft, CheckCircle2, XCircle, Printer, Share2,
    BadgeCheck, ShieldAlert, History, Map,
    ChevronRight, CreditCard, PieChart, UserPlus,
    Image as ImageIcon
} from 'lucide-react';
import { db } from "@/db/db.server";
import { trips as tripsTable, routes as routesTable, vehicle as vehicleTable, driver as driverTable, reservation as reservationTable } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/Layout/PageHeader';
import { DashboardCard } from '@/components/Layout/DashboardCard';
import { cn } from '@/lib/utils';
import { TripStatus } from '@/types';

export const loader = async ({ request, params }: { request: Request, params: { id?: string } }) => {
    const { id } = params;
    if (!id) throw new Response("ID não fornecido", { status: 400 });

    const trip = await db.query.trips.findFirst({
        where: eq(tripsTable.id, id),
        with: {
            route: true,
            vehicle: true,
            driver: true,
            reservations: {
                with: {
                    client: true
                }
            }
        }
    });

    if (!trip) throw new Response("Viagem não encontrada", { status: 404 });

    // Calculate revenue
    const revenue = trip.reservations.reduce((sum, res) => sum + Number(res.total_price), 0);

    return json({ trip, revenue });
};

export default function TripDetailPage() {
    const { trip, revenue } = useLoaderData<typeof loader>();
    const navigate = useNavigate();

    const occupation = (trip.reservations.length / (trip.vehicle?.capacidade_passageiros || 40)) * 100;

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <PageHeader
                title={trip.route?.name || "Detalhes da Escala"}
                subtitle="Gestão operacional e financeira da viagem"
                backLink="/admin/trips"
                rightElement={
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => window.print()} className="h-14 rounded-xl px-6 font-bold uppercase text-[12px] border-border/50"><Printer size={18} className="mr-2" /> Manifesto</Button>
                        <Button asChild className="h-14 rounded-xl px-8 bg-primary font-bold uppercase text-[12px] shadow-lg shadow-primary/20">
                            <Link to={`/admin/trips/${trip.id}/edit`}>EDITAR ESCALA</Link>
                        </Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <DashboardCard title="Ocupação" value={`${occupation.toFixed(1)}%`} icon={PieChart} variant="primary" />
                <DashboardCard title="Passageiros" value={trip.reservations.length} icon={Users} variant="blue" />
                <DashboardCard title="Vaga(s) Disponível" value={(trip.vehicle?.capacidade_passageiros || 40) - trip.reservations.length} icon={Bus} variant="amber" />
                <DashboardCard title="Receita Prevista" value={`R$ ${revenue.toFixed(2)}`} icon={DollarSign} variant="emerald" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Manifesto e Lista (8/12) */}
                <div className="lg:col-span-8 space-y-8">
                    <Card className="rounded-[32px] border-none shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
                        <div className="p-8 border-b border-border/50 flex items-center justify-between">
                            <h3 className="font-black uppercase text-[14px] tracking-widest flex items-center gap-2">
                                <Users size={18} className="text-primary" /> Manifesto de Passageiros
                            </h3>
                            <Button variant="ghost" className="rounded-xl h-10 font-bold text-[11px] uppercase" asChild>
                                <Link to="/admin/reservations/new"><UserPlus size={16} className="mr-2" /> Vender Ticket</Link>
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/30">
                                    <tr>
                                        <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Assento</th>
                                        <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Passageiro</th>
                                        <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                                        <th className="px-8 py-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ticket</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {trip.reservations.map((res: any) => (
                                        <tr key={res.id} className="hover:bg-muted/10 transition-colors">
                                            <td className="px-8 py-6">
                                                <Badge variant="outline" className="h-8 w-8 rounded-lg flex items-center justify-center font-black p-0 border-primary/20 bg-primary/5 text-primary">
                                                    {res.seat_number}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-6 font-bold">{res.passenger_name}</td>
                                            <td className="px-8 py-6">
                                                <Badge className="bg-emerald-500/10 text-emerald-500 border-none rounded-lg text-[10px] font-black uppercase">
                                                    {res.status}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-6 text-right font-mono text-[10px] font-bold text-muted-foreground">
                                                #{res.ticket_code || res.id.substring(0, 8)}
                                            </td>
                                        </tr>
                                    ))}
                                    {trip.reservations.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-20 text-center text-muted-foreground italic">
                                                Nenhum passageiro embarcado nesta escala.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Mapa de Trajeto Simplificado */}
                    <Card className="p-8 rounded-[32px] border-none shadow-xl bg-card/50 backdrop-blur-sm space-y-6">
                        <h3 className="font-black uppercase text-[14px] tracking-widest flex items-center gap-2">
                            <Map size={18} className="text-primary" /> Itinerário de Paradas
                        </h3>
                        <div className="space-y-8 relative pl-6 before:absolute before:left-[27px] before:top-4 before:bottom-4 before:w-0.5 before:bg-muted/50 before:border-dashed">
                            <div className="flex gap-4 relative">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-2 z-10" />
                                <div className="space-y-1">
                                    <p className="font-bold text-sm">{trip.route?.origin_city} - {trip.route?.origin_state}</p>
                                    <p className="text-[11px] text-muted-foreground font-black uppercase">Saída: {trip.departure_time}</p>
                                </div>
                            </div>
                            <div className="flex gap-4 relative">
                                <div className="w-2 h-2 rounded-full bg-destructive shrink-0 mt-2 z-10" />
                                <div className="space-y-1">
                                    <p className="font-bold text-sm">{trip.route?.destination_city} - {trip.route?.destination_state}</p>
                                    <p className="text-[11px] text-muted-foreground font-black uppercase">Chegada Prevista: {trip.arrival_time}</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Recursos e Logs (4/12) */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Veículo Alocado */}
                    <Card className="p-8 rounded-[32px] border-none shadow-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white space-y-6 relative overflow-hidden">
                        <Bus className="absolute -right-8 -bottom-8 w-40 h-40 opacity-10 rotate-12" />
                        <h3 className="text-[11px] font-black uppercase tracking-widest opacity-60">Recurso Atribuído</h3>
                        <div className="space-y-1">
                            <p className="text-3xl font-black uppercase tracking-tighter">{trip.vehicle?.placa || 'Sem Placa'}</p>
                            <p className="text-sm font-bold opacity-80">{trip.vehicle?.modelo || 'Veículo Não Alocado'}</p>
                        </div>
                        <div className="flex gap-2 pt-4 border-t border-white/10">
                            <Badge className="bg-white/10 text-white rounded-lg font-bold text-[10px] uppercase border-none">{trip.vehicle?.tipo || 'EXECUTIVO'}</Badge>
                            <Badge className="bg-white/10 text-white rounded-lg font-bold text-[10px] uppercase border-none">{trip.vehicle?.capacidade_passageiros || 40} Lugares</Badge>
                        </div>
                    </Card>

                    {/* Motorista Alocado */}
                    <Card className="p-8 rounded-[32px] border-none shadow-xl bg-card/50 backdrop-blur-sm space-y-6">
                        <h3 className="text-[12px] font-black uppercase tracking-widest text-muted-foreground">Tripulação</h3>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl">
                                {trip.driver?.nome?.charAt(0) || 'M'}
                            </div>
                            <div>
                                <p className="font-bold">{trip.driver?.nome || 'Não Atribuído'}</p>
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Cat. {trip.driver?.categoria_cnh || '---'}</p>
                            </div>
                        </div>
                        <Button asChild variant="outline" className="w-full h-14 rounded-xl font-bold uppercase text-[11px] tracking-widest border-border/50">
                            <Link to={`/admin/drivers/${trip.driver_id}`}>DETALHES DO MOTORISTA</Link>
                        </Button>
                    </Card>

                    {/* Observações Operacionais */}
                    <Card className="p-8 rounded-[32px] border-none shadow-xl bg-card/50 backdrop-blur-sm space-y-4">
                        <h3 className="text-[12px] font-black uppercase tracking-widest text-muted-foreground">Notas Internas</h3>
                        <div className="space-y-4">
                            {trip.baggage_limit && (
                                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Limite de Bagagem</h4>
                                    <p className="text-sm font-medium">{trip.baggage_limit}</p>
                                </div>
                            )}
                            {trip.alerts && (
                                <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1">
                                        <ShieldAlert size={12} /> Alerta Importante
                                    </h4>
                                    <p className="text-sm font-bold">{trip.alerts}</p>
                                </div>
                            )}
                            <div className="p-4 rounded-xl bg-muted/20">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Observações Gerais</h4>
                                <p className="text-sm italic text-muted-foreground leading-relaxed">
                                    {trip.observations || "Nenhuma observação operacional registrada para esta escala."}
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Galeria de Fotos da Viagem (Simulada se não houver) */}
                    {(trip.cover_image || ((trip.gallery as any)?.length > 0)) && (
                        <Card className="p-8 rounded-[32px] border-none shadow-xl bg-card/50 backdrop-blur-sm space-y-4">
                            <h3 className="text-[12px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <ImageIcon size={16} /> Galeria da Viagem
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {trip.cover_image && (
                                    <div className="aspect-video rounded-xl bg-muted overflow-hidden border border-border/50 group relative">
                                        <img src={trip.cover_image} alt="Capa" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Capa</span>
                                        </div>
                                    </div>
                                )}
                                {(trip.gallery as any)?.map((img: string, idx: number) => (
                                    <div key={idx} className="aspect-video rounded-xl bg-muted overflow-hidden border border-border/50">
                                        <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

