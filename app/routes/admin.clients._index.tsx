import React, { useState, useEffect } from 'react';
import { data as json } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData, useNavigate, Link, useFetcher } from "react-router";
import { ICliente, TipoCliente, TipoDocumento } from '@/types';
import {
    Users, Search, Filter, UserPlus, Star, TrendingUp,
    Phone, Mail, MapPin, Calendar, Award, Tag, ChevronRight, MoreHorizontal
} from 'lucide-react';
import { db } from "@/db/db.server";
import { clients as clientsTable } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { ClientActions } from '@/components/CRM/ClientActions';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from '@/components/Layout/PageHeader';
import { DashboardCard } from '@/components/Layout/DashboardCard';
import { ListFilterSection } from '@/components/Layout/ListFilterSection';
import { cn } from "@/lib/utils";

export const loader = async ({ request, params }: { request: Request, params: any }) => {
    const clientsData = await db.select().from(clientsTable).orderBy(desc(clientsTable.createdAt));
    return json({
        clients: clientsData
    });
};

export const action = async ({ request, params }: { request: Request, params: any }) => {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const id = formData.get("id") as string;

    if (intent === "delete") {
        await db.delete(clientsTable).where(eq(clientsTable.id, id));
        return json({ success: true, message: "Cliente excluído" });
    }

    return null;
};

