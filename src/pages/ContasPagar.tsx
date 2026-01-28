import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Plus, Search, Filter, Calendar, DollarSign, AlertCircle, Check, X, Download, CreditCard
} from 'lucide-react';
import { ITransacao, StatusTransacao, CategoriaDespesa, Moeda, CentroCusto, TipoTransacao } from '@/types';
import { authClient } from '../lib/auth-client';
import { useApp } from '../context/AppContext';
import { TransactionActions } from '../components/Financeiro/TransactionActions';
import { financeAuxService } from '../services/financeAuxService';
import { ICostCenter, IFinanceCategory } from '@/types';
import { PageHeader } from '../components/Layout/PageHeader';
import { DashboardCard } from '../components/Layout/DashboardCard';
import { ListFilterSection } from '../components/Layout/ListFilterSection';
import { cn } from '../lib/utils';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

export const ContasPagar: React.FC = () => {
    const navigate = useNavigate();
    const { currentContext } = useApp();
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
                fetch(`${import.meta.env.VITE_API_URL}/api/finance/transactions`, { credentials: 'include' }),
                financeAuxService.getCostCenters(),
                financeAuxService.getCategories()
            ]);

            if (transRes.ok) {
                const data = await transRes.json();
                setTransacoes(data);
            }
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
            .filter(t => t.tipo === TipoTransacao.EXPENSE)
            .filter(conta => {
                const matchBusca = busca === '' ||
                    conta.descricao.toLowerCase().includes(busca.toLowerCase()) ||
                    conta.numero_documento?.toLowerCase().includes(busca.toLowerCase());

                const matchStatus = filtroStatus === 'TODAS' || conta.status === filtroStatus;

                const matchCategoria = filtroCategoria === 'TODAS' ||
                    conta.category_id === filtroCategoria ||
                    conta.categoria_despesa === filtroCategoria;

                const matchCentroCusto = filtroCentroCusto === 'TODOS' ||
                    conta.cost_center_id === filtroCentroCusto ||
                    conta.centro_custo === filtroCentroCusto;

                return matchBusca && matchStatus && matchCategoria && matchCentroCusto;
            });
    }, [transacoes, busca, filtroStatus, filtroCategoria, filtroCentroCusto]);

    const resumo = useMemo(() => {
        const despesas = transacoes.filter(t => t.tipo === TipoTransacao.EXPENSE);
        const total = despesas.reduce((sum, c) => sum + Number(c.valor), 0);
        const pago = despesas
            .filter(c => c.status === StatusTransacao.PAID)
            .reduce((sum, c) => sum + Number(c.valor), 0);
        const pendente = total - pago;
        const vencidas = despesas.filter(c => c.status === StatusTransacao.OVERDUE).length;

        return { total, pago, pendente, vencidas };
    }, [transacoes]);

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR');
    };

    const getStatusBadge = (status: StatusTransacao) => {
        const styles = {
            [StatusTransacao.PAID]: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            [StatusTransacao.PENDING]: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            [StatusTransacao.OVERDUE]: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            [StatusTransacao.CANCELLED]: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
            [StatusTransacao.PARTIALLY_PAID]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        };

        return (
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${styles[status]}`}>
                {status}
            </span>
        );
    };

    const isVencendo = (dataVencimento: string) => {
        const vencimento = new Date(dataVencimento);
        const hoje = new Date();
        const diasRestantes = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        return diasRestantes <= 5 && diasRestantes >= 0;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Module */}
            <PageHeader
                title="Contas a Pagar"
                subtitle="Gestão estratégica de passivos, fornecedores e fluxo de saída"
                icon={CreditCard}
                backLink="/admin/financeiro"
                backLabel="Painel Financeiro"
                rightElement={
                    <Button
                        onClick={() => navigate('/admin/financeiro/transacoes/nova', { state: { tipo: TipoTransacao.EXPENSE } })}
                        className="h-14 px-8 rounded-sm bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[12px] tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus size={20} className="mr-2" strokeWidth={3} />
                        Nova Despesa
                    </Button>
                }
            />

            {/* Dashboard KPIs Container */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <DashboardCard
                    title="Total a Pagar"
                    value={formatCurrency(resumo.total)}
                    icon={DollarSign}
                    variant="amber"
                />
                <DashboardCard
                    title="Liquidado"
                    value={formatCurrency(resumo.pago)}
                    icon={Check}
                    variant="emerald"
                />
                <DashboardCard
                    title="Pendente"
                    value={formatCurrency(resumo.pendente)}
                    icon={Calendar}
                    variant="indigo"
                />
                <DashboardCard
                    title="Vencidas"
                    value={resumo.vencidas.toString()}
                    icon={AlertCircle}
                    variant="rose"
                    trend={resumo.vencidas > 0 ? "Ação imediata necessária" : "Tudo em dia"}
                />
            </div>

            {/* Filters Module */}
            <ListFilterSection gridClassName="lg:grid-cols-4">
                <div className="lg:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Pesquisar</label>
                    <div className="relative group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Fornecedor, descrição ou documento..."
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
                            <SelectItem value={StatusTransacao.PAID}>PAGA</SelectItem>
                            <SelectItem value={StatusTransacao.OVERDUE}>VENCIDA</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
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

                <div className="space-y-1.5 ">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Categoria</label>
                    <Select value={filtroCategoria} onValueChange={(v: any) => setFiltroCategoria(v)}>
                        <SelectTrigger className="h-14 bg-muted border-border/50 rounded-sm font-bold text-xs uppercase tracking-widest">
                            <SelectValue placeholder="CATEGORIA" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="TODAS">TODAS CATEGORIAS</SelectItem>
                            {categories
                                .filter(c => c.type === TipoTransacao.EXPENSE && (filtroCentroCusto === 'TODOS' || c.cost_center_id === filtroCentroCusto))
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
                            Despesas ({contasFiltradas.length})
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
                            <AlertCircle size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                            <p className="text-slate-500 dark:text-slate-400">Nenhuma conta encontrada</p>
                        </div>
                    ) : (
                        contasFiltradas.map(conta => (
                            <div
                                key={conta.id}
                                className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-semibold text-slate-800 dark:text-white">
                                                {conta.descricao}
                                            </h3>
                                            {getStatusBadge(conta.status)}
                                            {isVencendo(conta.data_vencimento) && conta.status === StatusTransacao.PENDING && (
                                                <span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded text-[10px] font-black uppercase tracking-widest">
                                                    CRÍTICO: VENCE HOJE
                                                </span>
                                            )}
                                        </div>
                                        {conta.observacoes && (
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                                                {conta.observacoes}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                            <span>Categoria: {conta.categoria_despesa}</span>
                                            <span>•</span>
                                            <span>Emissão: {formatDate(conta.data_emissao)}</span>
                                            <span>•</span>
                                            <span>Vencimento: {formatDate(conta.data_vencimento)}</span>
                                            {conta.numero_documento && (
                                                <>
                                                    <span>•</span>
                                                    <span>Doc: {conta.numero_documento}</span>
                                                </>
                                            )}
                                            {conta.centro_custo && (
                                                <>
                                                    <span>•</span>
                                                    <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 font-medium">
                                                        {conta.centro_custo}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 ml-4">
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-red-600 dark:text-red-400 mb-1">
                                                {formatCurrency(Number(conta.valor))}
                                            </p>
                                        </div>
                                        <TransactionActions transacao={conta} onUpdate={fetchTransacoes} />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
