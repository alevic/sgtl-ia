import React, { useState } from 'react';
import { data as json } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData, useNavigate, useFetcher, Link } from "react-router";
import {
    Bus, Truck, Gauge, Calendar, Wrench, History,
    Edit, Map, CheckCircle, AlertTriangle, Users,
    Clock, Loader2, FileText, ChevronRight
} from 'lucide-react';
import { db } from "@/db/db.server";
import {
    vehicle as vehicleTable,
    seat as seatTable,
    maintenance as maintenanceTable,
    trips as tripsTable
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from '@/components/Layout/PageHeader';
import { DashboardCard } from '@/components/Layout/DashboardCard';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { MapaAssentos } from '@/components/Veiculos/MapaAssentos';
import { cn } from '@/lib/utils';
import { VeiculoStatus, StatusManutencao } from '@/types';

export const loader = async ({ request, params }: { request: Request, params: { id?: string } }) => {
    const { id } = params;
    if (!id) throw new Response("ID não fornecido", { status: 400 });

    const vehicle = await db.query.vehicle.findFirst({
        where: eq(vehicleTable.id, id),
        with: {
            seats: true,
            maintenances: {
                orderBy: desc(maintenanceTable.scheduledDate)
            },
            trips: {
                orderBy: desc(tripsTable.departure_date),
                limit: 10,
                with: {
                    route: true
                }
            }
        }
    });

    if (!vehicle) throw new Response("Veículo não encontrado", { status: 404 });

    return json({ vehicle });
};

export default function VehicleDetailPage() {
    const { vehicle } = useLoaderData<typeof loader>();
    const [activeTab, setActiveTab] = useState('info');

    const isOnibus = vehicle.tipo === 'ONIBUS';

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <PageHeader
                title={vehicle.placa}
                subtitle={`${vehicle.modelo} ${vehicle.is_double_deck ? '• DOUBLE DECK' : ''}`}
                backLink="/admin/fleet"
                rightElement={
                    <div className="flex gap-3">
                        <Button variant="outline" asChild className="h-14 rounded-xl px-6 font-bold uppercase text-[12px] border-border/50">
                            <Link to={`/admin/fleet/edit/${vehicle.id}`}><Edit size={18} className="mr-2" /> Editar Ficha</Link>
                        </Button>
                        <Button className="h-14 rounded-xl px-8 bg-primary font-bold uppercase text-[12px] shadow-lg shadow-primary/20">
                            BAIXAR RELATÓRIO TÉCNICO
                        </Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <DashboardCard title="KM Atual" value={vehicle.km_atual?.toLocaleString() || "0"} icon={Gauge} variant="primary" />
                <DashboardCard title="Status" value={vehicle.status} icon={Clock} variant={vehicle.status === VeiculoStatus.ACTIVE ? "emerald" : "blue"} />
                <DashboardCard title="Capacidade" value={`${vehicle.capacidade_passageiros || 0} Lugares`} icon={Users} variant="blue" />
                <DashboardCard title="Próxima Revisão" value={`${(vehicle.km_atual || 0) + 10000} km`} icon={Wrench} variant="amber" />
            </div>

            <Tabs defaultValue="info" className="w-full">
                <Card className="rounded-[40px] border-none shadow-2xl bg-card/40 backdrop-blur-sm overflow-hidden">
                    <div className="px-8 pt-8">
                        <TabsList className="bg-muted/40 p-1.5 rounded-2xl h-14 flex w-fit border border-border/50">
                            <TabsTrigger value="info" className="px-8 rounded-xl font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-background">Informações</TabsTrigger>
                            {isOnibus && <TabsTrigger value="mapa" className="px-8 rounded-xl font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-background">Mapa Assentos</TabsTrigger>}
                            <TabsTrigger value="manutencao" className="px-8 rounded-xl font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-background">Manutenção</TabsTrigger>
                            <TabsTrigger value="historico" className="px-8 rounded-xl font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-background">Histórico</TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="p-8">
                        <TabsContent value="info" className="mt-0 space-y-10 animate-in fade-in duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <h3 className="text-[12px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <FileText size={16} className="text-primary" /> Ficha Técnica
                                    </h3>
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Chassi', value: (vehicle as any).chassi },
                                            { label: 'Renavam', value: (vehicle as any).renavam },
                                            { label: 'Ano Modelo', value: vehicle.ano },
                                            { label: 'Fabricante', value: 'MERCEDES-BENZ' }, // Mock
                                        ].map(item => (
                                            <div key={item.label} className="flex justify-between border-b border-border/30 pb-3">
                                                <span className="text-xs font-bold text-muted-foreground uppercase">{item.label}</span>
                                                <span className="text-sm font-black">{item.value || '---'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <h3 className="text-[12px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <CheckCircle size={16} className="text-primary" /> Equipamentos
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['Ar Condicionado', 'Wi-Fi', 'USB', 'Toilet', 'Monitor TV'].map(f => (
                                            <div key={f} className="p-4 rounded-2xl bg-muted/20 border border-border/30 text-[11px] font-bold uppercase flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                {f}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {isOnibus && (
                            <TabsContent value="mapa" className="mt-0 animate-in fade-in duration-500">
                                <MapaAssentos veiculo={vehicle as any} seats={vehicle.seats as any} onSave={() => { }} />
                            </TabsContent>
                        )}

                        <TabsContent value="manutencao" className="mt-0 animate-in fade-in duration-500">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="h-14 border-border/50">
                                        <TableHead className="px-6 text-[10px] font-black uppercase">Data</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase">Serviço</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase">KM</TableHead>
                                        <TableHead className="text-right px-6 text-[10px] font-black uppercase">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {vehicle.maintenances.map((m: any) => (
                                        <TableRow key={m.id} className="h-16 border-border/30 hover:bg-muted/10 transition-colors">
                                            <td className="px-6 text-sm font-bold">{m.scheduledDate}</td>
                                            <td className="text-sm font-black uppercase">{m.type} <span className="text-[10px] font-medium text-muted-foreground block">{m.description}</span></td>
                                            <td className="text-sm font-bold">{m.km_veiculo?.toLocaleString()} km</td>
                                            <td className="px-6 text-right"><Badge variant="outline" className="rounded-lg">{m.status}</Badge></td>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TabsContent>

                        <TabsContent value="historico" className="mt-0 animate-in fade-in duration-500">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="h-14 border-border/50">
                                        <TableHead className="px-6 text-[10px] font-black uppercase">Data</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase">Rota</TableHead>
                                        <TableHead className="text-right px-6 text-[10px] font-black uppercase">Ocupação</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {vehicle.trips.map((t: any) => (
                                        <TableRow key={t.id} className="h-16 border-border/30 hover:bg-muted/10 transition-colors">
                                            <td className="px-6 text-sm font-bold">{t.departure_date}</td>
                                            <td className="text-sm font-black uppercase">{t.route?.name}</td>
                                            <td className="px-6 text-right text-xs font-bold">100%</td>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TabsContent>
                    </div>
                </Card>
            </Tabs>
        </div>
    );
}
