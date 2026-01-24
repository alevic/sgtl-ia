import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { IVeiculo, VeiculoStatus, IAssento, IManutencao, StatusManutencao, TipoManutencao, IVeiculoFeature } from '../types';
import { MapaAssentos } from '../components/Veiculos/MapaAssentos';
import {
    ArrowLeft, FileText, Map, History, Wrench,
    Bus, Truck, Gauge, Calendar, Edit, CheckCircle, Plus, AlertTriangle, Users, Clock, Loader2
} from 'lucide-react';
import { PageHeader } from '../components/Layout/PageHeader';
import { DashboardCard } from '../components/Layout/DashboardCard';
import { cn } from '../lib/utils';
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';

// Mock data - em produção virá do backend
const MOCK_VEICULO: IVeiculo & {
    km_atual: number;
    ano: number;
    ultima_revisao: string;
    motorista_atual?: string;
    observacoes?: string;
    features?: { label: string; value: string }[];
} = {
    id: 'V001',
    placa: 'ABC-1234',
    modelo: 'Mercedes-Benz O500 Double Deck',
    tipo: 'ONIBUS',
    status: VeiculoStatus.IN_TRANSIT,
    proxima_revisao_km: 95000,
    km_atual: 87500,
    ano: 2020,
    ultima_revisao: '2023-09-15',
    motorista_atual: 'José Silva',
    is_double_deck: true,
    capacidade_passageiros: 72,
    mapa_configurado: false,
    observacoes: 'Veículo Double Deck em excelente estado, última revisão completa realizada.'
};

type TabType = 'info' | 'mapa' | 'manutencao' | 'historico';

