import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { IMotorista, DriverStatus } from '../../types';
import {
    ArrowLeft, Edit, Trash2, User, FileText, Globe, Phone, MapPin,
    Calendar, Briefcase, AlertTriangle, CheckCircle, XCircle, AlertCircle,
    ShieldCheck, History, Clock, Star, CheckCircle2, Loader2,
    Mail, CreditCard, Award, MapPinned, Info, ChevronRight, Hash
} from 'lucide-react';
import { PageHeader } from '../components/Layout/PageHeader';
import { DashboardCard } from '../components/Layout/DashboardCard';
import { cn } from '../lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
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

export const MotoristaDetalhes: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { formatDate } = useDateFormatter();
    const [motorista, setMotorista] = useState<IMotorista | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [activeTab, setActiveTab] = useState('perfil');

    useEffect(() => {
        const fetchMotorista = async () => {
            if (!id) return;

            setIsLoading(true);
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/fleet/drivers/${id}`, {
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch driver');
                }

                const data = await response.json();
                setMotorista(data);
            } catch (error) {
                console.error("Erro ao buscar motorista:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMotorista();
    }, [id]);

    const handleDelete = async () => {
        if (!id) return;
        setShowDeleteDialog(true);
    };

    const confirmDelete = async () => {
        setShowDeleteDialog(false);
        setIsDeleting(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/fleet/drivers/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to delete driver');
            }

            alert('Motorista excluído com sucesso!');
            navigate('/admin/motoristas');
        } catch (error) {
            console.error("Erro ao excluir motorista:", error);
            alert('Erro ao excluir motorista. Por favor, tente novamente.');
        } finally {
            setIsDeleting(false);
        }
    };

    const verificarValidade = (dataValidade: string) => {
        const hoje = new Date();
        const validade = new Date(dataValidade);
        const diasRestantes = Math.floor((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

        if (diasRestantes < 0) return { texto: 'Vencido', cor: 'red' };
        if (diasRestantes < 30) return { texto: `${diasRestantes} dias`, cor: 'orange' };
        return { texto: formatDate(dataValidade), cor: 'green' };
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">
                    Autenticando e carregando perfil...
                </p>
            </div>
        );
    }

    if (!motorista) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
                <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500">
                    <User size={40} />
                </div>
                <div className="text-center">
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Motorista não localizado</h3>
                    <p className="text-muted-foreground font-medium mt-1">O registro solicitado não existe em nossa base de dados.</p>
                </div>
                <Button onClick={() => navigate('/admin/motoristas')} variant="outline" className="h-12 px-8 font-black uppercase text-[11px] tracking-widest rounded-sm">
                    Voltar para Listagem
                </Button>
            </div>
        );
    }

    const cnhValidade = verificarValidade(motorista.validade_cnh);
    const passaporteValidade = motorista.validade_passaporte ? verificarValidade(motorista.validade_passaporte) : null;

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
            {/* Action Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl p-8">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription className="text-base font-medium text-muted-foreground py-4 border-y border-border/50 my-4">
                            Você está prestes a remover <span className="text-foreground font-bold">{motorista.nome}</span> permanentemente.
                            Esta operação não pode ser revertida. Deseja prosseguir?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel className="h-12 px-6 rounded-sm font-black uppercase text-[11px] tracking-widest border-border hover:bg-muted transition-all">
                            Manter Registro
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="h-12 px-8 rounded-sm font-black uppercase text-[11px] tracking-widest bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20"
                        >
                            Confirmar Remoção
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Premium Header Container */}
            <div className="flex flex-col gap-10">
                {/* Top Nav & Actions */}
                {/* Header Module */}
                <PageHeader
                    title={motorista.nome}
                    subtitle={`Contratado em ${formatDate(motorista.data_contratacao)} • ID #${motorista.id?.slice(0, 8)}`}
                    suffix="MOTORISTA"
                    icon={User}
                    backLink="/admin/motoristas"
                    backLabel="Gestão de Operadores"
                    rightElement={
                        <div className="flex items-center gap-3">
                            <Badge className={cn(
                                "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border-none mr-4",
                                motorista.status === DriverStatus.AVAILABLE ? 'bg-emerald-500/10 text-emerald-600' :
                                    motorista.status === DriverStatus.IN_TRANSIT ? 'bg-blue-500/10 text-blue-600' :
                                        motorista.status === DriverStatus.ON_LEAVE ? 'bg-amber-500/10 text-amber-600' :
                                            'bg-rose-500/10 text-rose-600'
                            )}>
                                {motorista.status}
                            </Badge>
                            <Button
                                variant="outline"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="h-14 px-8 rounded-sm font-black uppercase text-[11px] tracking-widest border-border/50 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all duration-300"
                            >
                                <Trash2 size={18} className="mr-2" />
                                {isDeleting ? 'Excluindo...' : 'Excluir'}
                            </Button>
                            <Link to={`/admin/motoristas/${id}/editar`}>
                                <Button className="h-14 px-10 rounded-sm font-black uppercase text-[11px] tracking-widest bg-primary text-primary-foreground shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-300">
                                    <Edit size={18} className="mr-2" />
                                    Editar Registro
                                </Button>
                            </Link>
                        </div>
                    }
                />

                {/* Hero Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <DashboardCard
                        title="Categoria CNH"
                        value={motorista.categoria_cnh || '--'}
                        icon={CreditCard}
                        variant="indigo"
                        footer="Qualificação técnica"
                    />
                    <DashboardCard
                        title="Contratado em"
                        value={formatDate(motorista.data_contratacao)}
                        icon={Calendar}
                        variant="indigo"
                        footer="Tempo de casa"
                    />
                    <DashboardCard
                        title="Rota Internacional"
                        value={motorista.disponivel_internacional ? 'APTO' : 'INAPTO'}
                        icon={Globe}
                        variant="indigo"
                        footer="Alcance operacional"
                    />
                    <DashboardCard
                        title="Total de Viagens"
                        value={motorista.viagens_internacionais || '0'}
                        icon={Award}
                        variant="indigo"
                        footer="Experiência acumulada"
                    />
                </div>
            </div>

            <Tabs defaultValue="perfil" value={activeTab} onValueChange={setActiveTab} className="w-full space-y-10">
                <Card className="p-2 bg-card   border border-border/50 rounded-[2.5rem] shadow-2xl shadow-primary/5">
                    <TabsList className="w-full h-20 bg-transparent flex gap-2 p-2">
                        <TabsTrigger
                            value="perfil"
                            className="flex-1 h-full rounded-sm font-black uppercase text-[11px] tracking-[0.2em] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-500"
                        >
                            <User size={18} className="mr-2" />
                            Perfil do Operador
                        </TabsTrigger>
                        <TabsTrigger
                            value="documentacao"
                            className="flex-1 h-full rounded-sm font-black uppercase text-[11px] tracking-[0.2em] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-500"
                        >
                            <ShieldCheck size={18} className="mr-2" />
                            Certificações & Docs
                        </TabsTrigger>
                        <TabsTrigger
                            value="logs"
                            className="flex-1 h-full rounded-sm font-black uppercase text-[11px] tracking-[0.2em] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-500"
                        >
                            <History size={18} className="mr-2" />
                            Histórico de Operação
                        </TabsTrigger>
                    </TabsList>
                </Card>

                <Card className="bg-card border border-border/50 rounded-[3rem] shadow-2xl shadow-primary/5 min-h-[500px] overflow-hidden">
                    <div className="p-8">
                        <TabsContent value="perfil" className="m-0 focus-visible:outline-none">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in duration-700">
                                <div className="space-y-10 focus-visible:outline-none">
                                    <div className="space-y-6">
                                        <h3 className="text-section-header flex items-center gap-2">
                                            <User size={16} className="text-primary" /> Identificação & Status
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-muted p-8 rounded-[2rem] border border-border/30">
                                            <div className="space-y-1">
                                                <p className="text-label-caps">E-mail Corporativo</p>
                                                <p className="text-base font-bold text-foreground">{motorista.email || '-'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-label-caps">Telefone de Contato</p>
                                                <p className="text-base font-bold text-foreground">{motorista.telefone || '-'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-label-caps">Data de Admissão</p>
                                                <p className="text-base font-bold text-foreground">
                                                    {motorista.data_contratacao ? formatDate(motorista.data_contratacao) : '-'}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-label-caps">Capacitação Operacional</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge className="bg-purple-500/10 text-purple-600 border-none font-black uppercase text-[10px] tracking-widest px-3">
                                                        CAT. {motorista.categoria_cnh || 'N/A'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-section-header flex items-center gap-2">
                                            <MapPinned size={16} className="text-primary" /> Endereço Residencial
                                        </h3>
                                        <div className="space-y-6 bg-card p-8 rounded-[2rem] border border-border/50 shadow-sm">
                                            <div className="space-y-1">
                                                <p className="text-label-caps">Logradouro / Complemento</p>
                                                <p className="text-base font-bold text-foreground">{motorista.endereco || '-'}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-1">
                                                    <p className="text-label-caps">Cidade / UF</p>
                                                    <p className="text-sm font-bold text-foreground">
                                                        {motorista.cidade || '-'}{motorista.estado ? ` - ${motorista.estado}` : ''}
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-label-caps">País de Origem</p>
                                                    <p className="text-sm font-bold text-foreground">{motorista.pais || '-'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    <div className="space-y-6">
                                        <h3 className="text-section-header flex items-center gap-2">
                                            <Award size={16} className="text-primary" /> Qualificações & Competências
                                        </h3>
                                        <div className="space-y-6 bg-muted p-8 rounded-[2rem] border border-border/30">
                                            <div className="flex items-center justify-between p-4 bg-background/50 rounded-sm border border-border/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-sm bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                                        <Globe size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-label-caps">Operação Internacional</p>
                                                        <p className="text-sm font-black text-foreground">{motorista.disponivel_internacional ? 'HABILITADO' : 'NÃO HABILITADO'}</p>
                                                    </div>
                                                </div>
                                                {motorista.disponivel_internacional ? (
                                                    <CheckCircle2 size={20} className="text-emerald-500" />
                                                ) : (
                                                    <XCircle size={20} className="text-muted-foreground/30" />
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3 p-4 bg-background/50 rounded-sm border border-border/50">
                                                <div className="w-10 h-10 rounded-sm bg-blue-500/10 text-blue-600 flex items-center justify-center">
                                                    <Briefcase size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-label-caps">Roteiros Realizados</p>
                                                    <p className="text-sm font-black text-foreground">{motorista.viagens_internacionais || 0} Viagens Internacionais</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-section-header flex items-center gap-2">
                                            <Info size={16} className="text-primary" /> Observações Internas
                                        </h3>
                                        <div className="bg-card p-6 rounded-sm border border-border/50 text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic shadow-sm">
                                            "{motorista.observacoes || 'Nenhuma observação ou restrição registrada para este perfil.'}"
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="documentacao" className="m-0 focus-visible:outline-none">
                            <div className="space-y-10 animate-in fade-in duration-700">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* CNH Card */}
                                    <div className="group relative overflow-hidden bg-card border border-border rounded-[3rem] p-10 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                                        <div className="absolute top-0 right-0 p-8 text-primary/5 group-hover:text-primary/10 transition-colors">
                                            <CreditCard size={120} />
                                        </div>
                                        <div className="relative z-10 space-y-8">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-primary/10 rounded-sm flex items-center justify-center text-primary">
                                                        <ShieldCheck size={24} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-black text-foreground tracking-tight uppercase">CNH Profissional</h4>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Carteira Nacional de Habilitação</p>
                                                    </div>
                                                </div>
                                                <Badge className="h-8 px-4 rounded-sm bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest">
                                                    CATEGORIA {motorista.categoria_cnh}
                                                </Badge>
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-label-caps">Número do Registro</p>
                                                <p className="text-3xl font-black text-foreground tracking-widest font-mono">{motorista.cnh}</p>
                                            </div>

                                            <div className="flex items-center justify-between pt-8 border-t border-border/50">
                                                <div className="space-y-1">
                                                    <p className="text-label-caps">Expiração do Documento</p>
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn(
                                                            "w-2 h-2 rounded-full",
                                                            cnhValidade.cor === 'red' ? 'bg-rose-500 animate-pulse' :
                                                                cnhValidade.cor === 'orange' ? 'bg-amber-500' : 'bg-emerald-500'
                                                        )} />
                                                        <p className={cn(
                                                            "text-base font-black",
                                                            cnhValidade.cor === 'red' ? 'text-rose-600' :
                                                                cnhValidade.cor === 'orange' ? 'text-amber-600' : 'text-emerald-600'
                                                        )}>
                                                            {cnhValidade.texto}
                                                        </p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Passaporte Card */}
                                    <div className={cn(
                                        "group relative overflow-hidden border rounded-[3rem] p-10 transition-all duration-500",
                                        motorista.passaporte
                                            ? "bg-card border-border hover:shadow-2xl hover:shadow-primary/5"
                                            : "bg-muted border-dashed border-border/50 opacity-60"
                                    )}>
                                        <div className="absolute top-0 right-0 p-8 text-primary/5 group-hover:text-primary/10 transition-colors text-right">
                                            <Globe size={120} />
                                        </div>
                                        <div className="relative z-10 space-y-8">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-sm flex items-center justify-center",
                                                        motorista.passaporte ? "bg-blue-500/10 text-blue-600" : "bg-muted text-muted-foreground"
                                                    )}>
                                                        <Globe size={24} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-section-header">Passaporte</h4>
                                                        <p className="text-section-description">Documentação Internacional</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-label-caps">Número do Documento</p>
                                                <p className="text-3xl font-black text-foreground tracking-widest font-mono">
                                                    {motorista.passaporte || 'NÃO REGISTRADO'}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between pt-8 border-t border-border/50">
                                                {passaporteValidade ? (
                                                    <div className="space-y-1">
                                                        <p className="text-label-caps">Validade do Visto/Registro</p>
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn(
                                                                "w-2 h-2 rounded-full",
                                                                passaporteValidade.cor === 'red' ? 'bg-rose-500 animate-pulse' :
                                                                    passaporteValidade.cor === 'orange' ? 'bg-amber-500' : 'bg-emerald-500'
                                                            )} />
                                                            <p className={cn(
                                                                "text-base font-black",
                                                                passaporteValidade.cor === 'red' ? 'text-rose-600' :
                                                                    passaporteValidade.cor === 'orange' ? 'text-amber-600' : 'text-emerald-600'
                                                            )}>
                                                                {passaporteValidade.texto}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-muted-foreground py-2">
                                                        <AlertCircle size={16} />
                                                        <span className="text-[11px] font-bold uppercase tracking-widest">Sem validade registrada</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="logs" className="m-0 focus-visible:outline-none">
                            <div className="flex flex-col items-center justify-center py-32 space-y-6 animate-in fade-in duration-700">
                                <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center text-primary/20">
                                    <History size={48} />
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-section-header">Registro de Operações</h3>
                                    <p className="text-muted-foreground text-sm max-w-sm mx-auto font-medium">
                                        O histórico detalhado de viagens e checkpoints para este motorista está sendo processado e estará disponível em breve.
                                    </p>
                                </div>
                                <Badge variant="outline" className="px-6 py-2 border-primary/20 bg-primary/5 text-primary rounded-full text-[10px] font-black uppercase tracking-[0.3e] animate-pulse">
                                    Módulo em Desenvolvimento
                                </Badge>
                            </div>
                        </TabsContent>
                    </div>
                </Card>
            </Tabs>
        </div >
    );
};
