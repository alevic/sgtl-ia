import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Plus, Search, Filter, Calendar, DollarSign, TrendingUp, Check, Download, ArrowUpRight
} from 'lucide-react';
import { ITransacao, StatusTransacao, CategoriaReceita, Moeda, CentroCusto, TipoTransacao } from '@/types';
import { authClient } from '../lib/auth-client';
import { useApp } from '../context/AppContext';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { TransactionActions } from '../components/Financeiro/TransactionActions';
import { financeAuxService } from '../services/financeAuxService';
import { api } from '../services/api';
import { ICostCenter, IFinanceCategory } from '@/types';
import { PageHeader } from '../components/Layout/PageHeader';
import { DashboardCard } from '../components/Layout/DashboardCard';
import { ListFilterSection } from '../components/Layout/ListFilterSection';
import { cn } from '../lib/utils';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Wallet } from 'lucide-react';

export const ContasReceber: React.FC = () => {
    const navigate = useNavigate();
    const { currentContext } = useApp();
    const { formatDate } = useDateFormatter();
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState<StatusTransacao | 'TODAS'>('TODAS');
    const [filtroCategoria, setFiltroCategoria] = useState<string>('TODAS');
    const [filtroCentroCusto, setFiltroCentroCusto] = useState<string>('TODOS');
    const [transacoes, setTransacoes] = useState<ITransacao[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [costCenters, setCostCenters] = useState<ICostCenter[]>([]);
    const [categories, setCategories] = useState<IFinanceCategory[]>([]);

    const fetchTransacoes = async () => {
        setIsLoading(true);
        try {
            const [transRes, centers, cats] = await Promise.all([
                api.get<ITransacao[]>('/api/finance/transactions'),
                financeAuxService.getCostCenters(),
                financeAuxService.getCategories()
            ]);

            setTransacoes(transRes);
            setCostCenters(centers);
            setCategories(cats);
        } catch (error) {
            console.error("Erro ao buscar dados:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTransacoes();
    }, [currentContext]);

    const contasFiltradas = useMemo(() => {
        return transacoes
            .filter(t => t.type === TipoTransacao.INCOME || t.tipo === TipoTransacao.INCOME)
            .filter(conta => {
                const description = conta.description || conta.descricao || '';
                const docNum = conta.document_number || conta.numero_documento || '';

                const matchBusca = busca === '' ||
                    description.toLowerCase().includes(busca.toLowerCase()) ||
                    docNum.toLowerCase().includes(busca.toLowerCase());

                const matchStatus = filtroStatus === 'TODAS' || conta.status === filtroStatus;

                const matchCategoria = filtroCategoria === 'TODAS' ||
                    conta.category_id === filtroCategoria ||
                    conta.categoria_receita === filtroCategoria ||
                    conta.category_name === filtroCategoria;

                const matchCentroCusto = filtroCentroCusto === 'TODOS' ||
                    conta.cost_center_id === filtroCentroCusto ||
                    conta.centro_custo === filtroCentroCusto ||
                    conta.cost_center_name === filtroCentroCusto;

                return matchBusca && matchStatus && matchCategoria && matchCentroCusto;
            });
    }, [transacoes, busca, filtroStatus, filtroCategoria, filtroCentroCusto]);

    const resumo = useMemo(() => {
        const receitas = transacoes.filter(t => t.tipo === TipoTransacao.INCOME);
        const total = receitas.reduce((sum, c) => sum + Number(c.valor), 0);
        const recebido = receitas
            .filter(c => c.status === StatusTransacao.PAID)
            .reduce((sum, c) => sum + Number(c.valor), 0);
        const pendente = total - recebido;
        const vencidas = receitas.filter(c => c.status === StatusTransacao.OVERDUE).length;

        return { total, recebido, pendente, vencidas };
    }, [transacoes]);

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const getStatusBadge = (status: StatusTransacao) => {
        const styles = {
            [StatusTransacao.PAID]: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            [StatusTransacao.PENDING]: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            [StatusTransacao.OVERDUE]: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            [StatusTransacao.CANCELLED]: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
            [StatusTransacao.PARTIALLY_PAID]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        };

        return (
            <span className={`px - 2 py - 0.5 rounded text - xs font - semibold ${styles[status]} `}>
                {status}
            </span>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Module */}
            <PageHeader
                title="Contas a Receber"
                subtitle="Gerenciamento estratégico de recebíveis e fluxo de caixa de entrada"
                icon={Wallet}
                backLink="/admin/financeiro"
                backLabel="Painel Financeiro"
                rightElement={
                    <Button
                        onClick={() => navigate('/admin/financeiro/transacoes/nova', { state: { tipo: TipoTransacao.INCOME } })}
                        className="h-14 px-8 rounded-sm bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[12px] tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus size={20} className="mr-2" strokeWidth={3} />
                        Nova Receita
                    </Button>
                }
            />

            {/* Dashboard KPIs Container */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <DashboardCard
                    title="Total a Receber"
                    value={formatCurrency(resumo.total)}
                    icon={DollarSign}
                    variant="indigo"
                />
                <DashboardCard
                    title="Realizado"
                    value={formatCurrency(resumo.recebido)}
                    icon={Check}
                    variant="emerald"
                />
                <DashboardCard
                    title="Pendente"
                    value={formatCurrency(resumo.pendente)}
                    icon={Calendar}
                    variant="amber"
                />
                <DashboardCard
                    title="Inadimplência"
                    value={resumo.vencidas.toString()}
                    icon={TrendingUp}
                    variant="rose"
                    trend={resumo.vencidas > 0 ? "Requer cobrança ativa" : "Nível saudável"}
                />
            </div>

            {/* Filters Module */}
            <ListFilterSection gridClassName="lg:grid-cols-4">
                <div className="lg:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Pesquisar</label>
                    <div className="relative group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Cliente, descrição ou documento..."
                            value={busca}
                            onChange={e => setBusca(e.target.value)}
                            className="pl-12 h-14 bg-muted border-border/50 rounded-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary/20"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Status</label>
                    <Select value={filtroStatus} onValueChange={(v: any) => setFiltroStatus(v)}>
                        <SelectTrigger className="h-14 bg-muted border-border/50 rounded-sm font-bold text-xs uppercase tracking-widest">
                            <SelectValue placeholder="STATUS" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="TODAS">TODOS OS STATUS</SelectItem>
                            <SelectItem value={StatusTransacao.PENDING}>PENDENTE</SelectItem>
                            <SelectItem value={StatusTransacao.PAID}>RECEBIDA</SelectItem>
                            <SelectItem value={StatusTransacao.OVERDUE}>VENCIDA</SelectItem>
                            <SelectItem value={StatusTransacao.PARTIALLY_PAID}>PARCIAL</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5 ">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Centro de Custo</label>
                    <Select value={filtroCentroCusto} onValueChange={(v: any) => {
                        setFiltroCentroCusto(v);
                        setFiltroCategoria('TODAS');
                    }}>
                        <SelectTrigger className="h-14 bg-muted border-border/50 rounded-sm font-bold text-xs uppercase tracking-widest">
                            <SelectValue placeholder="CENTRO CUSTO" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="TODOS">TODOS C. CUSTOS</SelectItem>
                            {costCenters.map(cc => (
                                <SelectItem key={cc.id} value={cc.id}>{cc.name.toUpperCase()}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Categoria</label>
                    <Select value={filtroCategoria} onValueChange={(v: any) => setFiltroCategoria(v)}>
                        <SelectTrigger className="h-14 bg-muted border-border/50 rounded-sm font-bold text-xs uppercase tracking-widest">
                            <SelectValue placeholder="CATEGORIA" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="TODAS">TODAS CATEGORIAS</SelectItem>
                            {categories
                                .filter(c => c.type === TipoTransacao.INCOME && (filtroCentroCusto === 'TODOS' || c.cost_center_id === filtroCentroCusto))
                                .map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name.toUpperCase()}</SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>
            </ListFilterSection>
            {/* Lista de Contas */}
            <div className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                            Receitas ({contasFiltradas.length})
                        </h2>
                        <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                            <Download size={16} />
                            Exportar
                        </button>
                    </div>
                </div>

                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {contasFiltradas.length === 0 ? (
                        <div className="p-12 text-center">
                            <TrendingUp size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                            <p className="text-slate-500 dark:text-slate-400">Nenhuma conta encontrada</p>
                        </div>
                    ) : (
                        contasFiltradas.map(conta => {
                            const isPendente = conta.status === StatusTransacao.PENDING;

                            return (
                                <div
                                    key={conta.id}
                                    className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                                    <ArrowUpRight size={16} strokeWidth={3} />
                                                </div>
                                                <h3 className="font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                                                    {conta.description}
                                                </h3>
                                                {getStatusBadge(conta.status)}
                                            </div>

                                            <div className="flex items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <span className="text-muted-foreground/60">CAT:</span> {conta.category_name || 'RECEITAS'}
                                                </span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <span className="text-muted-foreground/60 uppercase">Emissão:</span> {formatDate(conta.date || conta.data_emissao || conta.issue_date)}
                                                </span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                                    <span className="text-muted-foreground/60 uppercase">Recebimento:</span> {formatDate(conta.due_date || conta.data_vencimento)}
                                                </span>
                                                {conta.document_number && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1">
                                                            <span className="text-muted-foreground/60">DOC:</span> {conta.document_number}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 ml-4">
                                            <div className="text-right">
                                                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency(Number(conta.amount))}
                                                </p>
                                                <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-tighter">
                                                    ID: #{conta.id.slice(0, 8)}
                                                </p>
                                            </div>
                                            <TransactionActions transacao={conta} onUpdate={fetchTransacoes} />
                                        </div>
                                    </div>
                                    {(conta.notes || conta.observations) && (
                                        <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-900/40 rounded text-[11px] text-slate-500 dark:text-slate-400 border-l-2 border-slate-200 dark:border-slate-700">
                                            {conta.notes || conta.observations}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
