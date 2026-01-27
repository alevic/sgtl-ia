import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDateFormatter } from '../hooks/useDateFormatter';
import {
    Wrench,
    Plus,
    Search,
    Calendar,
    AlertTriangle,
    CheckCircle,
    Clock,
    DollarSign,
    TrendingUp,
    Loader,
    Inbox,
    WrenchIcon
} from 'lucide-react';
import { IManutencao, TipoManutencao, StatusManutencao, StatusManutencaoLabel, TipoManutencaoLabel } from '../types';
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
import { MaintenanceActions } from '../components/Manutencao/MaintenanceActions';

export const Manutencao: React.FC = () => {
    const navigate = useNavigate();
    const { formatDate } = useDateFormatter();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('TODOS');
    const [manutencoes, setManutencoes] = useState<IManutencao[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchMaintenances = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/maintenance`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setManutencoes(data);
            } else {
                console.error('Failed to fetch maintenances');
            }
        } catch (error) {
            console.error('Error fetching maintenances:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMaintenances();
    }, []);

    const handleDeleteFromList = (id: string) => {
        setManutencoes(prev => prev.filter(m => m.id !== id));
    };

    const StatusBadge: React.FC<{ status: StatusManutencao }> = ({ status }) => {
        const configs: Record<any, any> = {
            [StatusManutencao.SCHEDULED]: {
                label: StatusManutencaoLabel[StatusManutencao.SCHEDULED],
                icon: Clock,
                className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
            },
            [StatusManutencao.IN_PROGRESS]: {
                label: StatusManutencaoLabel[StatusManutencao.IN_PROGRESS],
                icon: Wrench,
                className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
            },
            [StatusManutencao.COMPLETED]: {
                label: StatusManutencaoLabel[StatusManutencao.COMPLETED],
                icon: CheckCircle,
                className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
            },
            [StatusManutencao.CANCELLED]: {
                label: StatusManutencaoLabel[StatusManutencao.CANCELLED],
                icon: AlertTriangle,
                className: "bg-destructive/10 text-destructive border-destructive/20",
            },
            'AGENDADA': {
                label: 'Agendada',
                icon: Clock,
                className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
            },
            'EM_ANDAMENTO': {
                label: 'Em Andamento',
                icon: Wrench,
                className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
            },
            'CONCLUIDA': {
                label: 'Concluída',
                icon: CheckCircle,
                className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
            },
            'CANCELADA': {
                label: 'Cancelada',
                icon: AlertTriangle,
                className: "bg-destructive/10 text-destructive border-destructive/20",
            }
        };

        const config = configs[status] || { label: status, className: "bg-muted text-muted-foreground", icon: Clock };
        const Icon = config.icon;

        return (
            <Badge variant="outline" className={cn("gap-1.5 font-bold px-2 py-0.5 rounded-sm", config.className.replace('border-', '').replace(/[\w-]+-500\/20/, '').trim())}>
                <Icon size={12} strokeWidth={2.5} />
                {config.label}
            </Badge>
        );
    };

    const TypeBadge: React.FC<{ tipo: TipoManutencao }> = ({ tipo }) => {
        const configs: Record<any, any> = {
            [TipoManutencao.PREVENTIVE]: {
                label: TipoManutencaoLabel[TipoManutencao.PREVENTIVE],
                icon: Clock,
                className: "bg-blue-500/10 text-blue-600",
            },
            [TipoManutencao.CORRECTIVE]: {
                label: TipoManutencaoLabel[TipoManutencao.CORRECTIVE],
                icon: AlertTriangle,
                className: "bg-rose-500/10 text-rose-600",
            },
            [TipoManutencao.PREDICTIVE]: {
                label: TipoManutencaoLabel[TipoManutencao.PREDICTIVE],
                icon: TrendingUp,
                className: "bg-violet-500/10 text-violet-600",
            },
            [TipoManutencao.INSPECTION]: {
                label: TipoManutencaoLabel[TipoManutencao.INSPECTION],
                icon: CheckCircle,
                className: "bg-emerald-500/10 text-emerald-600",
            },
            'PREVENTIVA': {
                label: 'Preventiva',
                icon: Clock,
                className: "bg-blue-500/10 text-blue-600",
            },
            'CORRETIVA': {
                label: 'Corretiva',
                icon: AlertTriangle,
                className: "bg-rose-500/10 text-rose-600",
            }
        };

        const config = configs[tipo] || { label: tipo, className: "bg-muted text-muted-foreground", icon: Wrench };
        const Icon = config.icon;

        return (
            <div className={cn("flex items-center gap-1.5 font-bold text-[12px] tracking-tight", config.className.split(' ')[1])}>
                <Icon size={12} strokeWidth={2.5} />
                <span className="uppercase">{config.label}</span>
            </div>
        );
    };

    const filteredMaintenances = manutencoes.filter(m => {
        const matchesSearch =
            (m.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
            (m.oficina?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
            ((m as any).placa?.toLowerCase().includes(searchTerm.toLowerCase()) || ''); // Assuming join brings placa

        const matchesStatus = filterStatus === 'TODOS' || m.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    // KPIs Calculation
    const totalMaintenances = manutencoes.length;
    const inProgress = manutencoes.filter(m => m.status === StatusManutencao.IN_PROGRESS || (m.status as any) === 'EM_ANDAMENTO').length;
    const totalCost = manutencoes.reduce((acc, curr) => acc + Number(curr.custo_pecas || 0) + Number(curr.custo_mao_de_obra || 0), 0);
    const scheduledNext7Days = manutencoes.filter(m => {
        if (m.status !== StatusManutencao.SCHEDULED && (m.status as any) !== 'AGENDADA') return false;
        const date = new Date(m.data_agendada);
        const now = new Date();
        const diffTime = Math.abs(date.getTime() - now.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7 && date >= now;
    }).length;

    if (isLoading) {
        return <div className="p-8 text-center">Carregando manutenções...</div>;
    }

    return (
        <div key="manutencao-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header Section */}
            <PageHeader
                title="Gestão de Manutenção"
                subtitle="Controle preventivo e corretivo da frota"
                icon={Wrench}
                rightElement={
                    <Button
                        onClick={() => navigate('/admin/manutencao/nova')}
                        className="h-14 px-6 rounded-sm font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                    >
                        <Plus size={20} className="mr-2" strokeWidth={3} />
                        NOVA MANUTENÇÃO
                    </Button>
                }
            />

            {/* Premium Stat Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <DashboardCard
                    title="Total Registros"
                    value={totalMaintenances}
                    icon={Wrench}
                    variant="primary"
                />
                <DashboardCard
                    title="Na Oficina"
                    value={inProgress}
                    icon={Clock}
                    variant="amber"
                />
                <DashboardCard
                    title="Investimento Total"
                    value={`R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    icon={DollarSign}
                    variant="emerald"
                />
                <DashboardCard
                    title="Agendadas (7d)"
                    value={scheduledNext7Days}
                    icon={Calendar}
                    variant="purple"
                />
            </div>

            {/* Filters Module */}
            <ListFilterSection>
                {/* Busca */}
                <div className="space-y-1.5 flex flex-col lg:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80 ml-1">Buscar Manutenção</label>
                    <div className="relative group flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                        <Input
                            placeholder="Descrição, oficina ou placa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 h-14 bg-muted border-input rounded-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary/20"
                        />
                    </div>
                </div>

                {/* Status Tabs */}
                <div className="space-y-1.5 flex flex-col lg:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80 ml-1">Status da Manutenção</label>
                    <Tabs value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)} className="w-full">
                        <TabsList className="bg-muted p-1.5 rounded-sm h-14 flex w-full border border-border/50">
                            <TabsTrigger value="TODOS" className="flex-1 rounded-sm font-black text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm">TODOS</TabsTrigger>
                            <TabsTrigger value={StatusManutencao.SCHEDULED} className="flex-1 rounded-sm font-black text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm">Agendadas</TabsTrigger>
                            <TabsTrigger value={StatusManutencao.IN_PROGRESS} className="flex-1 rounded-sm font-black text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm">Oficina</TabsTrigger>
                            <TabsTrigger value={StatusManutencao.COMPLETED} className="flex-1 rounded-sm font-black text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm">Concluídas</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </ListFilterSection>

            {/* Maintenances Table */}
            <Card className="shadow-2xl shadow-muted/20 overflow-hidden rounded-[2.5rem] bg-card  ">
                <Table>
                    <TableHeader className="bg-muted">
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="pl-8 h-14 text-[12px] font-semibold uppercase tracking-widest">Veículo</TableHead>
                            <TableHead className="h-14 text-[12px] font-semibold uppercase tracking-widest">Descrição / Tipo</TableHead>
                            <TableHead className="h-14 text-[12px] font-semibold uppercase tracking-widest">Data & Status</TableHead>
                            <TableHead className="h-14 text-[12px] font-semibold uppercase tracking-widest">Investimento</TableHead>
                            <TableHead className="pr-8 h-14 text-[12px] font-semibold uppercase tracking-widest text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredMaintenances.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Inbox className="w-12 h-14 text-muted-foreground/30" />
                                        <p className="font-bold text-sm text-muted-foreground">Nenhuma manutenção encontrada</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredMaintenances.map((manutencao) => (
                                <TableRow key={manutencao.id} className="group hover:bg-muted border-border/30 transition-colors">
                                    <TableCell className="pl-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-14 rounded-sm bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110">
                                                <WrenchIcon size={22} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-sm tracking-tight text-foreground">
                                                    {(manutencao as any).placa || 'Sem Placa'}
                                                </span>
                                                <span className="text-[11px] font-bold text-muted-foreground/80">
                                                    {(manutencao as any).modelo || `ID: ${manutencao.veiculo_id.substring(0, 8)}`}
                                                </span>
                                                <span className="text-[12px] font-semibold text-primary/60 uppercase">
                                                    {manutencao.km_veiculo.toLocaleString()} KM
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1 max-w-[200px]">
                                            <TypeBadge tipo={manutencao.tipo} />
                                            <span className="text-sm font-bold tracking-tight text-foreground truncate" title={manutencao.descricao}>
                                                {manutencao.descricao}
                                            </span>
                                            <span className="text-[12px] font-bold text-muted-foreground italic">
                                                {manutencao.oficina || 'Oficina não informada'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                                <Calendar className="w-3.5 h-3.5 text-primary" strokeWidth={3} />
                                                {formatDate(manutencao.data_agendada)}
                                            </div>
                                            <StatusBadge status={manutencao.status} />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-emerald-600 transition-colors group-hover:text-emerald-500">
                                                R$ {(Number(manutencao.custo_pecas) + Number(manutencao.custo_mao_de_obra)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                            <div className="flex gap-2 text-[12px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                                                <span>P: {Number(manutencao.custo_pecas).toLocaleString()}</span>
                                                <span>•</span>
                                                <span>M: {Number(manutencao.custo_mao_de_obra).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="pr-8 text-right">
                                        <MaintenanceActions
                                            manutencao={manutencao}
                                            onDelete={handleDeleteFromList}
                                        />
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