export const VeiculoDetalhes: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('info');
    const [veiculo, setVeiculo] = useState<typeof MOCK_VEICULO | null>(null);
    const [seats, setSeats] = useState<IAssento[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Warning Modal State
    const [warningModalOpen, setWarningModalOpen] = useState(false);
    const [warningMessages, setWarningMessages] = useState<string[]>([]);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchVehicle = async () => {
        if (!id) return;

        setIsLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/fleet/vehicles/${id}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch vehicle');
            }

            const data = await response.json();
            setVeiculo(data);

            // Fetch seats if it's a bus
            if (data.tipo === 'ONIBUS') {
                const seatsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/fleet/vehicles/${id}/seats`, {
                    credentials: 'include'
                });

                if (seatsResponse.ok) {
                    const seatsData = await seatsResponse.json();
                    setSeats(seatsData);
                }
            }
        } catch (error) {
            console.error("Erro ao buscar veículo:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveSeats = async (newSeats: IAssento[]) => {
        if (!id) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/fleet/vehicles/${id}/seats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ seats: newSeats })
            });

            if (!response.ok) {
                throw new Error('Failed to save seat map');
            }

            const data = await response.json();

            // Handle new response format { seats: [], warnings: [] }
            // or fallback to old array format for safety
            const savedSeats = Array.isArray(data) ? data : data.seats;
            const warnings = !Array.isArray(data) && data.warnings ? data.warnings : [];

            setSeats(savedSeats);

            if (warnings.length > 0) {
                setWarningMessages(warnings);
                setWarningModalOpen(true);
            } else {
                setSuccess('Mapa de assentos salvo com sucesso!');
                setTimeout(() => setSuccess(null), 3000);
            }

            // Refresh vehicle to update mapa_configurado flag
            await fetchVehicle();

        } catch (error: any) {
            console.error("Erro ao salvar mapa de assentos:", error);
            setError(error.message || 'Erro ao salvar mapa de assentos. Por favor, tente novamente.');
            setTimeout(() => setError(null), 5000);
        }
    };

    useEffect(() => {
        fetchVehicle();
    }, [id]);

    const isOnibus = veiculo?.tipo === 'ONIBUS';

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-slate-500 dark:text-slate-400">Carregando veículo...</p>
            </div>
        );
    }

    if (!veiculo) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-slate-500 dark:text-slate-400">Veículo não encontrado</p>
            </div>
        );
    }

    const tabs = [
        { id: 'info' as TabType, label: 'Informações Gerais', icon: FileText },
        ...(isOnibus ? [{ id: 'mapa' as TabType, label: 'Mapa de Assentos', icon: Map }] : []),
        { id: 'manutencao' as TabType, label: 'Manutenção', icon: Wrench },
        { id: 'historico' as TabType, label: 'Histórico', icon: History }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'info':
                return <InfoGeralTab veiculo={veiculo} />;
            case 'mapa':
                return isOnibus ? <MapaAssentos veiculo={veiculo} seats={seats} onSave={handleSaveSeats} /> : null;
            case 'manutencao':
                return <ManutencaoTab veiculo={veiculo} />;
            case 'historico':
                return <HistoricoTab veiculo={veiculo} />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-10 px-8">
            {success && (
                <Alert className="border-emerald-500 text-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 animate-in fade-in slide-in-from-top-2 duration-300">
                    <CheckCircle size={16} className="text-emerald-600" />
                    <AlertTitle>Sucesso</AlertTitle>
                    <AlertDescription>{success}</AlertDescription>
                </Alert>
            )}
            {error && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <AlertTriangle size={16} />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Header Module */}
            <PageHeader
                title={veiculo.placa}
                subtitle={`${veiculo.modelo} ${veiculo.is_double_deck ? '• DOUBLE DECK' : ''}`}
                suffix="FROTA"
                icon={Bus}
                backLink="/admin/frota"
                backLabel="Controle de Frota"
                rightElement={
                    <div className="flex items-center gap-3">
                        {isOnibus && veiculo.mapa_configurado && (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-none rounded-full px-4 py-2 font-bold flex items-center gap-2 uppercase text-[10px] tracking-widest mr-4">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Mapa Configurado
                            </Badge>
                        )}
                        <Button
                            variant="outline"
                            onClick={() => navigate(`/admin/frota/${id}/editar`)}
                            className="h-14 rounded-2xl px-6 font-black uppercase text-[12px] tracking-widest border-border bg-card/50 hover:bg-card transition-all"
                        >
                            <Edit size={16} className="mr-2" />
                            Editar Registro
                        </Button>
                        {isOnibus && (
                            <Button
                                variant="secondary"
                                onClick={() => setActiveTab('mapa')}
                                className="h-14 rounded-2xl px-6 font-black uppercase text-[12px] tracking-widest bg-secondary/50 hover:bg-secondary transition-all"
                            >
                                <Map size={16} className="mr-2" />
                                Gerenciar Assentos
                            </Button>
                        )}
                    </div>
                }
            />

            {/* Tabs Modenizadas */}
            <Tabs defaultValue="info" value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="w-full">
                <Card className="bg-card/50 border-none shadow-2xl shadow-muted/20 overflow-hidden rounded-[2rem]">
                    <div className="px-6 pt-6">
                        <TabsList className="bg-muted/30 p-1.5 rounded-2xl h-16 flex w-full md:w-fit border border-border/50">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <TabsTrigger
                                        key={tab.id}
                                        value={tab.id}
                                        className="flex-1 md:px-8 py-3 rounded-xl font-black uppercase text-[11px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg flex items-center justify-center gap-2 transition-all"
                                    >
                                        <Icon size={16} />
                                        <span className="hidden sm:inline">{tab.label}</span>
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>
                    </div>

                    <div className="p-8">
                        {renderTabContent()}
                    </div>
                </Card>
            </Tabs>

            {/* Warning Modal */}
            <AlertDialog open={warningModalOpen} onOpenChange={setWarningModalOpen}>
                <AlertDialogContent className="max-w-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="text-orange-600" size={20} />
                            Atenção: Assentos não Excluídos
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="text-left py-2">
                                <p className="mb-4 text-slate-600 dark:text-slate-300">
                                    Alguns assentos não puderam ser excluídos pois possuem reservas ativas ou histórico de uso. Eles foram mantidos no sistema mas desabilitados do mapa.
                                </p>
                                <ul className="list-disc pl-5 space-y-1 text-sm bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-lg">
                                    {warningMessages.map((msg, index) => (
                                        <li key={index} className="text-yellow-800 dark:text-yellow-200">{msg}</li>
                                    ))}
                                </ul>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Fechar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => setWarningModalOpen(false)}>Entendido</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};


// Tab: Informações Gerais
const InfoGeralTab: React.FC<{ veiculo: typeof MOCK_VEICULO }> = ({ veiculo }) => {
    const isOnibus = veiculo.tipo === 'ONIBUS';
    const { formatDate } = useDateFormatter();

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Cards de Resumo */}
            {/* Summary Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DashboardCard
                    title="Especificações"
                    value={isOnibus ? 'Serviço de Ônibus' : 'Serviço de Carga'}
                    icon={isOnibus ? Bus : Truck}
                    variant="indigo"
                    footer={`${veiculo.ano} • ${veiculo.modelo}`}
                />
                <DashboardCard
                    title="Status Operacional"
                    value={veiculo.status === VeiculoStatus.ACTIVE ? 'Pronto para Uso' :
                        veiculo.status === VeiculoStatus.IN_TRANSIT ? 'Em Operação' : 'Em Manutenção'}
                    icon={Clock}
                    variant={veiculo.status === VeiculoStatus.ACTIVE ? "emerald" : "indigo"}
                    footer="Disponibilidade Geral"
                />
                <DashboardCard
                    title="Capacidade"
                    value={isOnibus ? `${veiculo.capacidade_passageiros} Poltronas` : `${veiculo.capacidade_carga} Toneladas`}
                    icon={Users}
                    variant="indigo"
                    footer={isOnibus ? (veiculo.is_double_deck ? 'Dois Andares' : 'Padrão Unificado') : 'Carga Máxima'}
                />
            </div>

            {/* Métricas de Performance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 bg-muted/10 rounded-[2rem] border border-border/30">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary uppercase text-[10px] font-black tracking-widest mb-1">
                        <Gauge size={14} /> Quilometragem
                    </div>
                    <p className="text-3xl font-black tracking-tighter text-foreground">{veiculo.km_atual.toLocaleString()} <span className="text-lg font-medium text-muted-foreground">km</span></p>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-orange-500 uppercase text-[10px] font-black tracking-widest mb-1">
                        <Wrench size={14} /> Próxima Revisão
                    </div>
                    <p className="text-3xl font-black tracking-tighter text-foreground">{veiculo.proxima_revisao_km.toLocaleString()} <span className="text-lg font-medium text-muted-foreground">km</span></p>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-purple-500 uppercase text-[10px] font-black tracking-widest mb-1">
                        <Calendar size={14} /> Manutenção Preventiva
                    </div>
                    <p className="text-3xl font-black tracking-tighter text-foreground">
                        {veiculo.ultima_revisao ? formatDate(veiculo.ultima_revisao).replace(' de ', '/') : 'ESTRÉIA'}
                    </p>
                </div>
            </div>

            {/* Observações e Features */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {veiculo.observacoes && (
                    <div className="space-y-4">
                        <h3 className="text-section-header flex items-center gap-2">
                            <FileText size={16} className="text-primary" /> Observações Operacionais
                        </h3>
                        <div className="bg-card p-6 rounded-3xl border border-border/50 text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic">
                            "{veiculo.observacoes}"
                        </div>
                    </div>
                )}

                {veiculo.features && veiculo.features.length > 0 && (
                    <div className="space-y-6">
                        <h3 className="text-section-header flex items-center gap-2">
                            <CheckCircle size={16} className="text-primary" /> Conforto e Tecnologia
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {veiculo.features.map((item, idx) => (
                                <div key={idx} className="bg-muted/10 p-4 rounded-2xl border border-border/30 flex items-center gap-3 transition-all hover:bg-muted/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    <span className="text-sm font-bold text-foreground">
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Tab: Manutenção
const ManutencaoTab: React.FC<{ veiculo: typeof MOCK_VEICULO }> = ({ veiculo }) => {
    const navigate = useNavigate();
    const { formatDate } = useDateFormatter();
    const [manutencoes, setManutencoes] = useState<IManutencao[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMaintenances = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/maintenance?vehicle_id=${veiculo.id}`, {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    setManutencoes(data);
                }
            } catch (error) {
                console.error('Error fetching maintenances:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (veiculo.id) {
            fetchMaintenances();
        }
    }, [veiculo.id]);

    const getStatusColor = (status: StatusManutencao) => {
        switch (status) {
            case StatusManutencao.SCHEDULED: return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            case StatusManutencao.IN_PROGRESS: return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
            case StatusManutencao.COMPLETED: return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
            case StatusManutencao.CANCELLED: return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
            default: return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-primary" size={32} />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sincronizando histórico...</p>
            </div>
        );
    }

    if (manutencoes.length === 0) {
        return (
            <div className="text-center py-20 bg-muted/10 rounded-[2rem] border border-dashed border-border/50">
                <Wrench size={48} className="mx-auto text-muted-foreground/30 mb-6" />
                <h3 className="text-section-header">
                    Sem Registros de Oficina
                </h3>
                <p className="text-muted-foreground font-medium mb-8 max-w-sm mx-auto">
                    Este veículo ainda não possui interações registradas no módulo de manutenção.
                </p>
                <Button
                    onClick={() => navigate('/admin/manutencao/nova', { state: { initialVehicle: veiculo } })}
                    className="h-14 rounded-2xl px-8 font-black uppercase text-[12px] tracking-widest bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                >
                    <Plus size={18} className="mr-2" />
                    Registrar Manutenção
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-section-header">Histórico Técnico</h3>
                    <p className="text-section-description mt-0.5">Todas as intervenções mecânicas realizadas</p>
                </div>
                <Button
                    onClick={() => navigate('/admin/manutencao/nova', { state: { initialVehicle: veiculo } })}
                    className="h-12 rounded-xl px-6 font-black uppercase text-[11px] tracking-widest bg-primary text-primary-foreground transition-all hover:scale-[1.02]"
                >
                    <Plus size={18} className="mr-2" />
                    Nova Entrada
                </Button>
            </div>

            <div className="bg-card/30 rounded-3xl border border-border/40 overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-border/50 h-14">
                            <TableHead className="pl-6 text-table-head">Data / Status</TableHead>
                            <TableHead className="text-table-head">Serviço Realizado</TableHead>
                            <TableHead className="text-table-head">Quilometragem</TableHead>
                            <TableHead className="text-table-head">Investimento</TableHead>
                            <TableHead className="pr-6 text-right text-table-head">Operação</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {manutencoes.map((manutencao) => (
                            <TableRow
                                key={manutencao.id}
                                onClick={() => navigate(`/admin/manutencao/${manutencao.id}/editar`)}
                                className="hover:bg-muted/20 border-border/30 transition-colors cursor-pointer group h-16"
                            >
                                <TableCell className="pl-6">
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-sm font-bold text-foreground">
                                            {formatDate(manutencao.data_agendada)}
                                        </span>
                                        <Badge variant="outline" className={cn("inline-flex h-5 px-2 text-[9px] font-black uppercase tracking-tighter border-none", getStatusColor(manutencao.status))}>
                                            {manutencao.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-foreground uppercase tracking-tight">
                                            {manutencao.tipo}
                                        </span>
                                        <span className="text-[12px] font-medium text-muted-foreground line-clamp-1">
                                            {manutencao.descricao}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5">
                                        <Gauge size={14} className="text-muted-foreground" />
                                        <span className="text-sm font-bold text-foreground">
                                            {manutencao.km_veiculo.toLocaleString()} <span className="text-xs text-muted-foreground">km</span>
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm font-black text-foreground">
                                        {manutencao.moeda} {(Number(manutencao.custo_pecas) + Number(manutencao.custo_mao_de_obra)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </TableCell>
                                <TableCell className="pr-6 text-right">
                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        <Edit size={16} />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

// Tab: Histórico
const HistoricoTab: React.FC<{ veiculo: typeof MOCK_VEICULO }> = ({ veiculo }) => {
    return (
        <div className="text-center py-20 bg-muted/10 rounded-[2rem] border border-dashed border-border/50">
            <div className="w-16 h-16 bg-purple-500/10 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <History size={32} />
            </div>
            <h3 className="text-section-header mb-2">
                Timeline de Viagens
            </h3>
            <p className="text-muted-foreground font-medium mb-8 max-w-sm mx-auto">
                O registro histórico de rotas e passagens para este prefixo está sendo processado.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                <Clock size={12} /> Disponível em Breve
            </div>
        </div>
    );
};
