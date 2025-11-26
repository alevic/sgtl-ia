import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { EmpresaContexto, TipoTransacao, CategoriaReceita, CategoriaDespesa } from '../types';
import {
    ArrowLeft, Download, TrendingUp, TrendingDown, DollarSign, Calendar,
    FileText, PieChart, BarChart as BarChartIcon, Activity, Users, Truck,
    Package, MapPin, AlertTriangle, CheckCircle, Clock, LayoutDashboard,
    List
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart as RechartsPie, Pie, Cell, AreaChart, Area
} from 'recharts';

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
        { tipo: TipoTransacao.RECEITA, valor: 350, categoria_receita: CategoriaReceita.VENDA_PASSAGEM, data_emissao: '2024-11-20' },
        { tipo: TipoTransacao.RECEITA, valor: 5000, categoria_receita: CategoriaReceita.FRETAMENTO, data_emissao: '2024-11-23' },
        { tipo: TipoTransacao.RECEITA, valor: 120, categoria_receita: CategoriaReceita.ENCOMENDA, data_emissao: '2024-11-15' },
        { tipo: TipoTransacao.DESPESA, valor: 3500, categoria_despesa: CategoriaDespesa.COMBUSTIVEL, data_emissao: '2024-11-20' },
        { tipo: TipoTransacao.DESPESA, valor: 1200, categoria_despesa: CategoriaDespesa.MANUTENCAO, data_emissao: '2024-11-15' },
        { tipo: TipoTransacao.DESPESA, valor: 850, categoria_despesa: CategoriaDespesa.PECAS, data_emissao: '2024-11-18' },
        { tipo: TipoTransacao.DESPESA, valor: 2200, categoria_despesa: CategoriaDespesa.SEGURO, data_emissao: '2024-11-01' },
    ], []);

    const analiseFinanceira = useMemo(() => {
        const receitas = mockTransacoes.filter(t => t.tipo === TipoTransacao.RECEITA).reduce((sum, t) => sum + t.valor, 0);
        const despesas = mockTransacoes.filter(t => t.tipo === TipoTransacao.DESPESA).reduce((sum, t) => sum + t.valor, 0);
        const lucroLiquido = receitas - despesas;
        const margemLucro = receitas > 0 ? (lucroLiquido / receitas) * 100 : 0;

        const receitasPorCategoria: Record<string, number> = {};
        const despesasPorCategoria: Record<string, number> = {};

        mockTransacoes.forEach(t => {
            if (t.tipo === TipoTransacao.RECEITA && t.categoria_receita) {
                receitasPorCategoria[t.categoria_receita] = (receitasPorCategoria[t.categoria_receita] || 0) + t.valor;
            } else if (t.tipo === TipoTransacao.DESPESA && t.categoria_despesa) {
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
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/admin/dashboard')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Relatórios e Análises</h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            Visão completa: {currentContext === EmpresaContexto.TURISMO ? 'Turismo B2C' : 'Logística Express'}
                        </p>
                    </div>
                </div>

                {/* Date Picker Global */}
                <div className="flex gap-2 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    <input type="date" value={periodoInicio} onChange={e => setPeriodoInicio(e.target.value)} className="bg-transparent border-none text-sm text-slate-600 dark:text-slate-300 focus:ring-0" />
                    <span className="text-slate-400 self-center">-</span>
                    <input type="date" value={periodoFim} onChange={e => setPeriodoFim(e.target.value)} className="bg-transparent border-none text-sm text-slate-600 dark:text-slate-300 focus:ring-0" />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-t-xl px-2">
                <button
                    onClick={() => setActiveTab('gerencial')}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'gerencial'
                        ? `border-${themeColor}-600 text-${themeColor}-600 dark:text-${themeColor}-400`
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                    <LayoutDashboard size={18} />
                    Gerencial
                </button>
                <button
                    onClick={() => setActiveTab('operacional')}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'operacional'
                        ? `border-${themeColor}-600 text-${themeColor}-600 dark:text-${themeColor}-400`
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                    <List size={18} />
                    Operacional
                </button>
                <button
                    onClick={() => setActiveTab('financeiro')}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'financeiro'
                        ? `border-${themeColor}-600 text-${themeColor}-600 dark:text-${themeColor}-400`
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                    <DollarSign size={18} />
                    Financeiro
                </button>
            </div>

            {/* Content */}
            <div className="space-y-6">

                {/* --- TAB GERENCIAL --- */}
                {activeTab === 'gerencial' && (
                    <div className="space-y-6">
                        {/* KPIs Principais */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Receita Total</p>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(analiseFinanceira.receitas)}</p>
                                <div className="flex items-center gap-1 text-xs text-green-500 mt-1">
                                    <TrendingUp size={12} /> +12.5% vs mês anterior
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Lucro Líquido</p>
                                <p className={`text-2xl font-bold ${analiseFinanceira.lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(analiseFinanceira.lucroLiquido)}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">Margem: {formatPercentage(analiseFinanceira.margemLucro)}</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {currentContext === EmpresaContexto.TURISMO ? 'Taxa de Ocupação' : 'Entregas no Prazo'}
                                </p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {currentContext === EmpresaContexto.TURISMO ? '78.5%' : '92.3%'}
                                </p>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2">
                                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: currentContext === EmpresaContexto.TURISMO ? '78.5%' : '92.3%' }}></div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Frota Ativa</p>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white">8/10</p>
                                <p className="text-xs text-orange-500 mt-1">2 em manutenção</p>
                            </div>
                        </div>

                        {/* Gráficos Contextuais */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Gráfico 1 */}
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                                <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">
                                    {currentContext === EmpresaContexto.TURISMO ? 'Evolução da Ocupação' : 'Volume Transportado (kg)'}
                                </h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        {currentContext === EmpresaContexto.TURISMO ? (
                                            <LineChart data={dadosOcupacaoTurismo}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                <XAxis dataKey="nome" stroke="#94a3b8" />
                                                <YAxis stroke="#94a3b8" />
                                                <RechartsTooltip />
                                                <Line type="monotone" dataKey="ocupacao" stroke="#2563eb" strokeWidth={2} />
                                            </LineChart>
                                        ) : (
                                            <AreaChart data={dadosVolumeExpress}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                <XAxis dataKey="nome" stroke="#94a3b8" />
                                                <YAxis stroke="#94a3b8" />
                                                <RechartsTooltip />
                                                <Area type="monotone" dataKey="volume" stroke="#f97316" fill="#f97316" fillOpacity={0.3} />
                                            </AreaChart>
                                        )}
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Gráfico 2 */}
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                                <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">
                                    {currentContext === EmpresaContexto.TURISMO ? 'Destinos Mais Populares' : 'Status de Entregas'}
                                </h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        {currentContext === EmpresaContexto.TURISMO ? (
                                            <BarChart data={dadosDestinosTurismo} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                <XAxis type="number" stroke="#94a3b8" />
                                                <YAxis dataKey="nome" type="category" width={100} stroke="#94a3b8" />
                                                <RechartsTooltip />
                                                <Bar dataKey="viagens" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        ) : (
                                            <RechartsPieChart width={400} height={400}>
                                                <Pie
                                                    data={dadosEntregasExpress}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {dadosEntregasExpress.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip />
                                                <Legend />
                                            </RechartsPieChart>
                                        )}
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB OPERACIONAL --- */}
                {activeTab === 'operacional' && (
                    <div className="space-y-6">
                        {/* Filtros e Ações */}
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <div className="flex gap-4 w-full md:w-auto">
                                <div className="relative flex-1 md:w-64">
                                    <input
                                        type="text"
                                        placeholder="Buscar por rota, motorista ou ID..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                    <List size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="todos">Todos os Status</option>
                                    <option value="ativo">Em Andamento</option>
                                    <option value="pendente">Pendente</option>
                                    <option value="concluido">Concluído</option>
                                </select>
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors w-full md:w-auto justify-center">
                                <FileText size={18} />
                                <span>Exportar Manifesto</span>
                            </button>
                        </div>

                        {/* Tabela Principal */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                                    {currentContext === EmpresaContexto.TURISMO ? 'Manifesto de Viagens' : 'Controle de Rotas'}
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-medium">
                                        <tr>
                                            <th className="px-6 py-4">ID</th>
                                            <th className="px-6 py-4">Rota</th>
                                            <th className="px-6 py-4">{currentContext === EmpresaContexto.TURISMO ? 'Passageiros' : 'Entregas'}</th>
                                            <th className="px-6 py-4">Motorista</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {currentContext === EmpresaContexto.TURISMO ? (
                                            filteredManifestos.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">{item.id}</td>
                                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.rota}</td>
                                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.passageiros}</td>
                                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.motorista}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.status === 'Em Trânsito' ? 'bg-blue-100 text-blue-700' :
                                                            item.status === 'Agendado' ? 'bg-slate-100 text-slate-700' : 'bg-green-100 text-green-700'
                                                            }`}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <button
                                                            onClick={() => setSelectedItem(item)}
                                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                                        >
                                                            Detalhes
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            filteredEntregas.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">{item.id}</td>
                                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.rota}</td>
                                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                                        {item.entregas} <span className="text-slate-400 text-xs">({item.pendentes} pend.)</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.motorista}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.status === 'Em Rota' ? 'bg-blue-100 text-blue-700' :
                                                            item.status === 'Concluído' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                            }`}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <button
                                                            onClick={() => setSelectedItem(item)}
                                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                                        >
                                                            Rastrear
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Visualizações Secundárias (Context-Aware) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {currentContext === EmpresaContexto.TURISMO ? (
                                <>
                                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                            <Users size={20} />
                                            Escala de Motoristas
                                        </h3>
                                        <div className="space-y-4">
                                            {[
                                                { nome: 'João Silva', status: 'Em Viagem', destino: 'Rio de Janeiro', retorno: '26/11' },
                                                { nome: 'Carlos Souza', status: 'Folga', destino: '-', retorno: '27/11' },
                                                { nome: 'Ana Lima', status: 'Aguardando', destino: 'Curitiba', retorno: '26/11' },
                                            ].map((mot, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                                                    <div>
                                                        <p className="font-medium text-slate-800 dark:text-white">{mot.nome}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">Retorno: {mot.retorno}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${mot.status === 'Em Viagem' ? 'bg-blue-100 text-blue-700' :
                                                            mot.status === 'Folga' ? 'bg-slate-200 text-slate-600' : 'bg-amber-100 text-amber-700'
                                                            }`}>
                                                            {mot.status}
                                                        </span>
                                                        <p className="text-xs text-slate-500 mt-1">{mot.destino}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                            <AlertTriangle size={20} />
                                            Alertas de Manutenção
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30">
                                                <AlertTriangle size={18} className="text-red-600 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium text-red-800 dark:text-red-300">Ônibus 104 - Freios</p>
                                                    <p className="text-xs text-red-600 dark:text-red-400">Revisão crítica necessária (Vencido há 2 dias)</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-900/30">
                                                <Clock size={18} className="text-amber-600 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Ônibus 108 - Troca de Óleo</p>
                                                    <p className="text-xs text-amber-600 dark:text-amber-400">Agendado para 28/11</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                            <Truck size={20} />
                                            Status da Frota
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">12</p>
                                                <p className="text-sm text-green-700 dark:text-green-300">Disponíveis</p>
                                            </div>
                                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">8</p>
                                                <p className="text-sm text-blue-700 dark:text-blue-300">Em Rota</p>
                                            </div>
                                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center">
                                                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">3</p>
                                                <p className="text-sm text-amber-700 dark:text-amber-300">Manutenção</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg text-center">
                                                <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">23</p>
                                                <p className="text-sm text-slate-700 dark:text-slate-300">Total</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                            <Package size={20} />
                                            Entregas Críticas
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30">
                                                <div className="flex items-center gap-3">
                                                    <AlertTriangle size={18} className="text-red-600" />
                                                    <div>
                                                        <p className="text-sm font-medium text-red-800 dark:text-red-300">#E9821 - Atrasado</p>
                                                        <p className="text-xs text-red-600 dark:text-red-400">Rota Norte - Cliente Ausente</p>
                                                    </div>
                                                </div>
                                                <button className="text-xs bg-white dark:bg-slate-800 px-2 py-1 rounded border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
                                                    Resolver
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-900/30">
                                                <div className="flex items-center gap-3">
                                                    <Clock size={18} className="text-amber-600" />
                                                    <div>
                                                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">#E9844 - Prioridade</p>
                                                        <p className="text-xs text-amber-600 dark:text-amber-400">Entrega agendada até 14h</p>
                                                    </div>
                                                </div>
                                                <button className="text-xs bg-white dark:bg-slate-800 px-2 py-1 rounded border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400">
                                                    Ver
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* --- TAB FINANCEIRO --- */}
                {activeTab === 'financeiro' && (
                    <div className="space-y-6">
                        {/* DRE Simplificado */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                                    <FileText size={20} /> DRE - Demonstrativo de Resultados
                                </h2>
                                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                                    <Download size={16} /> Exportar PDF
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <span className="font-medium text-slate-700 dark:text-slate-300">Receita Bruta</span>
                                    <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(analiseFinanceira.receitas)}</span>
                                </div>
                                <div className="pl-4 space-y-2">
                                    {Object.entries(analiseFinanceira.receitasPorCategoria).map(([cat, val]) => (
                                        <div key={cat} className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                                            <span>{cat}</span>
                                            <span>{formatCurrency(val)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg mt-4">
                                    <span className="font-medium text-slate-700 dark:text-slate-300">Despesas Operacionais</span>
                                    <span className="font-bold text-red-600 dark:text-red-400">({formatCurrency(analiseFinanceira.despesas)})</span>
                                </div>
                                <div className="pl-4 space-y-2">
                                    {Object.entries(analiseFinanceira.despesasPorCategoria).map(([cat, val]) => (
                                        <div key={cat} className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                                            <span>{cat}</span>
                                            <span>({formatCurrency(val)})</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-between items-center p-4 bg-slate-100 dark:bg-slate-700 rounded-lg mt-6 border-t-2 border-slate-300 dark:border-slate-600">
                                    <span className="font-bold text-lg text-slate-800 dark:text-white">Resultado Líquido</span>
                                    <span className={`font-bold text-xl ${analiseFinanceira.lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(analiseFinanceira.lucroLiquido)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* Modal de Detalhes */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-700 pb-4">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                Detalhes: {selectedItem.id}
                            </h3>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <span className="sr-only">Fechar</span>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Rota</p>
                                    <p className="font-medium text-slate-800 dark:text-white">{selectedItem.rota}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Motorista</p>
                                    <p className="font-medium text-slate-800 dark:text-white">{selectedItem.motorista}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-1 ${selectedItem.status.includes('Concluído') || selectedItem.status.includes('Agendado') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {selectedItem.status}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {currentContext === EmpresaContexto.TURISMO ? 'Passageiros' : 'Entregas'}
                                    </p>
                                    <p className="font-medium text-slate-800 dark:text-white">
                                        {currentContext === EmpresaContexto.TURISMO ? selectedItem.passageiros : selectedItem.entregas}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Informações Adicionais</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {currentContext === EmpresaContexto.TURISMO
                                        ? 'Lista de passageiros e assentos disponível no manifesto completo.'
                                        : 'Rastreamento em tempo real ativado. Previsão de entrega atualizada.'}
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    Fechar
                                </button>
                                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                                    Ver Completo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Wrapper para Recharts PieChart para evitar conflito de nomes
const RechartsPieChart = RechartsPie;
