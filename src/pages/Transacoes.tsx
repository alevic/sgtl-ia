import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Plus, Search, Download, Calendar, Filter, ArrowUpRight, ArrowDownRight, Eye
} from 'lucide-react';
import {
    ITransacao, TipoTransacao, StatusTransacao, CategoriaReceita, CategoriaDespesa,
    FormaPagamento, Moeda, CentroCusto, ClassificacaoContabil, StatusTransacaoLabel, TipoTransacaoLabel
} from '@/types';
import { useApp } from '../context/AppContext';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { TransactionActions } from '../components/Financeiro/TransactionActions';
import { SwissDatePicker } from '../components/Form/SwissDatePicker';
import { financeAuxService } from '../services/financeAuxService';
import { api } from '../services/api';
import { ICostCenter, IFinanceCategory } from '@/types';
import { PageHeader } from '../components/Layout/PageHeader';
import { DashboardCard } from '../components/Layout/DashboardCard';
import { ListFilterSection } from '../components/Layout/ListFilterSection';
import { cn } from '../lib/utils';
import { Card } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { ArrowLeftRight, TrendingUp, TrendingDown, Info, CreditCard, DollarSign } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

export const Transacoes: React.FC = () => {
    const navigate = useNavigate();
    const { currentContext } = useApp();
    const { formatDate } = useDateFormatter();
    const [transacoes, setTransacoes] = useState<ITransacao[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filtros
    const [busca, setBusca] = useState('');
    const [filtroTipo, setFiltroTipo] = useState<TipoTransacao | 'TODAS'>('TODAS');
    const [filtroStatus, setFiltroStatus] = useState<StatusTransacao | 'TODAS'>('TODAS');
    const [filtroCentroCusto, setFiltroCentroCusto] = useState<string>('TODOS');
    const [filtroCategoria, setFiltroCategoria] = useState<string>('TODAS');
    const [filtroClassificacao, setFiltroClassificacao] = useState<ClassificacaoContabil | 'TODAS'>('TODAS');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [info, setInfo] = useState<string | null>(null);

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

    const transacoesFiltradas = useMemo(() => {
        return transacoes.filter(transacao => {
            const matchBusca = busca === '' ||
                (transacao.description || '').toLowerCase().includes(busca.toLowerCase()) ||
                (transacao.document_number || '').toLowerCase().includes(busca.toLowerCase()) ||
                (transacao.id || '').toLowerCase().includes(busca.toLowerCase());

            const matchTipo = filtroTipo === 'TODAS' || transacao.type === filtroTipo;
            const matchStatus = filtroStatus === 'TODAS' || transacao.status === filtroStatus;

            const matchCentroCusto = filtroCentroCusto === 'TODOS' ||
                transacao.cost_center_id === filtroCentroCusto ||
                transacao.cost_center_name === filtroCentroCusto; // Fallback for legacy data

            const matchCategoria = filtroCategoria === 'TODAS' ||
                transacao.category_id === filtroCategoria ||
                transacao.category_name === filtroCategoria ||
                transacao.categoria_receita === filtroCategoria ||
                transacao.categoria_despesa === filtroCategoria;

            const matchClassificacao = filtroClassificacao === 'TODAS' ||
                transacao.accounting_classification === filtroClassificacao ||
                transacao.classificacao_contabil === filtroClassificacao;

            let matchData = true;
            if (dataInicio && dataFim) {
                const dataEmissao = new Date(transacao.date || transacao.issue_date || transacao.data_emissao);
                // Adjust comparison to compare Dates only, ignoring time components of the transacao if needed
                // But generally direct comparison works if we set start to 00:00 and end to 23:59

                // Fix: Parse input dates as Local Time
                // When input type="date" returns "2023-12-13", new Date("2023-12-13") is UTC midnight (previous day 21h).
                // We need to construct local date.
                const [iY, iM, iD] = dataInicio.split('-').map(Number);
                const start = new Date(iY, iM - 1, iD, 0, 0, 0);

                const [fY, fM, fD] = dataFim.split('-').map(Number);
                const end = new Date(fY, fM - 1, fD, 23, 59, 59, 999);

                matchData = dataEmissao >= start && dataEmissao <= end;
            }

            return matchBusca && matchTipo && matchStatus && matchData && matchCentroCusto && matchCategoria && matchClassificacao;
        }).sort((a, b) => new Date(b.date || b.issue_date || b.data_emissao || 0).getTime() - new Date(a.date || a.issue_date || a.data_emissao || 0).getTime());
    }, [transacoes, busca, filtroTipo, filtroStatus, dataInicio, dataFim, filtroCentroCusto, filtroCategoria, filtroClassificacao]);

    const resumo = useMemo(() => {
        const receitas = transacoesFiltradas
            .filter(t => t.type === TipoTransacao.INCOME)
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const despesas = transacoesFiltradas
            .filter(t => t.type === TipoTransacao.EXPENSE)
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const saldo = receitas - despesas;

        return { receitas, despesas, saldo, total: transacoesFiltradas.length };
    }, [transacoesFiltradas]);

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const getStatusBadge = (status: StatusTransacao) => {
        const styles: Record<string, string> = {
            [StatusTransacao.PAID]: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            [StatusTransacao.PENDING]: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            [StatusTransacao.OVERDUE]: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            [StatusTransacao.CANCELLED]: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
            [StatusTransacao.PARTIALLY_PAID]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            // Legacy fallbacks
            'PAGA': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            'PENDENTE': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            'VENCIDA': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            'CANCELADA': 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
            'PARCIALMENTE_PAGA': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        };

        return (
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${styles[status] || styles[StatusTransacao.PENDING]}`}>
                {StatusTransacaoLabel[status as StatusTransacao] || (status as string)}
            </span>
        );
    };

    const getTipoBadge = (type: TipoTransacao) => {
        if (type === TipoTransacao.INCOME) {
            return (
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1 border border-emerald-500/20">
                    <ArrowUpRight size={12} strokeWidth={3} />
                    RECEITA
                </span>
            );
        }
        return (
            <span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1 border border-rose-500/20">
                <ArrowDownRight size={12} strokeWidth={3} />
                DESPESA
            </span>
        );
    };

    const handleExport = () => {
        console.log('Exportando transações:', transacoesFiltradas);
        setInfo('Função de exportação será implementada em breve!');
        setTimeout(() => setInfo(null), 3000);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {info && (
                <Alert className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Informação</AlertTitle>
                    <AlertDescription>{info}</AlertDescription>
                </Alert>
            )}
            {/* Header Module */}
            <PageHeader
                title="Fluxo de Caixa Unificado"
                subtitle="Rastreamento consolidado de todas as movimentações financeiras do ecossistema"
                icon={ArrowLeftRight}
                backLink="/admin/financeiro"
                backLabel="Painel Financeiro"
                rightElement={
                    <Button
                        onClick={() => navigate('/admin/financeiro/transacoes/nova')}
                        className="h-14 px-8 rounded-sm bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[12px] tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus size={20} className="mr-2" strokeWidth={3} />
                        Nova Transação
                    </Button>
                }
            />

            {/* Dashboard KPIs Container */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <DashboardCard
                    title="Entradas (Filtro)"
                    value={formatCurrency(resumo.receitas)}
                    icon={TrendingUp}
                    variant="emerald"
                />
                <DashboardCard
                    title="Saídas (Filtro)"
                    value={formatCurrency(resumo.despesas)}
                    icon={TrendingDown}
                    variant="rose"
                />
                <DashboardCard
                    title="Resultado Líquido"
                    value={formatCurrency(resumo.saldo)}
                    icon={DollarSign}
                    variant={resumo.saldo >= 0 ? "indigo" : "amber"}
                    trend={resumo.saldo >= 0 ? "Superávit no período" : "Déficit no período"}
                />
                <DashboardCard
                    title="Volume de Operações"
                    value={resumo.total.toString()}
                    icon={CreditCard}
                    variant="slate"
                    trend="Total de registros"
                />
            </div>

            {/* Filters Module */}
            <ListFilterSection gridClassName="lg:grid-cols-6">
                <div className="lg:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Pesquisar</label>
                    <div className="relative group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Descrição, ID ou documento..."
                            value={busca}
                            onChange={e => setBusca(e.target.value)}
                            className="pl-12 h-14 bg-muted/40 border-border/50 rounded-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary/20"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Status</label>
                    <Select value={filtroStatus} onValueChange={(v: any) => setFiltroStatus(v)}>
                        <SelectTrigger className="h-14 bg-muted/40 border-border/50 rounded-sm font-bold uppercase tracking-widest text-[11px]">
                            <SelectValue placeholder="STATUS" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="TODAS">TODOS OS STATUS</SelectItem>
                            {Object.values(StatusTransacao).map(s => (
                                <SelectItem key={s} value={s}>{StatusTransacaoLabel[s]}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Tipo</label>
                    <Select value={filtroTipo} onValueChange={(v: any) => {
                        setFiltroTipo(v);
                        setFiltroCategoria('TODAS');
                    }}>
                        <SelectTrigger className="h-14 bg-muted/40 border-border/50 rounded-sm font-bold uppercase tracking-widest text-[11px]">
                            <SelectValue placeholder="TIPO" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="TODAS">AMBOS OS TIPOS</SelectItem>
                            <SelectItem value={TipoTransacao.INCOME}>RECEITAS (ENTRADAS)</SelectItem>
                            <SelectItem value={TipoTransacao.EXPENSE}>DESPESAS (SAÍDAS)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Centro de Custo</label>
                    <Select value={filtroCentroCusto} onValueChange={(v: any) => {
                        setFiltroCentroCusto(v);
                        setFiltroCategoria('TODAS');
                    }}>
                        <SelectTrigger className="h-14 bg-muted/40 border-border/50 rounded-sm font-bold uppercase tracking-widest text-[11px]">
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
                        <SelectTrigger className="h-14 bg-muted/40 border-border/50 rounded-sm font-bold uppercase tracking-widest text-[11px]">
                            <SelectValue placeholder="CATEGORIA" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="TODAS">TODAS CATEGORIAS</SelectItem>
                            {categories
                                .filter(cat => {
                                    const typeMatch = filtroTipo === 'TODAS' || cat.type === filtroTipo;
                                    const ccMatch = filtroCentroCusto === 'TODOS' || cat.cost_center_id === filtroCentroCusto;
                                    return typeMatch && ccMatch;
                                })
                                .map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name.toUpperCase()}</SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>
            </ListFilterSection>
            {/* Lista de Transações */}
            <div className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                            Transações ({transacoesFiltradas.length})
                        </h2>
                        <button
                            onClick={handleExport}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                            <Download size={16} />
                            Exportar
                        </button>
                    </div>
                </div>

                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <p className="text-slate-500 dark:text-slate-400">Carregando transações...</p>
                        </div>
                    ) : transacoesFiltradas.length === 0 ? (
                        <div className="p-12 text-center">
                            <Filter size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                            <p className="text-slate-500 dark:text-slate-400">Nenhuma transação encontrada</p>
                        </div>
                    ) : (
                        transacoesFiltradas.map(transacao => (
                            <div
                                key={transacao.id}
                                className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            {getTipoBadge(transacao.type)}
                                            {getStatusBadge(transacao.status)}
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                ID: {transacao.id}
                                            </span>
                                        </div>
                                        <h3 className="font-semibold text-slate-800 dark:text-white mb-1">
                                            {transacao.description}
                                        </h3>
                                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                            <span>Emissão: {formatDate(transacao.date || transacao.data_emissao || transacao.issue_date)}</span>
                                            <span>•</span>
                                            <span>Vencimento: {formatDate(transacao.due_date || transacao.data_vencimento)}</span>
                                            {transacao.document_number && (
                                                <>
                                                    <span>•</span>
                                                    <span>Doc: {transacao.document_number}</span>
                                                </>
                                            )}
                                            {transacao.payment_method && (
                                                <>
                                                    <span>•</span>
                                                    <span>{transacao.payment_method}</span>
                                                </>
                                            )}
                                            <span>•</span>
                                            <span>
                                                Categoria: {transacao.category_name}
                                            </span>
                                            {transacao.cost_center_name && (
                                                <>
                                                    <span>•</span>
                                                    <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 font-medium">
                                                        {transacao.cost_center_name}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right ml-4 flex items-center gap-3">
                                        <div>
                                            <p className={`text-xl font-black ${transacao.type === TipoTransacao.INCOME
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-rose-600 dark:text-rose-400'
                                                }`}>
                                                {transacao.type === TipoTransacao.INCOME ? '+' : '-'} {formatCurrency(Number(transacao.amount))}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {transacao.currency}
                                            </p>
                                        </div>
                                        <TransactionActions transacao={transacao} onUpdate={fetchTransacoes} />
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
