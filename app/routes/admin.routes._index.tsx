import React, { useState } from 'react';
import { data as json } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData, useNavigate, Link, useFetcher } from "react-router";
import { IRota, RouteType, RouteTypeLabel } from '@/types';
import {
    Plus, Search, Route as RouteIcon, Filter, Edit, Copy,
    ToggleLeft, ToggleRight, Trash2, Loader, MapPin,
    ChevronRight, MoreHorizontal, MousePointer2, Settings2,
    ArrowRightLeft, MapPinned, Gauge, ChevronLeft, AlertTriangle
} from 'lucide-react';

import { db } from "@/db/db.server";
import { routes as routeTable } from "@/db/schema";

import { desc, eq } from "drizzle-orm";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/Layout/PageHeader";
import { DashboardCard } from "@/components/Layout/DashboardCard";
import { ListFilterSection } from "@/components/Layout/ListFilterSection";
import { cn } from "@/lib/utils";

export const loader = async ({ request, params }: { request: Request, params: any }) => {
    const routesData = await db.select().from(routeTable).orderBy(desc(routeTable.createdAt));
    return json({ routes: routesData });
};

export const action = async ({ request, params }: { request: Request, params: any }) => {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const id = formData.get("id") as string;

    if (intent === "delete") {
        await db.delete(routeTable).where(eq(routeTable.id, id));
        return json({ success: true, message: "Rota excluída" });
    }

    if (intent === "toggle-status") {
        const currentStatus = formData.get("status") === "true";
        await db.update(routeTable).set({
            active: !currentStatus,
            updatedAt: new Date()
        } as any).where(eq(routeTable.id, id));
        return json({ success: true });
    }

    return null;
};

export default function RoutesPage() {
    const { routes: initialRoutes } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();
    const navigate = useNavigate();
    const [busca, setBusca] = useState('');
    const [filtroTipo, setFiltroTipo] = useState<'TODOS' | string>('TODOS');
    const [statusTab, setStatusTab] = useState<'TODOS' | 'ATIVA' | 'INATIVA'>('TODOS');

    const routes = initialRoutes as any[];

    const rotasFiltradas = routes.filter(rota => {
        const matchBusca = busca === '' || (rota.name || '').toLowerCase().includes(busca.toLowerCase());
        const matchTipo = filtroTipo === 'TODOS' || rota.type === filtroTipo;
        const matchStatus = statusTab === 'TODOS' || (statusTab === 'ATIVA' && rota.active) || (statusTab === 'INATIVA' && !rota.active);
        return matchBusca && matchTipo && matchStatus;
    });

    return (
        <div key="routes-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <PageHeader
                title="Gerenciamento de Rotas"
                subtitle="Configuração de itinerários e percursos"
                icon={MapPinned}
                rightElement={
                    <Button asChild className="h-14 px-6 rounded-xl font-semibold shadow-lg shadow-primary/20">
                        <Link to="/admin/routes/new">
                            <Plus size={20} className="mr-2" strokeWidth={2.5} /> NOVA ROTA
                        </Link>
                    </Button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <DashboardCard title="Total de Rotas" value={routes.length} icon={RouteIcon} variant="primary" />
                <DashboardCard title="Rotas Ativas" value={routes.filter(r => r.active).length} icon={MapPin} variant="emerald" />
                <DashboardCard title="Performance" value="98%" icon={Gauge} variant="blue" />
                <DashboardCard title="Inativas" value={routes.filter(r => !r.active).length} icon={AlertTriangle} variant="amber" />
            </div>

            <ListFilterSection className="lg:grid-cols-3">
                <div className="space-y-1.5 flex flex-col">
                    <label className="text-label-caps ml-1">Buscar Rota</label>
                    <div className="relative group flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input placeholder="Nome da rota..." className="pl-12 h-14 bg-muted/40 border-input rounded-xl font-bold" value={busca} onChange={(e) => setBusca(e.target.value)} />
                    </div>
                </div>

                <div className="space-y-1.5 flex flex-col">
                    <label className="text-label-caps ml-1">Tipo de Trajeto</label>
                    <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                        <SelectTrigger className="h-14 w-full bg-muted/40 border-input rounded-xl font-bold">
                            <SelectValue placeholder="Tipo de Rota" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl bg-card/95 backdrop-blur-md">
                            <SelectItem value="TODOS">Todos os Tipos</SelectItem>
                            <SelectItem value="OUTBOUND">Ida (Outbound)</SelectItem>
                            <SelectItem value="INBOUND">Volta (Inbound)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5 flex flex-col">
                    <label className="text-label-caps ml-1">Visibilidade</label>
                    <Tabs value={statusTab} onValueChange={(v) => setStatusTab(v as any)} className="w-full">
                        <TabsList className="bg-muted/40 p-1.5 rounded-xl h-14 flex w-full border border-border/50">
                            <TabsTrigger value="TODOS" className="flex-1 rounded-xl px-4 font-black text-[10px] tracking-widest">TODAS</TabsTrigger>
                            <TabsTrigger value="ATIVA" className="flex-1 rounded-xl px-4 font-black text-[10px] tracking-widest">ATIVAS</TabsTrigger>
                            <TabsTrigger value="INATIVA" className="flex-1 rounded-xl px-4 font-black text-[10px] tracking-widest">INATIVAS</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </ListFilterSection>

            <Card className="shadow-2xl shadow-muted/20 overflow-hidden rounded-[2.5rem] bg-card/50 backdrop-blur-sm">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="pl-8 h-14 text-table-head">Identificação</TableHead>
                            <TableHead className="h-14 text-table-head">Tipo</TableHead>
                            <TableHead className="h-14 text-table-head text-center">Status</TableHead>
                            <TableHead className="pr-8 text-right h-14 text-table-head">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rotasFiltradas.map((rota) => (
                            <TableRow key={rota.id} className="group hover:bg-muted/20 border-border/30 transition-colors h-24">
                                <TableCell className="pl-8">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("w-12 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg", rota.active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground')}><RouteIcon size={20} strokeWidth={2.5} /></div>
                                        <div>
                                            <p className="font-semibold text-foreground text-base leading-none mb-1 group-hover:text-primary transition-colors">{rota.name || 'Rota sem nome'}</p>
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">ID: {rota.id.substring(0, 8)}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell><Badge variant="outline" className={cn("rounded-xl font-semibold text-[12px] px-3 py-1 uppercase tracking-tighter shadow-sm", rota.type === 'OUTBOUND' ? 'bg-blue-500/10 text-blue-600' : 'bg-orange-500/10 text-orange-600')}>{rota.type}</Badge></TableCell>
                                <TableCell className="text-center"><Badge className={cn("rounded-full font-semibold text-[12px] uppercase px-3 py-1 shadow-lg", rota.active ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-muted-foreground/20 text-muted-foreground shadow-none')}>{rota.active ? 'Ativa' : 'Inativa'}</Badge></TableCell>
                                <TableCell className="pr-8 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button asChild variant="ghost" size="icon" className="rounded-xl hover:bg-muted/80 h-9 w-9"><Link to={`/admin/routes/${rota.id}/edit`}><Edit size={16} /></Link></Button>
                                        <Button variant="ghost" size="icon" onClick={() => fetcher.submit({ intent: "toggle-status", id: rota.id, status: rota.active }, { method: "post" })} className="rounded-xl hover:bg-muted/80 h-9 w-9">{rota.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}</Button>
                                        <Button variant="ghost" size="icon" onClick={() => fetcher.submit({ intent: "delete", id: rota.id }, { method: "post" })} className="rounded-xl h-9 w-9 text-destructive"><Trash2 size={16} /></Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );

}
