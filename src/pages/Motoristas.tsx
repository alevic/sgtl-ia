import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { IMotorista, DriverStatus, DriverStatusLabel } from '@/types';
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
import { PageHeader } from '../components/Layout/PageHeader';
import { DashboardCard } from '../components/Layout/DashboardCard';
import { ListFilterSection } from '../components/Layout/ListFilterSection';
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
        <Badge variant="outline" className={cn("gap-1.5 font-bold px-2 py-0.5 rounded-sm", config.className)}>
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
            <PageHeader
                title="Gestão de Motoristas"
                subtitle="Controle de profissionais e documentação"
                icon={UserCircle}
                rightElement={
                    <Button
                        onClick={() => navigate('/admin/motoristas/novo')}
                        className="h-14 px-6 rounded-sm font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                    >
                        <Plus size={20} className="mr-2" strokeWidth={3} />
                        NOVO MOTORISTA
                    </Button>
                }
            />

            {/* Premium Stat Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <DashboardCard
                    title="Total Registrados"
                    value={total}
                    icon={User}
                    variant="primary"
                />
                <DashboardCard
                    title="Disponíveis"
                    value={disponiveis}
                    icon={CheckCircle}
                    variant="emerald"
                />
                <DashboardCard
                    title="Em Viagem"
                    value={emViagem}
                    icon={Clock}
                    variant="blue"
                />
                <DashboardCard
                    title="Em Férias/Licença"
                    value={ferias}
                    icon={Calendar}
                    variant="amber"
                />
            </div>

            {/* Filters Module */}
            <ListFilterSection>
                {/* Busca */}
                <div className="space-y-1.5 flex flex-col lg:col-span-2">
                    <label className="text-label-caps ml-1">Buscar Motorista</label>
                    <div className="relative group flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 transition-colors group-focus-within:text-primary" />
                        <Input
                            placeholder="Nome ou CNH..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="pl-11 h-14 bg-muted border-input rounded-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary/20"
                        />
                    </div>
                </div>

                {/* Status Tabs */}
                <div className="space-y-1.5 flex flex-col lg:col-span-2">
                    <label className="text-label-caps ml-1 text-left block">Status Operacional</label>
                    <Tabs value={filtroStatus} onValueChange={(v: any) => setFiltroStatus(v)} className="w-full">
                        <TabsList className="bg-muted p-1.5 rounded-sm h-14 flex w-full border border-border/50">
                            <TabsTrigger value="TODOS" className="flex-1 rounded-sm font-black text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm">TODOS</TabsTrigger>
                            <TabsTrigger value={DriverStatus.AVAILABLE} className="flex-1 rounded-sm font-black text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm text-emerald-600 uppercase">Disponíveis</TabsTrigger>
                            <TabsTrigger value={DriverStatus.IN_TRANSIT} className="flex-1 rounded-sm font-black text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm text-blue-600 uppercase">Viagem</TabsTrigger>
                            <TabsTrigger value={DriverStatus.ON_LEAVE} className="flex-1 rounded-sm font-black text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm text-amber-600 uppercase">Férias</TabsTrigger>
                            <TabsTrigger value={DriverStatus.AWAY} className="flex-1 rounded-sm font-black text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm text-destructive uppercase">Afastados</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </ListFilterSection>

            {/* Drivers Table */}
            <Card className="border-none shadow-2xl shadow-muted/20 overflow-hidden rounded-sm bg-card  ">
                <Table>
                    <TableHeader className="bg-muted">
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="pl-8 h-14 text-table-head">Motorista / Documento</TableHead>
                            <TableHead className="h-14 text-table-head">Status</TableHead>
                            <TableHead className="h-14 text-table-head">Validade CNH</TableHead>
                            <TableHead className="h-14 text-table-head">Passaporte</TableHead>
                            <TableHead className="pr-8 h-14 text-table-head text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center gap-3 animate-pulse">
                                        <div className="w-12 h-14 bg-primary/10 rounded-sm flex items-center justify-center text-primary">
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
                                    <TableRow key={motorista.id} className="group hover:bg-muted border-border/30 transition-colors">
                                        <TableCell className="pl-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-14 rounded-sm bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110">
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
