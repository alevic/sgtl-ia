import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ICliente, IInteracao, INota, IReserva, TipoDocumento, Moeda, TipoAssento, ReservationStatusLabel, TipoInteracao, TipoInteracaoLabel } from '../../types';
import { useAppContext } from '../context/AppContext';
import { SwissDatePicker } from '../components/Form/SwissDatePicker';
import {
    ArrowLeft, User, Mail, Phone, MapPin, Calendar, DollarSign,
    FileText, MessageSquare, History, Star, Edit, Plus, Check, X,
    TrendingUp, Award, CreditCard, ShieldCheck, Clock
} from 'lucide-react';
import { PageHeader } from '../components/Layout/PageHeader';
import { DashboardCard } from '../components/Layout/DashboardCard';
import { cn } from '../lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { clientsService } from '../services/clientsService';
import { reservationsService } from '../services/reservationsService';

// Mock Data
const MOCK_CLIENTE: ICliente = {
    id: '1',
    tipo_cliente: 'PESSOA_FISICA' as any,
    nome: 'Maria Oliveira Santos',
    email: 'maria.santos@email.com',
    telefone: '(11) 98765-4321',
    saldo_creditos: 250,
    historico_viagens: 15,
    documento_tipo: TipoDocumento.CPF,
    documento: '123.456.789-00',
    nacionalidade: 'Brasileira',
    data_cadastro: '2022-03-15',
    data_nascimento: '1985-06-20',
    endereco: 'Rua das Flores, 123, Apto 45',
    cidade: 'São Paulo',
    estado: 'SP',
    pais: 'Brasil',
    segmento: 'VIP',
    tags: ['Frequente', 'Turismo', 'Fidelidade'],
    ultima_viagem: '2023-10-15',
    valor_total_gasto: 8500.00,
    observacoes: 'Cliente preferencial, sempre viaja em datas comemorativas'
};

const MOCK_INTERACOES: IInteracao[] = [
    {
        id: '1',
        cliente_id: '1',
        tipo: TipoInteracao.EMAIL,
        descricao: 'Enviado confirmação de reserva para viagem SP-Florianópolis',
        data_hora: '2023-10-14T10:30:00',
        usuario_responsavel: 'Sistema'
    },
    {
        id: '2',
        cliente_id: '1',
        tipo: TipoInteracao.PHONE,
        descricao: 'Cliente ligou para confirmar horário de embarque',
        data_hora: '2023-10-13T14:15:00',
        usuario_responsavel: 'João - Atendimento'
    },
    {
        id: '3',
        cliente_id: '1',
        tipo: TipoInteracao.WHATSAPP,
        descricao: 'Enviada promoção de Natal - 20% de desconto',
        data_hora: '2023-10-01T09:00:00',
        usuario_responsavel: 'Marketing'
    }
];

const MOCK_NOTAS: INota[] = [
    {
        id: '1',
        cliente_id: '1',
        titulo: 'Cliente VIP - Preferências',
        conteudo: 'Sempre prefere assento próximo à janela. Gosta de viajar à noite.',
        data_criacao: '2023-09-15T10:00:00',
        criado_por: 'Ana - Gerente',
        importante: true
    },
    {
        id: '2',
        cliente_id: '1',
        titulo: 'Feedback positivo',
        conteudo: 'Cliente elogiou atendimento na última viagem. Muito satisfeita com o serviço.',
        data_criacao: '2023-10-16T11:30:00',
        criado_por: 'João - Atendimento',
        importante: false
    }
];


