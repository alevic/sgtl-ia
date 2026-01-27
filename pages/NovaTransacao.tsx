import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, DollarSign, Tag, FileText, Upload } from 'lucide-react';
import {
    TipoTransacao, CategoriaReceita, CategoriaDespesa, FormaPagamento,
    StatusTransacao, Moeda, CentroCusto, ClassificacaoContabil
} from '../types';
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

    // Centros de Custo
    const [centroCusto, setCentroCusto] = useState<CentroCusto>(CentroCusto.VENDAS);
    const [classificacaoContabil, setClassificacaoContabil] = useState<ClassificacaoContabil>(ClassificacaoContabil.CUSTO_VARIAVEL);

    const [maintenanceId, setMaintenanceId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Auto-sugerir classificação quando categoria de despesa mudar
    useEffect(() => {
        if (tipo === TipoTransacao.EXPENSE || (tipo as any) === 'DESPESA') {
            const sugestao = getSugestaoClassificacao(categoriaDespesa);
            if (sugestao) {
                setCentroCusto(sugestao.centro_custo);
                setClassificacaoContabil(sugestao.classificacao_contabil);
            }
        } else if (tipo === TipoTransacao.INCOME || (tipo as any) === 'RECEITA') {
            setCentroCusto(CentroCusto.VENDAS);
        }
    }, [tipo, categoriaDespesa]);

    // Handle initial state from navigation
    useEffect(() => {
        const state = location.state as any;

        if (state) {
            if (state.manutencao_id) {
                setMaintenanceId(state.manutencao_id);
            }

            if (state.id) {
                setId(state.id);
                setTipo(state.tipo);
                setDescricao(state.descricao);
                setValor(state.valor.toString());
                setMoeda(state.moeda);
                setDataEmissao(state.data_emissao.split('T')[0]);
                setDataVencimento(state.data_vencimento.split('T')[0]);
                setStatus(state.status);
                setFormaPagamento(state.forma_pagamento);
                setNumeroDocumento(state.numero_documento || '');
                setObservacoes(state.observacoes || '');

                if (state.tipo === TipoTransacao.INCOME || state.tipo === 'RECEITA') {
                    setCategoriaReceita(state.categoria_receita);
                } else {
                    setCategoriaDespesa(state.categoria_despesa);
                    setCentroCusto(state.centro_custo);
                    setClassificacaoContabil(state.classificacao_contabil);
                }
            }
            else {
                if (state.tipo) setTipo(state.tipo);
                if (state.valor) setValor(state.valor.toString());
                if (state.descricao) setDescricao(state.descricao);
                if (state.categoria_despesa) {
                    setTipo(TipoTransacao.EXPENSE);
                    setCategoriaDespesa(state.categoria_despesa);
                }
                if (state.centro_custo) setCentroCusto(state.centro_custo);
            }
        }
    }, [location]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const transacao = {
            tipo,
            descricao,
            valor: parseFloat(valor),
            moeda,
            data_emissao: dataEmissao,
            data_vencimento: dataVencimento,
            status,
            forma_pagamento: formaPagamento,
            categoria_receita: (tipo === TipoTransacao.INCOME || (tipo as any) === 'RECEITA') ? categoriaReceita : undefined,
            categoria_despesa: (tipo === TipoTransacao.EXPENSE || (tipo as any) === 'DESPESA') ? categoriaDespesa : undefined,
            centro_custo: centroCusto,
            classificacao_contabil: (tipo === TipoTransacao.EXPENSE || (tipo as any) === 'DESPESA') ? classificacaoContabil : undefined,
            numero_documento: numeroDocumento,
            observacoes,
            maintenance_id: maintenanceId
            // criado_por and criado_em are handled by the backend
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
                title={id ? 'Editar Transação' : 'Nova Transação'}
                subtitle={id ? 'Ajuste de registro financeiro existente' : 'Lançamento manual de entrada ou saída de caixa'}
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

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                <div className="space-y-2">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Categoria de Fluxo *</label>
                                    {(tipo === TipoTransacao.INCOME || (tipo as any) === 'RECEITA') ? (
                                        <select
                                            required
                                            value={categoriaReceita}
                                            onChange={e => setCategoriaReceita(e.target.value as CategoriaReceita)}
                                            className="w-full h-14 px-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-black uppercase text-[12px] tracking-widest outline-none appearance-none"
                                        >
                                            <option value={CategoriaReceita.VENDA_PASSAGEM}>Venda de Passagem</option>
                                            <option value={CategoriaReceita.FRETAMENTO}>Fretamento</option>
                                            <option value={CategoriaReceita.ENCOMENDA}>Encomenda</option>
                                            <option value={CategoriaReceita.OUTROS}>Outros Recebíveis</option>
                                        </select>
                                    ) : (
                                        <select
                                            required
                                            value={categoriaDespesa}
                                            onChange={e => setCategoriaDespesa(e.target.value as CategoriaDespesa)}
                                            className="w-full h-14 px-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-black uppercase text-[12px] tracking-widest outline-none appearance-none"
                                        >
                                            <option value={CategoriaDespesa.COMBUSTIVEL}>Combustível</option>
                                            <option value={CategoriaDespesa.MANUTENCAO}>Manutenção</option>
                                            <option value={CategoriaDespesa.PECAS}>Peças e Acessórios</option>
                                            <option value={CategoriaDespesa.SALARIOS}>Salários e Pró-labore</option>
                                            <option value={CategoriaDespesa.FOLHA_PAGAMENTO}>Encargos Sociais</option>
                                            <option value={CategoriaDespesa.IMPOSTOS}>Impostos e Taxas</option>
                                            <option value={CategoriaDespesa.PEDAGIO}>Pedágio e Viagem</option>
                                            <option value={CategoriaDespesa.SEGURO}>Seguro Veicular/Resp.</option>
                                            <option value={CategoriaDespesa.ALUGUEL}>Aluguel e Infra</option>
                                            <option value={CategoriaDespesa.OUTROS}>Outros Gastos</option>
                                        </select>
                                    )}
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
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Forma de Liquidação</label>
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
                                        value={centroCusto}
                                        onChange={e => setCentroCusto(e.target.value as CentroCusto)}
                                        className="w-full h-14 px-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-black uppercase text-[12px] tracking-widest outline-none appearance-none"
                                    >
                                        <option value={CentroCusto.ESTOQUE}>Estoque - Ativos e Equipamentos</option>
                                        <option value={CentroCusto.VENDAS}>Comercial - Serviços e Vendas</option>
                                        <option value={CentroCusto.ADMINISTRATIVO}>Administrativo - Gestão e RH</option>
                                    </select>
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
                            </div>

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