const SegmentoBadge: React.FC<{ segmento: string }> = ({ segmento }) => {
    const configs: any = {
        VIP: { color: 'purple', icon: Star, label: 'VIP', class: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/20' },
        REGULAR: { color: 'blue', icon: Users, label: 'Regular', class: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20' },
        NOVO: { color: 'green', icon: UserPlus, label: 'Novo', class: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
        INATIVO: { color: 'slate', icon: Users, label: 'Inativo', class: 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/20' }
    };

    const config = configs[segmento] || configs.REGULAR;
    const Icon = config.icon;

    return (
        <Badge variant="outline" className={cn("flex items-center gap-1 font-bold px-2 py-0.5 rounded-full", config.class)}>
            <Icon size={12} />
            {config.label}
        </Badge>
    );
};

export default function ClientsPage() {
    const { clients: initialClients } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();
    const [filtroSegmento, setFiltroSegmento] = useState<'TODOS' | string>('TODOS');
    const [busca, setBusca] = useState('');
    const navigate = useNavigate();

    const clients = (initialClients as any[]).map(c => ({
        ...c,
        saldo_creditos: Number(c.saldo_creditos || 0),
        valor_total_gasto: Number(c.valor_total_gasto || 0)
    })) as ICliente[];

    const clientsFiltrados = clients.filter(c => {
        const matchSegmento = filtroSegmento === 'TODOS' || c.segmento === filtroSegmento;
        const matchBusca = busca === '' ||
            c.nome.toLowerCase().includes(busca.toLowerCase()) ||
            c.email.toLowerCase().includes(busca.toLowerCase()) ||
            (c.documento || '').includes(busca) ||
            c.telefone?.includes(busca);
        return matchSegmento && matchBusca;
    });

    const totalClients = clients.length;
    const clientsVIP = clients.filter(c => c.segmento === 'VIP').length;
    const totalViagens = clients.reduce((sum, c) => sum + (c.historico_viagens || 0), 0);
    const valorTotal = clients.reduce((sum, c) => sum + Number(c.valor_total_gasto || 0), 0);

    return (
        <div key="clients-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <PageHeader
                title="Gestão de Clientes (CRM)"
                subtitle="Relacionamento e fidelização de passageiros"
                icon={Users}
                rightElement={
                    <Button asChild className="h-14 px-6 rounded-xl font-semibold gap-2 shadow-lg shadow-primary/20">
                        <Link to="/admin/clients/new">
                            <UserPlus size={20} strokeWidth={2.5} />
                            NOVO CLIENTE
                        </Link>
                    </Button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <DashboardCard title="Total de Clientes" value={totalClients} icon={Users} variant="primary" />
                <DashboardCard title="Clientes VIP" value={clientsVIP} icon={Star} variant="purple" />
                <DashboardCard title="Total de Viagens" value={totalViagens} icon={TrendingUp} variant="blue" />
                <DashboardCard title="Receita Total" value={`R$ ${Math.round(valorTotal / 1000)}k`} icon={Award} variant="emerald" />
            </div>

            <ListFilterSection>
                <div className="space-y-1.5 flex flex-col lg:col-span-2">
                    <label className="text-label-caps ml-1">Buscar Cliente</label>
                    <div className="relative group flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                        <Input
                            placeholder="Nome, email, documento..."
                            className="pl-12 h-14 bg-muted/40 border-input rounded-xl font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary/20"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-1.5 flex flex-col lg:col-span-2">
                    <label className="text-label-caps ml-1">Segmento do Cliente</label>
                    <Tabs value={filtroSegmento} onValueChange={setFiltroSegmento} className="w-full">
                        <TabsList className="bg-muted/40 p-1.5 rounded-xl h-14 flex w-full border border-border/50">
                            <TabsTrigger value="TODOS" className="flex-1 rounded-xl px-2 font-black text-[10px] tracking-widest">TODOS</TabsTrigger>
                            <TabsTrigger value="VIP" className="flex-1 rounded-xl px-2 font-black text-[10px] tracking-widest text-purple-600">VIP</TabsTrigger>
                            <TabsTrigger value="REGULAR" className="flex-1 rounded-xl px-2 font-black text-[10px] tracking-widest text-blue-600">REGULAR</TabsTrigger>
                            <TabsTrigger value="NOVO" className="flex-1 rounded-xl px-2 font-black text-[10px] tracking-widest text-emerald-600">NOVOS</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </ListFilterSection>

            <Card className="shadow-2xl shadow-muted/20 overflow-hidden rounded-[2.5rem] bg-card/50 backdrop-blur-sm">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="pl-8 h-14 text-table-head">Cliente</TableHead>
                            <TableHead className="h-14 text-table-head">Contato</TableHead>
                            <TableHead className="h-14 text-table-head text-center">Segmento</TableHead>
                            <TableHead className="h-14 text-table-head text-center">Viagens</TableHead>
                            <TableHead className="h-14 text-table-head text-right">Receita</TableHead>
                            <TableHead className="pr-8 text-right h-14 text-table-head">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clientsFiltrados.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-96 text-center border-none">
                                    <div className="flex flex-col items-center justify-center gap-4 py-20 grayscale opacity-40">
                                        <Users size={48} />
                                        <p className="text-lg font-bold">Nenhum cliente encontrado</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            clientsFiltrados.map((cliente) => (
                                <TableRow key={cliente.id} className="group hover:bg-muted/20 border-border/30 transition-colors">
                                    <TableCell className="pl-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border-2 border-background shadow-sm ring-1 ring-primary/10">
                                                <AvatarFallback className="bg-gradient-to-br from-primary/10 to-purple-600/10 text-primary text-sm font-semibold">
                                                    {cliente.nome.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <Link to={`/admin/clients/${cliente.id}`} className="font-bold text-sm hover:text-primary transition-colors">{cliente.nome}</Link>
                                                <p className="text-xs text-muted-foreground">{cliente.documento || 'Sem documento'}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5">
                                        <div className="space-y-1 text-xs">
                                            <div className="flex items-center gap-2 font-medium truncate max-w-[200px]"><Mail size={12} className="text-blue-600" /> {cliente.email}</div>
                                            {cliente.telefone && <div className="flex items-center gap-2 text-muted-foreground"><Phone size={12} className="text-emerald-600" /> {cliente.telefone}</div>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center py-5"><SegmentoBadge segmento={cliente.segmento} /></TableCell>
                                    <TableCell className="text-center py-5"><span className="text-lg font-semibold">{cliente.historico_viagens || 0}</span></TableCell>
                                    <TableCell className="text-right py-5"><span className="text-sm font-semibold text-emerald-600">R$ {Number(cliente.valor_total_gasto || 0).toLocaleString('pt-BR')}</span></TableCell>
                                    <TableCell className="pr-8 text-right py-5"><ClientActions cliente={cliente} onUpdate={() => navigate(".", { replace: true })} /></TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