export const ClienteDetalhes: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAppContext();
    const [activeTab, setActiveTab] = useState<'perfil' | 'historico' | 'interacoes' | 'notas'>('perfil');
    const [cliente, setCliente] = useState<ICliente | null>(null);
    const [interacoes, setInteracoes] = useState<IInteracao[]>([]);
    const [notas, setNotas] = useState<INota[]>([]);
    const [reservas, setReservas] = useState<IReserva[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal states
    const [showInteractionModal, setShowInteractionModal] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);

    // New item states
    const [newInteraction, setNewInteraction] = useState({ tipo: TipoInteracao.PHONE, descricao: '' });
    const [newNote, setNewNote] = useState({ titulo: '', conteudo: '', importante: false });

    const getTipoIcon = (tipo: TipoInteracao) => {
        switch (tipo) {
            case TipoInteracao.EMAIL: return <Mail size={16} className="text-blue-600" />;
            case TipoInteracao.PHONE: return <Phone size={16} className="text-green-600" />;
            case TipoInteracao.WHATSAPP: return <MessageSquare size={16} className="text-green-600" />;
            case TipoInteracao.IN_PERSON: return <User size={16} className="text-purple-600" />;
            case TipoInteracao.SYSTEM: return <History size={16} className="text-slate-600" />;
            default: return <MessageSquare size={16} className="text-slate-600" />;
        }
    };

    const fetchData = async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            console.log('Fetching client details for ID:', id);
            const [clientData, interactionsData, notesData, reservationsData] = await Promise.all([
                clientsService.getById(id),
                clientsService.getInteractions(id),
                clientsService.getNotes(id),
                reservationsService.getAll({ client_id: id })
            ]);

            setCliente(clientData);
            setInteracoes(interactionsData);
            setNotas(notesData);

            // Map backend fields to frontend interface
            const mappedReservations = reservationsData.map((res: any) => ({
                id: res.id,
                codigo: res.ticket_code,
                viagem_id: res.trip_id,
                data_reserva: res.created_at,
                status: res.status,
                valor_total: Number(res.price),
                moeda: 'BRL', // Default to BRL
                assento_numero: res.seat_number,
                trip_title: res.trip_title,
                departure_date: res.departure_date,
                departure_time: res.departure_time
            }));

            setReservas(mappedReservations);

        } catch (error) {
            console.error('Error fetching client details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const handleAddInteraction = async () => {
        if (!id) return;
        try {
            const addedInteraction = await clientsService.addInteraction(id, {
                ...newInteraction,
                usuario_responsavel: user.name
            });

            setInteracoes([addedInteraction, ...interacoes]);
            setShowInteractionModal(false);
            setNewInteraction({ tipo: TipoInteracao.PHONE, descricao: '' });
        } catch (error) {
            console.error('Error adding interaction:', error);
        }
    };

    const handleAddNote = async () => {
        if (!id) return;
        try {
            const addedNote = await clientsService.addNote(id, {
                ...newNote,
                criado_por: user.name
            });

            setNotas([addedNote, ...notas]);
            setShowNoteModal(false);
            setNewNote({ titulo: '', conteudo: '', importante: false });
        } catch (error) {
            console.error('Error adding note:', error);
        }
    };


    if (isLoading) {
        return <div className="p-8 text-center">Carregando...</div>;
    }

    if (!cliente) {
        return <div className="p-8 text-center">Cliente não encontrado</div>;
    }

    const tabs = [
        { id: 'perfil', label: 'Informações', icon: User },
        { id: 'historico', label: 'Histórico', icon: History },
        { id: 'interacoes', label: 'Interações', icon: MessageSquare },
        { id: 'notas', label: 'Notas', icon: FileText }
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-10 px-8">
            {/* Header Executivo */}
            {/* Header Module */}
            <PageHeader
                title={cliente.nome}
                subtitle={`Membro desde ${new Date(cliente.data_cadastro).getFullYear()} • ID #${cliente.id}`}
                suffix="PERFIL"
                icon={User}
                backLink="/admin/clientes"
                backLabel="Gestão de Clientes"
                rightElement={
                    <div className="flex items-center gap-3">
                        {cliente.segmento === 'VIP' && (
                            <Badge className="bg-amber-500/10 text-amber-600 border-none rounded-full px-4 py-2 font-bold flex items-center gap-2 uppercase text-[10px] tracking-widest mr-4">
                                <Award size={14} fill="currentColor" />
                                Cliente VIP
                            </Badge>
                        )}
                        <Button
                            variant="outline"
                            onClick={() => navigate(`/admin/clientes/${id}/editar`)}
                            className="h-14 rounded-sm px-6 font-black uppercase text-[12px] tracking-widest border-border bg-card hover:bg-card transition-all"
                        >
                            <Edit size={16} className="mr-2" />
                            Editar Cadastro
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => setActiveTab('interacoes')}
                            className="h-14 rounded-sm px-6 font-black uppercase text-[12px] tracking-widest bg-secondary/50 hover:bg-secondary transition-all"
                        >
                            <MessageSquare size={16} className="mr-2" />
                            Registrar Contato
                        </Button>
                    </div>
                }
            />

            {/* Stats Hero - Premium Cards */}
            {/* Dashboard Analytics Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <DashboardCard
                    title="Volume de Viagens"
                    value={cliente.historico_viagens || 0}
                    icon={TrendingUp}
                    variant="indigo"
                    footer="Viagens realizadas"
                />
                <DashboardCard
                    title="Saldo Disponível"
                    value={(cliente.saldo_creditos || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    icon={CreditCard}
                    variant="indigo"
                    footer="Créditos em conta"
                />
                <DashboardCard
                    title="Investimento Total"
                    value={(cliente.valor_total_gasto || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    icon={DollarSign}
                    variant="indigo"
                    footer="Total faturado"
                />
                <DashboardCard
                    title="Atividade Recente"
                    value={cliente.ultima_viagem ? new Date(cliente.ultima_viagem).toLocaleDateString('pt-BR') : 'Sem registro'}
                    icon={Clock}
                    variant="indigo"
                    footer="Última movimentação"
                />
            </div>

            {/* Main Tabs UI */}
            <Tabs defaultValue="perfil" value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <Card className="bg-card border-none shadow-2xl shadow-muted/20 overflow-hidden rounded-[2rem]">
                    <div className="px-6 pt-6">
                        <TabsList className="bg-muted p-1.5 rounded-sm h-16 flex w-full md:w-fit border border-border/50">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <TabsTrigger
                                        key={tab.id}
                                        value={tab.id}
                                        className="flex-1 md:px-8 py-3 rounded-sm font-black uppercase text-[11px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg flex items-center justify-center gap-2 transition-all"
                                    >
                                        <Icon size={16} />
                                        <span className="hidden sm:inline">{tab.label}</span>
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>
                    </div>

                    <div className="p-8">
                        <TabsContent value="perfil" className="m-0 focus-visible:outline-none">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in duration-700">
                                <div className="space-y-10 focus-visible:outline-none">
                                    <div className="space-y-6">
                                        <h3 className="text-section-header flex items-center gap-2">
                                            <User size={16} className="text-primary" /> Informações do Titular
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-muted p-8 rounded-[2rem] border border-border/30">
                                            <div className="space-y-1">
                                                <p className="text-label-caps">Endereço de E-mail</p>
                                                <p className="text-base font-bold text-foreground">{cliente.email || '-'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-label-caps">Telefone de Contato</p>
                                                <p className="text-base font-bold text-foreground">{cliente.telefone || '-'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-label-caps">Data de Nascimento</p>
                                                <p className="text-base font-bold text-foreground">
                                                    {cliente.data_nascimento ? new Date(cliente.data_nascimento).toLocaleDateString('pt-BR') : '-'}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-label-caps">Nivel de Fidelidade</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge className="bg-purple-500/10 text-purple-600 border-none font-black uppercase text-[10px] tracking-widest px-3">
                                                        {cliente.segmento || 'REGULAR'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-section-header flex items-center gap-2">
                                            <ShieldCheck size={16} className="text-primary" /> Documentação Legal
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-card p-8 rounded-[2rem] border border-border/50 shadow-sm">
                                            <div className="space-y-1">
                                                <p className="text-label-caps">Tipo de Identidade</p>
                                                <p className="text-base font-bold text-foreground">{cliente.documento_tipo || '-'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-label-caps">Número do Registro</p>
                                                <p className="text-base font-bold text-foreground">{cliente.documento || '-'}</p>
                                            </div>
                                            <div className="sm:col-span-2 space-y-1 pt-2 border-t border-border/30">
                                                <p className="text-label-caps">Nacionalidade Declarada</p>
                                                <p className="text-base font-bold text-foreground">{cliente.nacionalidade || '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    <div className="space-y-6">
                                        <h3 className="text-section-header flex items-center gap-2">
                                            <MapPin size={16} className="text-primary" /> Localização Residencial
                                        </h3>
                                        <div className="space-y-6 bg-muted p-8 rounded-[2rem] border border-border/30">
                                            <div className="space-y-1">
                                                <p className="text-label-caps">Logradouro / Complemento</p>
                                                <p className="text-base font-bold text-foreground">{cliente.endereco || '-'}</p>
                                            </div>
                                            <div className="grid grid-cols-3 gap-6">
                                                <div className="space-y-1">
                                                    <p className="text-label-caps">Cidade</p>
                                                    <p className="text-sm font-bold text-foreground">{cliente.cidade || '-'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-label-caps">Estado</p>
                                                    <p className="text-sm font-bold text-foreground">{cliente.estado || '-'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-label-caps">País</p>
                                                    <p className="text-sm font-bold text-foreground">{cliente.pais || '-'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-section-header flex items-center gap-2">
                                            <MessageSquare size={16} className="text-primary" /> Notas Internas
                                        </h3>
                                        <div className="bg-card p-6 rounded-sm border border-border/50 text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic shadow-sm">
                                            "{cliente.observacoes || 'Nenhuma observação registrada para este perfil.'}"
                                        </div>
                                    </div>

                                    {cliente.tags && cliente.tags.length > 0 && (
                                        <div className="space-y-4">
                                            <h3 className="text-section-header">Classificação do Perfil</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {cliente.tags.map((tag, index) => (
                                                    <Badge key={index} className="px-4 py-1.5 bg-primary/10 text-primary border-none rounded-full text-[10px] font-black uppercase tracking-widest">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="historico" className="m-0 focus-visible:outline-none">
                            <div className="space-y-8 animate-in fade-in duration-700">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-section-header">Registro de Viagens</h3>
                                        <p className="text-section-description mt-0.5">Histórico completo de reservas confirmadas</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {reservas.length === 0 ? (
                                        <div className="text-center py-20 bg-muted rounded-[2rem] border border-dashed border-border/50">
                                            <History size={48} className="mx-auto text-muted-foreground/30 mb-6" />
                                            <p className="text-muted-foreground font-medium">Este cliente ainda não realizou viagens.</p>
                                        </div>
                                    ) : (
                                        reservas.map((reserva) => (
                                            <div
                                                key={reserva.id}
                                                className="group bg-card p-6 rounded-[2rem] border border-border/50 hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/5 relative overflow-hidden"
                                            >
                                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-12 h-12 bg-primary/10 rounded-sm flex items-center justify-center text-primary font-black">
                                                            {reserva.assento_numero || '--'}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <p className="text-sm font-black text-foreground uppercase tracking-tight">{reserva.codigo}</p>
                                                                <Badge className={cn(
                                                                    "text-[9px] font-black uppercase tracking-tighter border-none px-2",
                                                                    reserva.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-600' :
                                                                        reserva.status === 'CANCELLED' ? 'bg-rose-500/10 text-rose-600' : 'bg-blue-500/10 text-blue-600'
                                                                )}>
                                                                    {ReservationStatusLabel[reserva.status as any] || reserva.status}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-base font-bold text-foreground line-clamp-1">
                                                                {reserva.trip_title || 'Viagem Executiva'}
                                                            </p>
                                                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                                                                {reserva.departure_date ? new Date(reserva.departure_date).toLocaleDateString('pt-BR') : ''} • {reserva.departure_time?.substring(0, 5)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-border/30">
                                                        <p className="text-label-caps mb-1">Valor do Ticket</p>
                                                        <p className="text-2xl font-black text-foreground tracking-tighter">
                                                            {reserva.moeda} {(reserva.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="interacoes" className="m-0 focus-visible:outline-none">
                            <div className="space-y-8 animate-in fade-in duration-700">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <h3 className="text-section-header">Linha do Tempo</h3>
                                        <p className="text-section-description mt-0.5">Rastreamento de pontos de contato e suporte</p>
                                    </div>
                                    <Button
                                        onClick={() => setShowInteractionModal(true)}
                                        className="h-12 rounded-sm px-6 font-black uppercase text-[11px] tracking-widest bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                                    >
                                        <Plus size={18} className="mr-2" />
                                        Registrar Contato
                                    </Button>
                                </div>

                                {showInteractionModal && (
                                    <div className="bg-card p-8 rounded-[2rem] border-2 border-primary/20 shadow-xl animate-in slide-in-from-top-4 duration-300">
                                        <h4 className="text-sm font-black text-foreground uppercase tracking-widest mb-6">Nova Ocorrência</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Canal de Comunicação</label>
                                                <select
                                                    value={newInteraction.tipo}
                                                    onChange={(e) => setNewInteraction({ ...newInteraction, tipo: e.target.value as TipoInteracao })}
                                                    className="w-full h-14 px-4 rounded-sm border border-border bg-background font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                                                >
                                                    <option value={TipoInteracao.PHONE}>Telefone</option>
                                                    <option value={TipoInteracao.EMAIL}>E-mail</option>
                                                    <option value={TipoInteracao.WHATSAPP}>WhatsApp</option>
                                                    <option value={TipoInteracao.IN_PERSON}>Atendimento Presencial</option>
                                                    <option value={TipoInteracao.SYSTEM}>Log de Sistema</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Resumo da Conversa</label>
                                                <input
                                                    type="text"
                                                    value={newInteraction.descricao}
                                                    onChange={(e) => setNewInteraction({ ...newInteraction, descricao: e.target.value })}
                                                    className="w-full h-14 px-4 rounded-sm border border-border bg-background font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                                    placeholder="Descreva brevemente o motivo do contato..."
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-border/30">
                                            <Button variant="ghost" onClick={() => setShowInteractionModal(false)} className="h-12 font-black uppercase text-[11px] tracking-widest rounded-sm">
                                                Descartar
                                            </Button>
                                            <Button onClick={handleAddInteraction} className="h-12 px-8 font-black uppercase text-[11px] tracking-widest rounded-sm">
                                                Confirmar Registro
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {interacoes.map((interacao) => (
                                        <div
                                            key={interacao.id}
                                            className="group relative pl-8 pb-8 border-l-2 border-border last:pb-0"
                                        >
                                            <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-background border-2 border-primary group-hover:bg-primary transition-colors" />
                                            <div className="bg-card p-6 rounded-[2rem] border border-border/50 hover:border-primary/30 transition-all shadow-sm">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2.5 bg-muted rounded-sm text-muted-foreground group-hover:text-primary transition-colors">
                                                            {getTipoIcon(interacao.tipo)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-foreground uppercase tracking-tight">
                                                                {TipoInteracaoLabel[interacao.tipo] || interacao.tipo}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                                <Clock size={10} /> {new Date(interacao.data_hora).toLocaleString('pt-BR')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {interacao.usuario_responsavel && (
                                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-border/50 px-3 opacity-60">
                                                            Operador: {interacao.usuario_responsavel}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                                                    {interacao.descricao}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="notas" className="m-0 focus-visible:outline-none">
                            <div className="space-y-8 animate-in fade-in duration-700">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <h3 className="text-section-header">Base de Conhecimento</h3>
                                        <p className="text-section-description mt-0.5">Observações estratégicas e diretrizes de atendimento</p>
                                    </div>
                                    <Button
                                        onClick={() => setShowNoteModal(true)}
                                        className="h-12 rounded-sm px-6 font-black uppercase text-[11px] tracking-widest bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                                    >
                                        <Plus size={18} className="mr-2" />
                                        Criar Nota
                                    </Button>
                                </div>

                                {showNoteModal && (
                                    <div className="bg-card p-8 rounded-[2rem] border-2 border-primary/20 shadow-xl animate-in slide-in-from-top-4 duration-300">
                                        <h4 className="text-sm font-black text-foreground uppercase tracking-widest mb-6">Redigir Nova Nota</h4>
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Assunto / Titulo</label>
                                                <input
                                                    type="text"
                                                    value={newNote.titulo}
                                                    onChange={(e) => setNewNote({ ...newNote, titulo: e.target.value })}
                                                    className="w-full h-14 px-4 rounded-sm border border-border bg-background font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                                    placeholder="Ponto focal da observação..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Conteúdo Detalhado</label>
                                                <textarea
                                                    value={newNote.conteudo}
                                                    onChange={(e) => setNewNote({ ...newNote, conteudo: e.target.value })}
                                                    className="w-full p-4 rounded-sm border border-border bg-background font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none min-h-[120px]"
                                                    placeholder="Descreva os detalhes importantes..."
                                                />
                                            </div>
                                            <div className="flex items-center gap-3 bg-muted p-4 rounded-sm border border-border/50 w-fit">
                                                <input
                                                    type="checkbox"
                                                    id="importante"
                                                    checked={newNote.importante}
                                                    onChange={(e) => setNewNote({ ...newNote, importante: e.target.checked })}
                                                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                                />
                                                <label htmlFor="importante" className="text-xs font-black uppercase tracking-widest text-foreground cursor-pointer flex items-center gap-2">
                                                    <Star size={14} className={newNote.importante ? "text-amber-500 fill-amber-500" : "text-muted-foreground"} />
                                                    Marcar como Prioritária
                                                </label>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-border/30">
                                            <Button variant="ghost" onClick={() => setShowNoteModal(false)} className="h-12 font-black uppercase text-[11px] tracking-widest rounded-sm">
                                                Cancelar
                                            </Button>
                                            <Button onClick={handleAddNote} className="h-12 px-8 font-black uppercase text-[11px] tracking-widest rounded-sm">
                                                Salvar Nota
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {notas.map((nota) => (
                                        <div
                                            key={nota.id}
                                            className={cn(
                                                "group p-8 rounded-[2rem] border transition-all hover:shadow-xl relative",
                                                nota.importante
                                                    ? "bg-amber-500/5 border-amber-500/30 shadow-lg shadow-amber-500/5"
                                                    : "bg-card border-border/50 hover:border-primary/30"
                                            )}
                                        >
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-sm flex items-center justify-center transition-colors",
                                                        nota.importante ? "bg-amber-500/20 text-amber-600" : "bg-muted text-muted-foreground group-hover:text-primary"
                                                    )}>
                                                        <FileText size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-black text-foreground uppercase tracking-tight">{nota.titulo}</h4>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                            {new Date(nota.data_criacao).toLocaleDateString('pt-BR')}
                                                        </p>
                                                    </div>
                                                </div>
                                                {nota.importante && (
                                                    <Star size={16} className="text-amber-500 fill-amber-500" />
                                                )}
                                            </div>
                                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                                                {nota.conteudo}
                                            </p>
                                            <div className="flex items-center justify-between pt-6 border-t border-border/30">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black uppercase">
                                                        {nota.criado_por?.[0]}
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                        {nota.criado_por}
                                                    </span>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Edit size={14} />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>
                    </div>
                </Card>
            </Tabs>
        </div>
    );
};
