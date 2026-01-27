import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ICliente } from '../types';
import {
    Users, Search, Filter, UserPlus, Star, TrendingUp,
    Phone, Mail, MapPin, Calendar, Award, Tag, ChevronRight, MoreHorizontal
} from 'lucide-react';
import { clientsService } from '../services/clientsService';
import { ClientActions } from '../components/CRM/ClientActions';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "../components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table";
import { Separator } from "../components/ui/separator";
import { PageHeader } from '../components/Layout/PageHeader';
import { DashboardCard } from '../components/Layout/DashboardCard';
import { ListFilterSection } from '../components/Layout/ListFilterSection';
import { cn } from "../lib/utils";

const SegmentoBadge: React.FC<{ segmento: ICliente['segmento'] }> = ({ segmento }) => {
    const configs = {
        VIP: { color: 'purple', icon: Star, label: 'VIP', class: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/20' },
        REGULAR: { color: 'blue', icon: Users, label: 'Regular', class: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20' },
        NOVO: { color: 'green', icon: UserPlus, label: 'Novo', class: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
        INATIVO: { color: 'slate', icon: Users, label: 'Inativo', class: 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/20' }
    };

    const config = configs[segmento] || configs.REGULAR;
    const Icon = config.icon;

    return (
        <Badge variant="outline" className={cn("flex items-center gap-1 font-bold px-2 py-0.5 rounded-full", config.class.replace('border-', '').replace(/[\w-]+-500\/20/, '').trim())}>
            <Icon size={12} />
            {config.label}
        </Badge>
    );
};

export const CRM: React.FC = () => {
    const [clientes, setClientes] = useState<ICliente[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filtroSegmento, setFiltroSegmento] = useState<'TODOS' | ICliente['segmento']>('TODOS');
    const [busca, setBusca] = useState('');

    useEffect(() => {
        fetchClientes();
    }, []);

    const fetchClientes = async () => {
        setIsLoading(true);
        try {
            const data = await clientsService.getAll();
            setClientes(data);
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const clientesFiltrados = clientes.filter(c => {
        const matchSegmento = filtroSegmento === 'TODOS' || c.segmento === filtroSegmento;
        const matchBusca = busca === '' ||
            c.nome.toLowerCase().includes(busca.toLowerCase()) ||
            c.email.toLowerCase().includes(busca.toLowerCase()) ||
            (c.documento || '').includes(busca) ||
            c.telefone?.includes(busca);
        return matchSegmento && matchBusca;
    });

    // Estatísticas
    const totalClientes = clientes.length;
    const clientesVIP = clientes.filter(c => c.segmento === 'VIP').length;
    const totalViagens = clientes.reduce((sum, c) => sum + (c.historico_viagens || 0), 0);
    const valorTotal = clientes.reduce((sum, c) => sum + Number(c.valor_total_gasto || 0), 0);

    return (
        <div key="crm-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Executive Header */}
            <PageHeader
                title="CRM - Clientes"
                subtitle="Gestão de relacionamento e fidelização"
                icon={Users}
                rightElement={
                    <Button asChild className="h-14 px-6 rounded-sm font-semibold gap-2 shadow-lg shadow-primary/20">
                        <Link to="/admin/clientes/novo">
                            <UserPlus size={20} strokeWidth={2.5} />
                            NOVO CLIENTE
                        </Link>
                    </Button>
                }
            />

            {/* Executive KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <DashboardCard
                    title="Total de Clientes"
                    value={totalClientes}
                    icon={Users}
                    variant="primary"
                />
                <DashboardCard
                    title="Clientes VIP"
                    value={clientesVIP}
                    icon={Star}
                    variant="purple"
                />
                <DashboardCard
                    title="Total de Viagens"
                    value={totalViagens}
                    icon={TrendingUp}
                    variant="blue"
                />
                <DashboardCard
                    title="Receita Total"
                    value={`R$ ${Math.round(valorTotal / 1000)}k`}
                    icon={Award}
                    variant="emerald"
                />
            </div>


            {/* Executive Filters Module */}
            <ListFilterSection>
                {/* Busca */}
                <div className="space-y-1.5 flex flex-col lg:col-span-2">
                    <label className="text-label-caps ml-1">Buscar Cliente</label>
                    <div className="relative group flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                        <Input
                            placeholder="Nome, email, documento..."
                            className="pl-12 h-14 bg-muted border-input rounded-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary/20"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                        />
                    </div>
                </div>

                {/* Segmento Tabs */}
                <div className="space-y-1.5 flex flex-col lg:col-span-2">
                    <label className="text-label-caps ml-1">Segmento do Cliente</label>
                    <Tabs
                        value={filtroSegmento}
                        onValueChange={(v) => setFiltroSegmento(v as any)}
                        className="w-full"
                    >
                        <TabsList className="bg-muted p-1.5 rounded-sm h-14 flex w-full border border-border/50">
                            <TabsTrigger value="TODOS" className="flex-1 rounded-sm px-2 font-black text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm">TODOS</TabsTrigger>
                            <TabsTrigger value="VIP" className="flex-1 rounded-sm px-2 font-black text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm text-purple-600">VIP</TabsTrigger>
                            <TabsTrigger value="REGULAR" className="flex-1 rounded-sm px-2 font-black text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm text-blue-600">REGULAR</TabsTrigger>
                            <TabsTrigger value="NOVO" className="flex-1 rounded-sm px-2 font-black text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm text-emerald-600">NOVOS</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </ListFilterSection>


            {/* Executive Table Module */}
            <Card className="shadow-2xl shadow-muted/20 overflow-hidden rounded-[2.5rem] bg-card  ">
                <Table>
                    <TableHeader className="bg-muted">
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
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-96 text-center border-none">
                                    <div className="flex flex-col items-center justify-center gap-4 py-20">
                                        <div className="w-12 h-14 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                        <p className="text-muted-foreground font-medium">Carregando clientes...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : clientesFiltrados.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-96 text-center border-none">
                                    <div className="flex flex-col items-center justify-center gap-4 py-20 grayscale opacity-40">
                                        <div className="p-6 bg-muted rounded-full">
                                            <Users size={48} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-lg font-bold text-foreground">Nenhum cliente encontrado</p>
                                            <p className="text-sm text-muted-foreground">Tente ajustar os filtros ou adicionar um novo cliente</p>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            clientesFiltrados.map((cliente) => (
                                <TableRow key={cliente.id} className="group hover:bg-muted border-border/30 transition-colors">
                                    <TableCell className="pl-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border-2 border-background shadow-sm ring-1 ring-primary/10">
                                                <AvatarImage src={(cliente as any).avatar} />
                                                <AvatarFallback className="bg-gradient-to-br from-primary/10 to-purple-600/10 text-primary text-sm font-semibold">
                                                    {cliente.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <Link
                                                    to={`/admin/clientes/${cliente.id}`}
                                                    className="font-bold text-sm hover:text-primary transition-colors"
                                                >
                                                    {cliente.nome}
                                                </Link>
                                                <p className="text-xs text-muted-foreground">
                                                    {cliente.documento || 'Sem documento'}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs">
                                                <Mail size={12} className="text-blue-600" />
                                                <span className="font-medium truncate max-w-[200px]">{cliente.email}</span>
                                            </div>
                                            {cliente.telefone && (
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Phone size={12} className="text-emerald-600" />
                                                    <span>{cliente.telefone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center py-5">
                                        <SegmentoBadge segmento={cliente.segmento} />
                                    </TableCell>
                                    <TableCell className="text-center py-5">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-lg font-semibold">{cliente.historico_viagens || 0}</span>
                                            {cliente.ultima_viagem && (
                                                <span className="text-[12px] text-muted-foreground">
                                                    Última: {new Date(cliente.ultima_viagem).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right py-5">
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-sm font-semibold text-emerald-600">
                                                R$ {Number(cliente.valor_total_gasto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                            {cliente.saldo_creditos > 0 && (
                                                <span className="text-[12px] text-muted-foreground">
                                                    {cliente.saldo_creditos} créditos
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="pr-8 text-right py-5">
                                        <ClientActions cliente={cliente} onUpdate={fetchClientes} />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
};
