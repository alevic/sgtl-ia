import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { EmpresaContexto, TipoTransacao, CategoriaReceita, CategoriaDespesa } from '../../types';
import {
    ArrowLeft, Download, TrendingUp, TrendingDown, DollarSign, Calendar,
    FileText, PieChart, BarChart as BarChartIcon, Activity, Users, Truck,
    Package, MapPin, AlertTriangle, CheckCircle, Clock, LayoutDashboard,
    List, Search, ChevronLeft, Bus, MoreHorizontal
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart as RechartsPie, Pie, Cell, AreaChart, Area
} from 'recharts';
import { SwissDatePicker } from '../components/Form/SwissDatePicker';
import { PageHeader } from '../components/Layout/PageHeader';
import { DashboardCard } from '../components/Layout/DashboardCard';
import { ListFilterSection } from '../components/Layout/ListFilterSection';
import { cn } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "../components/ui/dialog";

export const Relatorios: React.FC = () => {
    const navigate = useNavigate();
    const { currentContext } = useApp();
    const [activeTab, setActiveTab] = useState<'gerencial' | 'operacional' | 'financeiro'>('gerencial');
    const [periodoInicio, setPeriodoInicio] = useState('2024-11-01');
    const [periodoFim, setPeriodoFim] = useState('2024-11-30');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('todos');
    const [selectedItem, setSelectedItem] = useState<any | null>(null);

    // --- MOCK DATA & LOGIC ---

    // Cores para Gráficos
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    // Dados Financeiros (Compartilhado/Adaptado)
    const mockTransacoes = useMemo(() => [
        { tipo: TipoTransacao.INCOME, valor: 350, categoria_receita: CategoriaReceita.VENDA_PASSAGEM, data_emissao: '2024-11-20' },
        { tipo: TipoTransacao.INCOME, valor: 5000, categoria_receita: CategoriaReceita.FRETAMENTO, data_emissao: '2024-11-23' },
        { tipo: TipoTransacao.INCOME, valor: 120, categoria_receita: CategoriaReceita.ENCOMENDA, data_emissao: '2024-11-15' },
        { tipo: TipoTransacao.EXPENSE, valor: 3500, categoria_despesa: CategoriaDespesa.COMBUSTIVEL, data_emissao: '2024-11-20' },
        { tipo: TipoTransacao.EXPENSE, valor: 1200, categoria_despesa: CategoriaDespesa.MANUTENCAO, data_emissao: '2024-11-15' },
        { tipo: TipoTransacao.EXPENSE, valor: 850, categoria_despesa: CategoriaDespesa.PECAS, data_emissao: '2024-11-18' },
        { tipo: TipoTransacao.EXPENSE, valor: 2200, categoria_despesa: CategoriaDespesa.SEGURO, data_emissao: '2024-11-01' },
    ], []);

    const analiseFinanceira = useMemo(() => {
        const receitas = mockTransacoes.filter(t => t.tipo === TipoTransacao.INCOME).reduce((sum, t) => sum + t.valor, 0);
        const despesas = mockTransacoes.filter(t => t.tipo === TipoTransacao.EXPENSE).reduce((sum, t) => sum + t.valor, 0);
        const lucroLiquido = receitas - despesas;
        const margemLucro = receitas > 0 ? (lucroLiquido / receitas) * 100 : 0;

        const receitasPorCategoria: Record<string, number> = {};
        const despesasPorCategoria: Record<string, number> = {};

        mockTransacoes.forEach(t => {
            if (t.tipo === TipoTransacao.INCOME && t.categoria_receita) {
                receitasPorCategoria[t.categoria_receita] = (receitasPorCategoria[t.categoria_receita] || 0) + t.valor;
            } else if (t.tipo === TipoTransacao.EXPENSE && t.categoria_despesa) {
                despesasPorCategoria[t.categoria_despesa] = (despesasPorCategoria[t.categoria_despesa] || 0) + t.valor;
            }
        });

        return { receitas, despesas, lucroLiquido, margemLucro, receitasPorCategoria, despesasPorCategoria };
    }, [mockTransacoes]);

    // Dados Gerenciais (Turismo)
    const dadosOcupacaoTurismo = [
        { nome: 'Sem 1', ocupacao: 65 },
        { nome: 'Sem 2', ocupacao: 72 },
        { nome: 'Sem 3', ocupacao: 85 },
        { nome: 'Sem 4', ocupacao: 78 },
    ];

    const dadosDestinosTurismo = [
        { nome: 'São Paulo', viagens: 45 },
        { nome: 'Rio de Janeiro', viagens: 32 },
        { nome: 'Curitiba', viagens: 28 },
        { nome: 'Belo Horizonte', viagens: 15 },
    ];

    // Dados Gerenciais (Express)
    const dadosEntregasExpress = [
        { name: 'No Prazo', value: 85 },
        { name: 'Atrasado', value: 10 },
        { name: 'Devolvido', value: 5 },
    ];

    const dadosVolumeExpress = [
        { nome: 'Sem 1', volume: 1200 },
        { nome: 'Sem 2', volume: 1450 },
        { nome: 'Sem 3', volume: 1300 },
        { nome: 'Sem 4', volume: 1600 },
    ];

    // Dados Operacionais (Mock)
    const manifestosTurismo = [
        { id: 'V001', rota: 'SP -> RJ', data: '25/11/2024', motorista: 'João Silva', passageiros: 42, status: 'Em Trânsito' },
        { id: 'V002', rota: 'RJ -> SP', data: '25/11/2024', motorista: 'Carlos Souza', passageiros: 38, status: 'Agendado' },
        { id: 'V003', rota: 'SP -> Curitiba', data: '26/11/2024', motorista: 'Ana Lima', passageiros: 25, status: 'Agendado' },
    ];

    const entregasExpress = [
        { id: 'E001', rota: 'Rota Norte', entregas: 45, pendentes: 12, status: 'Em Rota', motorista: 'Pedro Santos' },
        { id: 'E002', rota: 'Rota Sul', entregas: 32, pendentes: 0, status: 'Concluído', motorista: 'Marcos Oliveira' },
        { id: 'E003', rota: 'Rota Leste', entregas: 28, pendentes: 28, status: 'Carregando', motorista: 'Roberto Costa' },
    ];

    const filteredManifestos = useMemo(() => {
        return manifestosTurismo.filter(item => {
            const matchesSearch = item.rota.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.motorista.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'todos' ||
                (statusFilter === 'ativo' && item.status === 'Em Trânsito') ||
                (statusFilter === 'pendente' && item.status === 'Agendado') ||
                (statusFilter === 'concluido' && item.status === 'Concluído'); // Adjust mapping as needed
            return matchesSearch && matchesStatus;
        });
    }, [manifestosTurismo, searchTerm, statusFilter]);

    const filteredEntregas = useMemo(() => {
        return entregasExpress.filter(item => {
            const matchesSearch = item.rota.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.motorista.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'todos' ||
                (statusFilter === 'ativo' && item.status === 'Em Rota') ||
                (statusFilter === 'pendente' && (item.status === 'Carregando' || item.status === 'Pendente')) ||
                (statusFilter === 'concluido' && item.status === 'Concluído');
            return matchesSearch && matchesStatus;
        });
    }, [entregasExpress, searchTerm, statusFilter]);

    // --- HELPERS ---
    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatPercentage = (value: number) => value.toFixed(2) + '%';
    const themeColor = currentContext === EmpresaContexto.TURISMO ? 'blue' : 'orange';

    return (
        <div key="relatorios-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header Module */}
            {/* Header Module */}
            <PageHeader
                title="Relatórios & Análises"
                subtitle={`Visão estratégica: ${currentContext === EmpresaContexto.TURISMO ? 'Turismo B2C' : 'Logística Express'}`}
                icon={BarChartIcon}
                rightElement={
                    <div className="flex gap-2 items-center bg-card   p-1.5 rounded-sm border border-border/40 shadow-xl shadow-muted/10 h-14">
                        <SwissDatePicker
                            value={periodoInicio}
                            onChange={setPeriodoInicio}
                            showIcon={false}
                            className="!bg-transparent !border-none text-xs font-black !p-2 !h-auto w-24 uppercase tracking-tighter"
                        />
                        <Separator orientation="vertical" className="h-4 bg-border/50" />
                        <SwissDatePicker
                            value={periodoFim}
                            onChange={setPeriodoFim}
                            showIcon={false}
                            className="!bg-transparent !border-none text-xs font-black !p-2 !h-auto w-24 uppercase tracking-tighter"
                        />
                    </div>
                }
            />

            {/* Standardized Tabs */}
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
                <TabsList className="bg-muted p-1.5 rounded-[1.5rem] border border-border/50 h-14 w-full md:w-fit gap-2">
                    <TabsTrigger value="gerencial" className="rounded-sm px-8 h-11 font-black text-xs data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all gap-2">
                        <LayoutDashboard size={16} strokeWidth={2.5} />
                        GERENCIAL
                    </TabsTrigger>
                    <TabsTrigger value="operacional" className="rounded-sm px-8 h-11 font-black text-xs data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all gap-2">
                        <List size={16} strokeWidth={2.5} />
                        OPERACIONAL
                    </TabsTrigger>
                    <TabsTrigger value="financeiro" className="rounded-sm px-8 h-11 font-black text-xs data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all gap-2">
                        <DollarSign size={16} strokeWidth={2.5} />
                        FINANCEIRO
                    </TabsTrigger>
                </TabsList>

                <div className="mt-8">
                    <TabsContent value="gerencial" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Executive KPI Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <DashboardCard
                                title="Receita Total"
                                value={formatCurrency(analiseFinanceira.receitas)}
                                icon={DollarSign}
                                variant="emerald"
                                trend="+12.5% vs mês anterior"
                            />
                            <DashboardCard
                                title="Lucro Líquido"
                                value={formatCurrency(analiseFinanceira.lucroLiquido)}
                                icon={Activity}
                                variant={analiseFinanceira.lucroLiquido >= 0 ? "blue" : "rose"}
                                subtitle={`Margem: ${formatPercentage(analiseFinanceira.margemLucro)}`}
                            />
                            <DashboardCard
                                title={currentContext === EmpresaContexto.TURISMO ? 'Taxa de Ocupação' : 'Entregas no Prazo'}
                                value={currentContext === EmpresaContexto.TURISMO ? '78.5%' : '92.3%'}
                                icon={TrendingUp}
                                variant="indigo"
                            />
                            <DashboardCard
                                title="Frota Ativa"
                                value="8/10"
                                icon={Bus}
                                variant="amber"
                                trend="2 em manutenção"
                            />
                        </div>

                        {/* Executive Charts Grid */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            <Card className="border-none shadow-2xl shadow-muted/20 rounded-[2.5rem] bg-card   overflow-hidden">
                                <CardHeader className="p-8 pb-4">
                                    <CardTitle className="text-xl font-black tracking-tight flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-sm">
                                            <TrendingUp size={18} className="text-primary" />
                                        </div>
                                        {currentContext === EmpresaContexto.TURISMO ? 'Evolução da Ocupação' : 'Volume Transportado (kg)'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 pt-0">
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            {currentContext === EmpresaContexto.TURISMO ? (
                                                <LineChart data={dadosOcupacaoTurismo}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                                                    <XAxis dataKey="nome" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} dy={10} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                                    <RechartsTooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                                                    <Line type="monotone" dataKey="ocupacao" stroke="hsl(var(--primary))" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: 'white' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                                </LineChart>
                                            ) : (
                                                <AreaChart data={dadosVolumeExpress}>
                                                    <defs>
                                                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                                                    <XAxis dataKey="nome" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} dy={10} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                                    <RechartsTooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                                                    <Area type="monotone" dataKey="volume" stroke="hsl(var(--primary))" strokeWidth={4} fillOpacity={1} fill="url(#colorVolume)" />
                                                </AreaChart>
                                            )}
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-2xl shadow-muted/20 rounded-[2.5rem] bg-card   overflow-hidden">
                                <CardHeader className="p-8 pb-4">
                                    <CardTitle className="text-xl font-black tracking-tight flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-sm">
                                            <PieChart size={18} className="text-primary" />
                                        </div>
                                        {currentContext === EmpresaContexto.TURISMO ? 'Destinos Mais Populares' : 'Status de Entregas'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 pt-0">
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            {currentContext === EmpresaContexto.TURISMO ? (
                                                <BarChart data={dadosDestinosTurismo} layout="vertical" margin={{ left: 40 }}>
                                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--muted))" />
                                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                                    <YAxis dataKey="nome" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                                    <RechartsTooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                                                    <Bar dataKey="viagens" fill="hsl(var(--primary))" radius={[0, 10, 10, 0]} barSize={20} />
                                                </BarChart>
                                            ) : (
                                                <RechartsPieChart>
                                                    <Pie
                                                        data={dadosEntregasExpress}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={80}
                                                        outerRadius={100}
                                                        paddingAngle={8}
                                                        dataKey="value"
                                                    >
                                                        {dadosEntregasExpress.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                                        ))}
                                                    </Pie>
                                                    <RechartsTooltip contentStyle={{ borderRadius: '1rem', border: 'none' }} />
                                                    <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold', fontSize: '10px' }} />
                                                </RechartsPieChart>
                                            )}
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="operacional" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Executive Filters Module */}
                        <ListFilterSection>
                            <div className="relative w-full group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                                <Input
                                    placeholder="Buscar por rota, motorista ou ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-12 h-14 bg-muted border-input rounded-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary/20"
                                />
                            </div>

                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <Tabs value={statusFilter} onValueChange={setStatusFilter} className="bg-muted p-1.5 rounded-sm border border-border/50 flex-1 h-14">
                                    <TabsList className="bg-transparent h-full w-full gap-1">
                                        <TabsTrigger value="todos" className="flex-1 rounded-sm font-bold text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm">TODOS</TabsTrigger>
                                        <TabsTrigger value="ativo" className="flex-1 rounded-sm font-bold text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm">ANDAMENTO</TabsTrigger>
                                        <TabsTrigger value="pendente" className="flex-1 rounded-sm font-bold text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm">PENDENTE</TabsTrigger>
                                        <TabsTrigger value="concluido" className="flex-1 rounded-sm font-bold text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm">CONCLUÍDO</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                                <Button className="h-14 px-6 rounded-sm font-black gap-2 shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white">
                                    <FileText size={18} strokeWidth={2.5} />
                                    MANIFESTO
                                </Button>
                            </div>
                        </ListFilterSection>

                        {/* Executive Table Module */}
                        <Card className="border-none shadow-2xl shadow-muted/20 overflow-hidden rounded-[2.5rem] bg-card  ">
                            <Table>
                                <TableHeader className="bg-muted">
                                    <TableRow className="hover:bg-transparent border-border/50">
                                        <TableHead className="pl-8 h-14 text-[12px] font-black uppercase tracking-widest">Identificador</TableHead>
                                        <TableHead className="h-14 text-[12px] font-black uppercase tracking-widest">Rota / Itinerário</TableHead>
                                        <TableHead className="h-14 text-[12px] font-black uppercase tracking-widest">{currentContext === EmpresaContexto.TURISMO ? 'Passageiros' : 'Entregas'}</TableHead>
                                        <TableHead className="h-14 text-[12px] font-black uppercase tracking-widest">Condutor</TableHead>
                                        <TableHead className="h-14 text-[12px] font-black uppercase tracking-widest">Status</TableHead>
                                        <TableHead className="pr-8 h-14 text-[12px] font-black uppercase tracking-widest text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentContext === EmpresaContexto.TURISMO ? (
                                        filteredManifestos.map((item) => (
                                            <TableRow key={item.id} className="group hover:bg-muted border-border/30 transition-colors">
                                                <TableCell className="pl-8 py-5">
                                                    <span className="font-black text-sm text-foreground">#{item.id}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-bold text-sm text-foreground">{item.rota}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
                                                        <Users size={14} className="text-primary" />
                                                        {item.passageiros}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-medium text-sm text-muted-foreground">{item.motorista}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={cn(
                                                        "gap-1.5 font-bold px-2 py-0.5 rounded-sm border-none",
                                                        item.status === 'Em Trânsito' ? 'bg-blue-500/10 text-blue-600' :
                                                            item.status === 'Agendado' ? 'bg-muted text-muted-foreground' : 'bg-emerald-500/10 text-emerald-600'
                                                    )}>
                                                        <div className={cn("w-1.5 h-1.5 rounded-full",
                                                            item.status === 'Em Trânsito' ? 'bg-blue-500' :
                                                                item.status === 'Agendado' ? 'bg-muted-foreground' : 'bg-emerald-500'
                                                        )} />
                                                        {item.status.toUpperCase()}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="pr-8 text-right">
                                                    <Button variant="ghost" onClick={() => setSelectedItem(item)} className="h-9 px-4 rounded-sm font-bold text-xs hover:bg-primary/10 hover:text-primary">
                                                        DETALHES
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        filteredEntregas.map((item) => (
                                            <TableRow key={item.id} className="group hover:bg-muted border-border/30 transition-colors">
                                                <TableCell className="pl-8 py-5">
                                                    <span className="font-black text-sm text-foreground">#{item.id}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-bold text-sm text-foreground">{item.rota}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
                                                            <Package size={14} className="text-primary" />
                                                            {item.entregas}
                                                        </div>
                                                        <span className="text-[12px] font-bold text-muted-foreground/60 uppercase">{item.pendentes} Pendentes</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-medium text-sm text-muted-foreground">{item.motorista}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={cn(
                                                        "gap-1.5 font-bold px-2 py-0.5 rounded-sm border-none",
                                                        item.status === 'Em Rota' ? 'bg-blue-500/10 text-blue-600' :
                                                            item.status === 'Concluído' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                                                    )}>
                                                        <div className={cn("w-1.5 h-1.5 rounded-full",
                                                            item.status === 'Em Rota' ? 'bg-blue-500' :
                                                                item.status === 'Concluído' ? 'bg-emerald-500' : 'bg-amber-500'
                                                        )} />
                                                        {item.status.toUpperCase()}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="pr-8 text-right">
                                                    <Button variant="ghost" onClick={() => setSelectedItem(item)} className="h-9 px-4 rounded-sm font-bold text-xs hover:bg-primary/10 hover:text-primary">
                                                        RASTREAR
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </Card>

                        {/* Executive Secondary Views */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            <Card className="border-none shadow-2xl shadow-muted/20 rounded-[2.5rem] bg-card   overflow-hidden">
                                <CardHeader className="p-8 pb-4">
                                    <CardTitle className="text-xl font-black tracking-tight flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-sm">
                                            <Users size={18} className="text-primary" />
                                        </div>
                                        Escala de Motoristas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 pt-0 space-y-4">
                                    {[
                                        { nome: 'João Silva', status: 'Em Viagem', destino: 'Rio de Janeiro', retorno: '26/11' },
                                        { nome: 'Carlos Souza', status: 'Folga', destino: '-', retorno: '27/11' },
                                        { nome: 'Ana Lima', status: 'Aguardando', destino: 'Curitiba', retorno: '26/11' },
                                    ].map((mot, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-muted rounded-[1.5rem] border border-border/30">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                                                    {mot.nome.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm text-foreground">{mot.nome}</p>
                                                    <p className="text-[12px] font-bold text-muted-foreground uppercase">{mot.destino}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge className={cn(
                                                    "rounded-sm font-black text-[9px] uppercase tracking-tighter",
                                                    mot.status === 'Em Viagem' ? 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20' :
                                                        mot.status === 'Folga' ? 'bg-muted text-muted-foreground hover:bg-muted' : 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
                                                )}>
                                                    {mot.status}
                                                </Badge>
                                                <p className="text-[12px] font-medium text-muted-foreground/60 mt-1">VOLTA {mot.retorno}</p>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-2xl shadow-muted/20 rounded-[2.5rem] bg-card   overflow-hidden">
                                <CardHeader className="p-8 pb-4">
                                    <CardTitle className="text-xl font-black tracking-tight flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-sm">
                                            <AlertTriangle size={18} className="text-primary" />
                                        </div>
                                        Alertas de Manutenção
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 pt-0 space-y-4">
                                    <div className="flex items-start gap-4 p-5 bg-rose-500/5 rounded-[1.5rem] border border-rose-500/10 group hover:bg-rose-500/10 transition-colors">
                                        <div className="p-2.5 bg-rose-500/10 rounded-sm text-rose-600 group-hover:scale-110 transition-transform">
                                            <AlertTriangle size={20} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-foreground">Ônibus 104 - Freios</p>
                                            <p className="text-[11px] font-bold text-rose-500/80 uppercase tracking-widest mt-0.5">VENCIDO HÁ 2 DIAS</p>
                                            <p className="text-xs font-medium text-muted-foreground/70 mt-2">Revisão crítica necessária imediatamente.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-5 bg-amber-500/5 rounded-[1.5rem] border border-amber-500/10 group hover:bg-amber-500/10 transition-colors">
                                        <div className="p-2.5 bg-amber-500/10 rounded-sm text-amber-600 group-hover:scale-110 transition-transform">
                                            <Clock size={20} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-foreground">Ônibus 108 - Troca de Óleo</p>
                                            <p className="text-[11px] font-bold text-amber-600/80 uppercase tracking-widest mt-0.5">AGENDADO: 28/11</p>
                                            <p className="text-xs font-medium text-muted-foreground/70 mt-2">Preventiva programada na oficina central.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="financeiro" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Executive DRE Card */}
                        <Card className="border-none shadow-2xl shadow-muted/20 rounded-[2.5rem] bg-card   overflow-hidden">
                            <CardHeader className="p-8 pb-4 border-b border-border/40">
                                <div className="flex justify-between items-center">
                                    <div className="space-y-1">
                                        <CardTitle className="text-xl font-black tracking-tight flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-sm">
                                                <FileText size={18} className="text-primary" />
                                            </div>
                                            Demonstrativo de Resultados (DRE)
                                        </CardTitle>
                                        <CardDescription className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground ml-11">Visão contábil do período selecionado</CardDescription>
                                    </div>
                                    <Button variant="outline" className="h-10 rounded-sm font-bold text-xs gap-2 border-border/50 bg-background/50">
                                        <Download size={14} strokeWidth={2.5} />
                                        EXPORTAR PDF
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="space-y-6">
                                    {/* Receitas Section */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-5 bg-emerald-500/5 rounded-sm border border-emerald-500/10">
                                            <div className="flex items-center gap-3">
                                                <TrendingUp className="text-emerald-500" size={18} strokeWidth={2.5} />
                                                <span className="font-black text-sm uppercase tracking-tight text-foreground">Receita Bruta Total</span>
                                            </div>
                                            <span className="font-black text-lg text-emerald-600 tracking-tighter">{formatCurrency(analiseFinanceira.receitas)}</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
                                            {Object.entries(analiseFinanceira.receitasPorCategoria).map(([cat, val]) => (
                                                <div key={cat} className="flex justify-between items-center p-3 hover:bg-muted rounded-sm transition-colors">
                                                    <span className="text-sm font-bold text-muted-foreground">{cat}</span>
                                                    <span className="text-sm font-black text-foreground">{formatCurrency(val as number)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <Separator className="bg-border/40" />

                                    {/* Despesas Section */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-5 bg-rose-500/5 rounded-sm border border-rose-500/10">
                                            <div className="flex items-center gap-3">
                                                <TrendingDown className="text-rose-500" size={18} strokeWidth={2.5} />
                                                <span className="font-black text-sm uppercase tracking-tight text-foreground">Despesas Operacionais</span>
                                            </div>
                                            <span className="font-black text-lg text-rose-600 tracking-tighter">({formatCurrency(analiseFinanceira.despesas)})</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 pl-4">
                                            {Object.entries(analiseFinanceira.despesasPorCategoria).map(([cat, val]) => (
                                                <div key={cat} className="flex justify-between items-center p-3 hover:bg-muted rounded-sm transition-colors">
                                                    <span className="text-sm font-bold text-muted-foreground">{cat}</span>
                                                    <span className="text-sm font-black text-rose-500/80">({formatCurrency(val as number)})</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-12 p-8 bg-primary rounded-[2rem] shadow-2xl shadow-primary/20 flex flex-col md:flex-row justify-between items-center gap-6">
                                        <div className="space-y-1">
                                            <span className="text-[12px] font-black uppercase tracking-[0.2em] text-primary-foreground/60">Resultado Líquido do Exercício</span>
                                            <h3 className="text-3xl font-black text-primary-foreground tracking-tighter">Performance Operacional</h3>
                                        </div>
                                        <div className="flex flex-col items-center md:items-end">
                                            <span className={cn(
                                                "text-4xl font-black tracking-tighter px-6 py-2 rounded-sm bg-white/20   text-white",
                                                analiseFinanceira.lucroLiquido < 0 && "bg-rose-500/40"
                                            )}>
                                                {formatCurrency(analiseFinanceira.lucroLiquido)}
                                            </span>
                                            <p className="text-[12px] font-black text-primary-foreground/80 uppercase tracking-widest mt-2">Margem de Lucro: {formatPercentage(analiseFinanceira.margemLucro)}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>

            {/* Modal de Detalhes Premium */}
            <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
                <DialogContent className="max-w-xl border-none shadow-2xl rounded-[2.5rem] bg-card   animate-in zoom-in-95 duration-300">
                    {selectedItem && (
                        <>
                            <DialogHeader className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary/10 rounded-sm text-primary">
                                        <FileText size={24} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-2xl font-black tracking-tighter">Detalhes do Registro</DialogTitle>
                                        <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-0.5">Identificador: #{selectedItem.id}</DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-1.5">
                                        <p className="text-[12px] font-black uppercase tracking-widest text-muted-foreground/60">Rota / Itinerário</p>
                                        <p className="font-bold text-base text-foreground">{selectedItem.rota}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[12px] font-black uppercase tracking-widest text-muted-foreground/60">Responsável</p>
                                        <p className="font-bold text-base text-foreground">{selectedItem.motorista}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[12px] font-black uppercase tracking-widest text-muted-foreground/60">Status Atual</p>
                                        <Badge className={cn(
                                            "rounded-sm font-black text-[12px] uppercase",
                                            selectedItem.status.includes('Concluído') || selectedItem.status.includes('Sucesso') ?
                                                "bg-emerald-500/10 text-emerald-600 border-none" : "bg-blue-500/10 text-blue-600 border-none"
                                        )}>
                                            {selectedItem.status}
                                        </Badge>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[12px] font-black uppercase tracking-widest text-muted-foreground/60">
                                            {currentContext === EmpresaContexto.TURISMO ? 'Ocupação' : 'Carga'}
                                        </p>
                                        <p className="font-bold text-base text-foreground">
                                            {currentContext === EmpresaContexto.TURISMO ? `${selectedItem.passageiros} Passageiros` : `${selectedItem.entregas} Volumes`}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-5 bg-muted rounded-[1.5rem] border border-border/40 space-y-2">
                                    <p className="text-[12px] font-black uppercase tracking-widest text-muted-foreground">Notas do Sistema</p>
                                    <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                                        {currentContext === EmpresaContexto.TURISMO
                                            ? 'Manifesto completo com lista de passageiros e assentos disponível para visualização detalhada.'
                                            : 'Rastreamento logístico ativo. Todas as etapas de entrega foram registradas eletronicamente.'}
                                    </p>
                                </div>
                            </div>

                            <DialogFooter className="p-6 pt-0 gap-3">
                                <Button variant="ghost" onClick={() => setSelectedItem(null)} className="rounded-sm font-bold px-6">
                                    FECHAR
                                </Button>
                                <Button className="rounded-sm font-black px-6 bg-primary shadow-lg shadow-primary/20">
                                    VER RELATÓRIO COMPLETO
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

// Wrapper para Recharts PieChart para evitar conflito de nomes
const RechartsPieChart = RechartsPie;
