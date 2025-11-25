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
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                                    {currentContext === EmpresaContexto.TURISMO ? 'Manifesto de Viagens' : 'Controle de Rotas'}
                                </h3>
                                <button className="text-sm text-blue-600 hover:underline">Ver Todos</button>
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
                                            manifestosTurismo.map((item) => (
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
                                                        <button className="text-blue-600 hover:text-blue-800">Detalhes</button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            entregasExpress.map((item) => (
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
                                                        <button className="text-blue-600 hover:text-blue-800">Rastrear</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
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
        </div>
    );
};

// Wrapper para Recharts PieChart para evitar conflito de nomes
const RechartsPieChart = RechartsPie;
