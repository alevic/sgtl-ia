import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, DollarSign, Tag, FileText, Upload, TrendingUp, TrendingDown } from 'lucide-react';
import {
    TipoTransacao, CategoriaReceita, CategoriaDespesa, FormaPagamento,
    StatusTransacao, Moeda, CentroCusto, ClassificacaoContabil, ICostCenter, IBankAccount, IFinanceCategory
} from '@/types';
import { getSugestaoClassificacao } from '../utils/classificacaoContabil';
import { authClient } from '../lib/auth-client';
import { SwissDatePicker } from '../components/Form/SwissDatePicker';
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { CardContent } from "../components/ui/card";
import { PageHeader } from '../components/Layout/PageHeader';
import { FormSection } from '../components/Layout/FormSection';
import { cn } from "../lib/utils";
import { AlertCircle, CheckCircle2, Loader } from 'lucide-react';

export const NovaTransacao: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Form state
    const [id, setId] = useState<string | null>(null);
    const [tipo, setTipo] = useState<TipoTransacao>(TipoTransacao.EXPENSE);
    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');
    const [moeda, setMoeda] = useState<Moeda>(Moeda.BRL);
    const [dataEmissao, setDataEmissao] = useState(new Date().toISOString().split('T')[0]);
    const [dataVencimento, setDataVencimento] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState<StatusTransacao>(StatusTransacao.PENDING);
    const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>(FormaPagamento.CASH);
    const [categoriaReceita, setCategoriaReceita] = useState<CategoriaReceita>(CategoriaReceita.OUTROS);
    const [categoriaDespesa, setCategoriaDespesa] = useState<CategoriaDespesa>(CategoriaDespesa.OUTROS);
    const [numeroDocumento, setNumeroDocumento] = useState('');
    const [observacoes, setObservacoes] = useState('');

    const [centroCusto, setCentroCusto] = useState<string>('');
    const [classificacaoContabil, setClassificacaoContabil] = useState<string>('');

    const isIncome = tipo === TipoTransacao.INCOME || (tipo as any) === 'RECEITA';

    const [maintenanceId, setMaintenanceId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Dynamic entities
    const [costCenters, setCostCenters] = useState<ICostCenter[]>([]);
    const [bankAccounts, setBankAccounts] = useState<IBankAccount[]>([]);
    const [categories, setCategories] = useState<IFinanceCategory[]>([]);
    const [costCenterId, setCostCenterId] = useState<string>('');
    const [bankAccountId, setBankAccountId] = useState<string>('');
    const [categoryId, setCategoryId] = useState<string>('');

    const fetchEntities = async () => {
        try {
            const [centersRes, accountsRes, catsRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/api/finance/cost-centers`, { credentials: 'include' }),
                fetch(`${import.meta.env.VITE_API_URL}/api/finance/accounts`, { credentials: 'include' }),
                fetch(`${import.meta.env.VITE_API_URL}/api/finance/categories`, { credentials: 'include' })
            ]);

            if (centersRes.ok) {
                const centers = await centersRes.json();
                setCostCenters(centers);
            }
            if (accountsRes.ok) {
                const accounts: IBankAccount[] = await accountsRes.json();
                setBankAccounts(accounts);

                // Auto-select default account if no account is selected yet
                if (!bankAccountId) {
                    const defaultAcc = accounts.find(acc => acc.is_default);
                    if (defaultAcc) setBankAccountId(defaultAcc.id);
                }
            }
            if (catsRes.ok) {
                const cats = await catsRes.json();
                setCategories(cats);
            }
        } catch (error) {
            console.error("Erro ao buscar entidades financeiras:", error);
        }
    };

    useEffect(() => {
        fetchEntities();
    }, []);

    // Auto-sugerir classificação quando categoria de despesa mudar
    useEffect(() => {
        if (tipo === TipoTransacao.EXPENSE || (tipo as any) === 'DESPESA') {
            const sugestao = getSugestaoClassificacao(categoriaDespesa);
            if (sugestao) {
                const matchingCC = costCenters.find(cc => cc.name === sugestao.centro_custo);
                if (matchingCC) setCostCenterId(matchingCC.id);
                setCentroCusto(sugestao.centro_custo);
                setClassificacaoContabil(sugestao.classificacao_contabil);
            }
        } else if (tipo === TipoTransacao.INCOME || (tipo as any) === 'RECEITA') {
            const matchingCC = costCenters.find(cc => cc.name === 'VENDAS');
            if (matchingCC) setCostCenterId(matchingCC.id);
            setCentroCusto(CentroCusto.VENDAS);
        }
    }, [tipo, categoriaDespesa, costCenters]);

    // Handle initial state from navigation
    useEffect(() => {
        const state = location.state as any;

        if (state) {
            if (state.manutencao_id || state.maintenance_id) {
                setMaintenanceId(state.manutencao_id || state.maintenance_id);
            }

            if (state.id) {
                setId(state.id);
                setTipo(state.type || state.tipo);
                setDescricao(state.description || state.descricao || '');
                setValor((state.amount || state.valor || 0).toString());
                setMoeda(state.currency || state.moeda);
                setDataEmissao((state.date || state.data_emissao).split('T')[0]);
                setDataVencimento((state.due_date || state.data_vencimento || state.date || state.data_emissao).split('T')[0]);
                setStatus(state.status);
                setFormaPagamento(state.payment_method || state.forma_pagamento);
                setNumeroDocumento(state.document_number || state.numero_documento || '');
                setObservacoes(state.notes || state.observations || state.observacoes || '');

                if (state.type === TipoTransacao.INCOME || state.tipo === 'RECEITA') {
                    setCategoriaReceita(state.category_name || state.categoria_receita);
                } else {
                    setCategoriaDespesa(state.category_name || state.categoria_despesa);
                    setCentroCusto(state.cost_center_name || state.centro_custo);
                    setClassificacaoContabil(state.financial_classification || state.classificacao_contabil);
                }
                if (state.cost_center_id) setCostCenterId(state.cost_center_id);
                if (state.bank_account_id) setBankAccountId(state.bank_account_id);
                if (state.category_id) setCategoryId(state.category_id);
            }
            else {
                if (state.type || state.tipo) setTipo(state.type || state.tipo);
                if (state.amount || state.valor) setValor((state.amount || state.valor).toString());
                if (state.description || state.descricao) setDescricao(state.description || state.descricao);
                if (state.category_id || state.categoria_despesa_id) {
                    setTipo(TipoTransacao.EXPENSE);
                    setCategoryId(state.category_id || state.categoria_despesa_id);
                }
                if (state.cost_center_id) setCostCenterId(state.cost_center_id);
            }
        }
    }, [location]);

    // Resolve IDs from names if passed in state
    useEffect(() => {
        const state = location.state as any;
        if (state) {
            if (state.categoria_despesa_nome && categories.length > 0) {
                const cat = categories.find(c => c.name.trim().toLowerCase() === state.categoria_despesa_nome.trim().toLowerCase());
                if (cat) {
                    setCategoryId(cat.id);
                    setTipo(TipoTransacao.EXPENSE);
                }
            }
            if (state.centro_custo_nome && costCenters.length > 0) {
                const cc = costCenters.find(c => c.name.trim().toLowerCase() === state.centro_custo_nome.trim().toLowerCase());
                if (cc) setCostCenterId(cc.id);
            }
            if (state.categoria_receita_nome && categories.length > 0) {
                const cat = categories.find(c => c.name.trim().toLowerCase() === state.categoria_receita_nome.trim().toLowerCase());
                if (cat) {
                    setCategoryId(cat.id);
                    setTipo(TipoTransacao.INCOME);
                }
            }
        }
    }, [location.state, categories, costCenters]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const transacao = {
            type: tipo,
            description: descricao,
            amount: parseFloat(valor),
            currency: moeda,
            date: dataEmissao,
            due_date: dataVencimento,
            status,
            payment_method: formaPagamento,
            category_id: categoryId || undefined,
            cost_center_id: costCenterId || undefined,
            bank_account_id: bankAccountId || undefined,
            financial_classification: (tipo === TipoTransacao.EXPENSE || (tipo as any) === 'DESPESA') ? classificacaoContabil : undefined,
            document_number: numeroDocumento,
            notes: observacoes,
            maintenance_id: maintenanceId
        };

        try {
            const url = id
                ? `${import.meta.env.VITE_API_URL}/api/finance/transactions/${id}`
                : `${import.meta.env.VITE_API_URL}/api/finance/transactions`;

            const method = id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(transacao),
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Erro ao salvar transação:", errorData);
                throw new Error(errorData.error || 'Erro ao salvar transação');
            }

            const data = await response.json();

            console.log('Transação salva:', data);
            setSuccess(id ? 'Transação atualizada com sucesso!' : 'Transação registrada com sucesso!');
            setTimeout(() => navigate('/admin/financeiro'), 2000);
        } catch (err: any) {
            console.error("Erro inesperado:", err);
            setError(err.message || 'Erro ao salvar transação. Tente novamente.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header Executivo */}
            <PageHeader
                title={isIncome ? (id ? 'Editar Receita' : 'Nova Receita') : (id ? 'Editar Despesa' : 'Nova Despesa')}
                subtitle={isIncome ? 'Lançamento de entrada de caixa no sistema' : 'Lançamento de saída ou compromisso de pagamento'}
                icon={isIncome ? TrendingUp : TrendingDown}
                backLink="/admin/financeiro"
                backText="Fluxo Financeiro"
                rightElement={
                    <>
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/admin/financeiro')}
                            className="h-14 rounded-sm px-6 font-black uppercase text-[12px] tracking-widest"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            className="h-14 rounded-sm px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[12px] tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Save size={18} className="mr-2" />
                            Confirmar Lançamento
                        </Button>
                    </>
                }
            />

            {error && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-sm border-destructive/20 bg-destructive/5  ">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="font-black uppercase text-[12px] tracking-widest">Erro no Lançamento</AlertTitle>
                    <AlertDescription className="text-xs font-medium">
                        {error}
                    </AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-sm border-emerald-500/20 bg-emerald-500/5  ">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <AlertTitle className="font-black uppercase text-[12px] tracking-widest text-emerald-500">Documento Salvo</AlertTitle>
                    <AlertDescription className="text-xs font-medium text-emerald-600/80">
                        {success}
                    </AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
                    {/* Visual Type Indicator */}
                    <div className={cn(
                        "p-6 rounded-sm border-l-4 flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-4 duration-500",
                        isIncome
                            ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-800 dark:text-emerald-300"
                            : "bg-rose-50 dark:bg-rose-950/20 border-rose-500 text-rose-800 dark:text-rose-300"
                    )}>
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "p-3 rounded-full",
                                isIncome ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-rose-100 dark:bg-rose-900/40"
                            )}>
                                {isIncome ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                            </div>
                            <div>
                                <h3 className="font-black uppercase tracking-widest text-sm leading-tight">
                                    {isIncome ? 'Lançamento de Receita' : 'Lançamento de Despesa'}
                                </h3>
                                <p className="text-[11px] font-bold opacity-70 uppercase tracking-tighter mt-0.5">
                                    {isIncome ? 'Este registro aumentará o saldo de caixa' : 'Este registro reduzirá o saldo de caixa ou gerará uma obrigação'}
                                </p>
                            </div>
                        </div>
                        <div className="hidden sm:block">
                            <span className={cn(
                                "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest",
                                isIncome ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                            )}>
                                {isIncome ? 'Entrada' : 'Saída'}
                            </span>
                        </div>
                    </div>

                    {/* Informações Básicas */}
                    <FormSection
                        title="Natureza do Lançamento"
                        icon={FileText}
                        rightElement={
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setTipo(TipoTransacao.INCOME)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                        tipo === TipoTransacao.INCOME || (tipo as any) === 'RECEITA'
                                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                                            : "bg-muted text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    Receita
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTipo(TipoTransacao.EXPENSE)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                        tipo === TipoTransacao.EXPENSE || (tipo as any) === 'DESPESA'
                                            ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                                            : "bg-muted text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    Despesa
                                </button>
                            </div>
                        }
                    >
                        <div className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Descrição do Documento *</label>
                                <input
                                    type="text"
                                    required
                                    value={descricao}
                                    onChange={e => setDescricao(e.target.value)}
                                    placeholder="Ex: Liquidação de Fatura, Manutenção Preventiva..."
                                    className="w-full h-14 px-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-bold text-sm outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Valor Nominal *</label>
                                    <div className="relative group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground group-focus-within:text-primary transition-colors">R$</span>
                                        <input
                                            type="number"
                                            required
                                            step="0.01"
                                            min="0"
                                            value={valor}
                                            onChange={e => setValor(e.target.value)}
                                            placeholder="0,00"
                                            className="w-full h-14 pl-10 pr-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-black text-lg outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Divisa / Moeda</label>
                                    <select
                                        value={moeda}
                                        onChange={e => setMoeda(e.target.value as Moeda)}
                                        className="w-full h-14 px-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-black uppercase text-[12px] tracking-widest outline-none appearance-none"
                                    >
                                        <option value={Moeda.BRL}>BRL - Real</option>
                                        <option value={Moeda.USD}>USD - Dólar</option>
                                        <option value={Moeda.EUR}>EUR - Euro</option>
                                        <option value={Moeda.PYG}>PYG - Guarani</option>
                                        <option value={Moeda.ARS}>ARS - Peso Argentino</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Identificador de Documento</label>
                                    <div className="relative group">
                                        <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            value={numeroDocumento}
                                            onChange={e => setNumeroDocumento(e.target.value)}
                                            placeholder="Ex: NF-123.456"
                                            className="w-full h-14 pl-12 pr-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-bold text-sm outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Conta de Liquidação</label>
                                    <select
                                        value={bankAccountId}
                                        onChange={e => setBankAccountId(e.target.value)}
                                        className="w-full h-14 px-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-black uppercase text-[12px] tracking-widest outline-none appearance-none"
                                    >
                                        <option value="">NÃO INFORMADA (CAIXA GERAL)</option>
                                        {bankAccounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name} - {acc.bank_name || 'INTERNO'}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Meio de Pagamento</label>
                                    <select
                                        value={formaPagamento}
                                        onChange={e => setFormaPagamento(e.target.value as FormaPagamento)}
                                        className="w-full h-14 px-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-black uppercase text-[12px] tracking-widest outline-none appearance-none"
                                    >
                                        <option value={FormaPagamento.CASH}>Dinheiro Vivo</option>
                                        <option value={FormaPagamento.PIX}>PIX Instantâneo</option>
                                        <option value={FormaPagamento.CREDIT_CARD}>Cartão de Crédito</option>
                                        <option value={FormaPagamento.DEBIT_CARD}>Cartão de Débito</option>
                                        <option value={FormaPagamento.BOLETO}>Boleto Bancário</option>
                                        <option value={FormaPagamento.BANK_TRANSFER}>TED / DOC / PIX</option>
                                        <option value={FormaPagamento.CHECK}>Cheque Nominal</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </FormSection>

                    {/* Centros de Custo */}
                    <FormSection
                        title="Classificação Contábil"
                        icon={Tag}
                    >
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Centro de Custo Responsável *</label>
                                    <select
                                        required
                                        value={costCenterId}
                                        onChange={e => {
                                            const id = e.target.value;
                                            setCostCenterId(id);
                                            const cc = costCenters.find(c => c.id === id);
                                            if (cc) setCentroCusto(cc.name as any);

                                            // Reset category if it doesn't belong to the new cost center
                                            if (id && categoryId) {
                                                const currentCat = categories.find(c => c.id === categoryId);
                                                if (currentCat && currentCat.cost_center_id !== id) {
                                                    setCategoryId('');
                                                }
                                            }
                                        }}
                                        className="w-full h-14 px-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-black uppercase text-[12px] tracking-widest outline-none appearance-none"
                                    >
                                        <option value="">Selecione o Centro de Custo</option>
                                        {costCenters.map(cc => (
                                            <option key={cc.id} value={cc.id}>{cc.name} {cc.description ? `- ${cc.description}` : ''}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Categoria *</label>
                                    <select
                                        required
                                        value={categoryId}
                                        onChange={e => {
                                            const id = e.target.value;
                                            setCategoryId(id);
                                            const cat = categories.find(c => c.id === id);
                                            if (cat && cat.cost_center_id) {
                                                setCostCenterId(cat.cost_center_id);
                                                const cc = costCenters.find(c => c.id === cat.cost_center_id);
                                                if (cc) setCentroCusto(cc.name as any);
                                            }
                                        }}
                                        className="w-full h-14 px-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-black uppercase text-[12px] tracking-widest outline-none appearance-none"
                                    >
                                        <option value="">Selecione uma Categoria</option>
                                        {categories
                                            .filter(cat => {
                                                const typeMatch = (tipo === TipoTransacao.INCOME || (tipo as any) === 'RECEITA')
                                                    ? cat.type === TipoTransacao.INCOME
                                                    : cat.type === TipoTransacao.EXPENSE;
                                                const ccMatch = costCenterId ? cat.cost_center_id === costCenterId : true;
                                                return typeMatch && ccMatch;
                                            })
                                            .map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name.toUpperCase()}</option>
                                            ))}
                                    </select>
                                </div>
                            </div>

                            {(tipo === TipoTransacao.EXPENSE || (tipo as any) === 'DESPESA') && (
                                <div className="space-y-2">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Natureza Contábil *</label>
                                    <select
                                        required
                                        value={classificacaoContabil}
                                        onChange={e => setClassificacaoContabil(e.target.value as ClassificacaoContabil)}
                                        className="w-full h-14 px-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-black uppercase text-[12px] tracking-widest outline-none appearance-none"
                                    >
                                        <option value={ClassificacaoContabil.CUSTO_FIXO}>Custo Estrutural Fixo</option>
                                        <option value={ClassificacaoContabil.CUSTO_VARIAVEL}>Custo Operacional Variável</option>
                                        <option value={ClassificacaoContabil.DESPESA_FIXA}>Despesa Administrativa Fixa</option>
                                        <option value={ClassificacaoContabil.DESPESA_VARIAVEL}>Despesa Administrativa Variável</option>
                                    </select>
                                </div>
                            )}

                            <div className="p-4 rounded-sm bg-blue-500/5 border border-blue-500/10 flex items-start gap-4">
                                <div className="p-2 bg-blue-500/10 rounded-sm text-blue-500 mt-1">
                                    <AlertCircle size={16} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[12px] font-black uppercase tracking-widest text-blue-500">Inteligência de Faturamento</p>
                                    <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                                        {(tipo === TipoTransacao.INCOME || (tipo as any) === 'RECEITA')
                                            ? 'Receitas provenientes de serviços são alocadas em COMERCIAL. Alienação de bens em ESTOQUE.'
                                            : 'Custos estão diretamente ligados à operação. Despesas suportam a estrutura organizacional.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </FormSection>

                    {/* Observações */}
                    <FormSection
                        title="Memória de Cálculo / Notas"
                        icon={FileText}
                    >
                        <textarea
                            value={observacoes}
                            onChange={e => setObservacoes(e.target.value)}
                            rows={4}
                            placeholder="Notas detalhadas sobre a transação financeira..."
                            className="w-full p-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium text-sm outline-none resize-none"
                        />
                    </FormSection>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    {/* Datas e Status */}
                    <FormSection
                        title="Temporalidade e Status"
                        icon={Calendar}
                    >
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Data de Emissão *</label>
                                <SwissDatePicker
                                    value={dataEmissao}
                                    onChange={setDataEmissao}
                                    required={true}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Vencimento Efetivo *</label>
                                <SwissDatePicker
                                    value={dataVencimento}
                                    onChange={setDataVencimento}
                                    required={true}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Situação do Título *</label>
                                <select
                                    required
                                    value={status}
                                    onChange={e => setStatus(e.target.value as StatusTransacao)}
                                    className="w-full h-14 px-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-black uppercase text-[12px] tracking-widest outline-none appearance-none"
                                >
                                    <option value={StatusTransacao.PENDING}>AGUARDANDO PAGAMENTO</option>
                                    <option value={StatusTransacao.PAID}>LIQUIDADO / PAGO</option>
                                    <option value={StatusTransacao.PARTIALLY_PAID}>LIQUIDAÇÃO PARCIAL</option>
                                    <option value={StatusTransacao.CANCELLED}>TÍTULO CANCELADO</option>
                                </select>
                            </div>
                        </div>
                    </FormSection>

                    {/* Ficha de Transparência */}
                    <div className="p-8 rounded-sm bg-muted border border-border/40 space-y-4">
                        <div className="flex items-center gap-3 text-primary">
                            <CheckCircle2 size={18} />
                            <h4 className="text-[12px] font-black uppercase tracking-widest">Compliance Financeiro</h4>
                        </div>
                        <p className="text-[12px] font-bold text-muted-foreground leading-relaxed uppercase tracking-tighter">
                            Este registro será auditado pela controladoria. Documentos fiscais anexos devem ser mantidos por 5 anos conforme legislação vigente.
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
};
