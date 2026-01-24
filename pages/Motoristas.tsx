import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { IMotorista, DriverStatus, DriverStatusLabel } from '../types';
import {
    User,
    Calendar,
    CheckCircle,
    XCircle,
    AlertCircle,
    FileText,
    Search,
    Plus,
    Inbox,
    Loader2,
    Clock,
    UserCircle
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { cn } from "../lib/utils";
import { DriverActions } from '../components/Motoristas/DriverActions';

const StatusBadge: React.FC<{ status: DriverStatus }> = ({ status }) => {
    const configs: Record<string, { className: string; icon: any }> = {
        [DriverStatus.AVAILABLE]: { className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle },
        [DriverStatus.IN_TRANSIT]: { className: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Clock },
        [DriverStatus.ON_LEAVE]: { className: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Calendar },
        [DriverStatus.AWAY]: { className: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle }
    };

    const config = configs[status] || configs[DriverStatus.AVAILABLE];
    const Icon = config.icon;

    return (
        <Badge variant="outline" className={cn("gap-1.5 font-bold px-2 py-0.5 rounded-lg", config.className)}>
            <Icon size={12} strokeWidth={2.5} />
            {DriverStatusLabel[status] || (status as string)}
        </Badge>
    );
};

export const Motoristas: React.FC = () => {
    const navigate = useNavigate();
    const { formatDate } = useDateFormatter();
    const [motoristas, setMotoristas] = useState<IMotorista[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState<'TODOS' | IMotorista['status']>('TODOS');

    const fetchMotoristas = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/fleet/drivers`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch drivers');
            }

            const data = await response.json();
            setMotoristas(data);
        } catch (error) {
            console.error("Erro ao buscar motoristas:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMotoristas();
    }, []);

    const motoristasFiltrados = motoristas.filter(motorista => {
        const matchStatus = filtroStatus === 'TODOS' || motorista.status === filtroStatus;
        const matchBusca = busca === '' ||
            motorista.nome.toLowerCase().includes(busca.toLowerCase()) ||
            motorista.cnh.includes(busca);
        return matchStatus && matchBusca;
    });

    const getValidadeStatus = (dataValidade: string) => {
        const hoje = new Date();
        const validade = new Date(dataValidade);
        const diasRestantes = Math.floor((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

        if (diasRestantes < 0) return { label: 'Vencido', className: 'text-destructive' };
        if (diasRestantes < 30) return { label: `Vencendo em ${diasRestantes}d`, className: 'text-amber-500' };
        return { label: formatDate(dataValidade), className: 'text-muted-foreground' };
    };

    // Estatísticas
    const total = motoristas.length;
    const disponiveis = motoristas.filter(m => m.status === DriverStatus.AVAILABLE).length;
    const emViagem = motoristas.filter(m => m.status === DriverStatus.IN_TRANSIT).length;
    const ferias = motoristas.filter(m => m.status === DriverStatus.ON_LEAVE).length;

    return (
        <div key="motoristas-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl">
                            <UserCircle className="text-primary w-6 h-6" strokeWidth={2.5} />
                        </div>
                        <h1 className="text-4xl font-semibold tracking-tighter text-foreground">
                            Gestão de <span className="text-primary">Motoristas</span>
                        </h1>
                    </div>
                    <p className="text-muted-foreground font-medium text-sm ml-1">Controle de profissionais e documentação</p>
                </div>
                <Button
                    onClick={() => navigate('/admin/motoristas/novo')}
                    className="h-14 px-6 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                >
                    <Plus size={20} className="mr-2" strokeWidth={3} />
                    NOVO MOTORISTA
                </Button>
            </div>

            {/* Premium Stat Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Registrados', value: total, icon: User, color: 'primary' },
                    { label: 'Disponíveis', value: disponiveis, icon: CheckCircle, color: 'emerald' },
                    { label: 'Em Viagem', value: emViagem, icon: Clock, color: 'blue' },
                    { label: 'Em Férias/Licença', value: ferias, icon: Calendar, color: 'amber' }
                ].map((stat, i) => (
                    <Card key={i} className="shadow-xl shadow-muted/20 bg-card/50 backdrop-blur-sm group hover:bg-card transition-colors rounded-3xl">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                                    <p className="text-3xl font-semibold tracking-tighter">{stat.value}</p>
                                </div>
                                <div className={cn(
                                    "p-3 rounded-xl transition-transform group-hover:scale-110 duration-500",
                                    stat.color === 'primary' ? "bg-primary/10 text-primary" :
                                        stat.color === 'emerald' ? "bg-emerald-500/10 text-emerald-600" :
                                            stat.color === 'blue' ? "bg-blue-500/10 text-blue-600" :
                                                "bg-amber-500/10 text-amber-600"
                                )}>
                                    <stat.icon size={20} strokeWidth={2.5} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters Module */}
            <div className="bg-card/50 backdrop-blur-sm p-6 rounded-3xl border border-border/40 shadow-xl shadow-muted/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Busca */}
                    <div className="space-y-1.5 flex flex-col">
                        <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Buscar Motorista</label>
                        <div className="relative group flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 transition-colors group-focus-within:text-primary" />
                            <Input
                                placeholder="Nome ou CNH..."
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                className="pl-11 h-14 bg-muted/40 border-input rounded-xl font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary/20"
                            />
                        </div>
                    </div>

                    {/* Status Tabs */}
                    <div className="space-y-1.5 flex flex-col">
                        <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1 text-left block">Status Operacional</label>
                        <Tabs value={filtroStatus} onValueChange={(v: any) => setFiltroStatus(v)} className="w-full">
                            <TabsList className="bg-muted/40 p-1.5 rounded-xl h-14 flex w-full border border-border/50">
                                <TabsTrigger value="TODOS" className="flex-1 rounded-xl font-bold text-[12px] data-[state=active]:bg-background data-[state=active]:shadow-sm">TODOS</TabsTrigger>
                                <TabsTrigger value={DriverStatus.AVAILABLE} className="flex-1 rounded-xl font-bold text-[12px] data-[state=active]:bg-background data-[state=active]:shadow-sm text-emerald-600 uppercase">Disponíveis</TabsTrigger>
                                <TabsTrigger value={DriverStatus.IN_TRANSIT} className="flex-1 rounded-xl font-bold text-[12px] data-[state=active]:bg-background data-[state=active]:shadow-sm text-blue-600 uppercase">Em Viagem</TabsTrigger>
                                <TabsTrigger value={DriverStatus.ON_LEAVE} className="flex-1 rounded-xl font-bold text-[12px] data-[state=active]:bg-background data-[state=active]:shadow-sm text-amber-600 uppercase">Férias</TabsTrigger>
                                <TabsTrigger value={DriverStatus.AWAY} className="flex-1 rounded-xl font-bold text-[12px] data-[state=active]:bg-background data-[state=active]:shadow-sm text-destructive uppercase">Afastados</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>
            </div>

            {/* Drivers Table */}
            <Card className="border-none shadow-2xl shadow-muted/20 overflow-hidden rounded-3xl bg-card/50 backdrop-blur-sm">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="pl-8 h-14 text-[12px] font-semibold uppercase tracking-widest">Motorista / Documento</TableHead>
                            <TableHead className="h-14 text-[12px] font-semibold uppercase tracking-widest">Status</TableHead>
                            <TableHead className="h-14 text-[12px] font-semibold uppercase tracking-widest">Validade CNH</TableHead>
                            <TableHead className="h-14 text-[12px] font-semibold uppercase tracking-widest">Passaporte</TableHead>
                            <TableHead className="pr-8 h-14 text-[12px] font-semibold uppercase tracking-widest text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center gap-3 animate-pulse">
                                        <div className="w-12 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                            <Loader2 className="animate-spin" />
                                        </div>
                                        <p className="font-semibold text-sm tracking-widest text-muted-foreground uppercase">Carregando quadro...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : motoristasFiltrados.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Inbox className="w-12 h-14 text-muted-foreground/30" />
                                        <p className="font-bold text-sm text-muted-foreground">Nenhum motorista encontrado</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            motoristasFiltrados.map((motorista) => {
                                const cnhValidade = getValidadeStatus(motorista.validade_cnh);
                                const passValidade = motorista.validade_passaporte ? getValidadeStatus(motorista.validade_passaporte) : null;

                                return (
                                    <TableRow key={motorista.id} className="group hover:bg-muted/20 border-border/30 transition-colors">
                                        <TableCell className="pl-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110">
                                                    <User size={22} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm tracking-tight text-foreground">{motorista.nome}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[12px] font-semibold text-primary uppercase">Cat. {motorista.categoria_cnh}</span>
                                                        <span className="text-[12px] font-bold text-muted-foreground/60 tracking-wider">CNH {motorista.cnh}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={motorista.status} />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                                    <Calendar className="w-3.5 h-3.5 text-primary" strokeWidth={3} />
                                                    <span className={cnhValidade.className}>{cnhValidade.label}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {motorista.passaporte ? (
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                                        <FileText className="w-3.5 h-3.5 text-primary" strokeWidth={3} />
                                                        <span className={passValidade?.className}>{passValidade?.label}</span>
                                                    </div>
                                                    <span className="text-[12px] font-bold text-muted-foreground/50 tracking-widest">{motorista.passaporte}</span>
                                                </div>
                                            ) : (
                                                <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-none text-[9px] font-semibold uppercase">N/A</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="pr-8 text-right">
                                            <DriverActions motorista={motorista} onUpdate={fetchMotoristas} />
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
};
