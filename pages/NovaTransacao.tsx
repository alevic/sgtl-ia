import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, DollarSign, Tag, FileText, Upload } from 'lucide-react';
import {
    TipoTransacao, CategoriaReceita, CategoriaDespesa, FormaPagamento,
    StatusTransacao, Moeda, CentroCusto, ClassificacaoContabil
} from '../types';
import { getSugestaoClassificacao } from '../utils/classificacaoContabil';

export const NovaTransacao: React.FC = () => {
    const navigate = useNavigate();

    // Form state
    const [tipo, setTipo] = useState<TipoTransacao>(TipoTransacao.DESPESA);
    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');
    const [moeda, setMoeda] = useState<Moeda>(Moeda.BRL);
    const [dataEmissao, setDataEmissao] = useState(new Date().toISOString().split('T')[0]);
    const [dataVencimento, setDataVencimento] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState<StatusTransacao>(StatusTransacao.PENDENTE);
    const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>(FormaPagamento.DINHEIRO);
    const [categoriaReceita, setCategoriaReceita] = useState<CategoriaReceita>(CategoriaReceita.OUTROS);
    const [categoriaDespesa, setCategoriaDespesa] = useState<CategoriaDespesa>(CategoriaDespesa.OUTROS);
    const [numeroDocumento, setNumeroDocumento] = useState('');
    const [observacoes, setObservacoes] = useState('');

    // Centros de Custo
    const [centroCusto, setCentroCusto] = useState<CentroCusto>(CentroCusto.VENDAS);
    const [classificacaoContabil, setClassificacaoContabil] = useState<ClassificacaoContabil>(ClassificacaoContabil.CUSTO_VARIAVEL);

    // Auto-sugerir classificação quando categoria de despesa mudar
    useEffect(() => {
        if (tipo === TipoTransacao.DESPESA) {
            const sugestao = getSugestaoClassificacao(categoriaDespesa);
            if (sugestao) {
                setCentroCusto(sugestao.centro_custo);
                setClassificacaoContabil(sugestao.classificacao_contabil);
            }
        } else if (tipo === TipoTransacao.RECEITA) {
            setCentroCusto(CentroCusto.VENDAS);
        }
    }, [tipo, categoriaDespesa]);

    // Handle initial state from navigation (e.g. from Maintenance module)
    useEffect(() => {
        const state = window.history.state?.usr;
        if (state) {
            if (state.valor) setValor(state.valor.toString());
            if (state.descricao) setDescricao(state.descricao);
            if (state.categoria_despesa) {
                setTipo(TipoTransacao.DESPESA);
                setCategoriaDespesa(state.categoria_despesa);
            }
            if (state.centro_custo) setCentroCusto(state.centro_custo);
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
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
            categoria_receita: tipo === TipoTransacao.RECEITA ? categoriaReceita : undefined,
            categoria_despesa: tipo === TipoTransacao.DESPESA ? categoriaDespesa : undefined,
            centro_custo: centroCusto,
            classificacao_contabil: tipo === TipoTransacao.DESPESA ? classificacaoContabil : undefined,
            numero_documento: numeroDocumento,
            observacoes,
            criado_por: 'admin',
            criado_em: new Date().toISOString()
        };

        console.log('Nova transação:', transacao);
        alert('Transação registrada com sucesso!');
        navigate('/admin/financeiro');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate('/admin/financeiro')}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Nova Transação</h1>
                    <p className="text-slate-500 dark:text-slate-400">Registrar receita ou despesa manualmente</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Tipo de Transação */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Tipo de Transação</h2>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setTipo(TipoTransacao.RECEITA)}
                            className={`flex-1 p-4 rounded-lg border-2 transition-all ${tipo === TipoTransacao.RECEITA
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                : 'border-slate-200 dark:border-slate-700 hover:border-green-300'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <DollarSign size={24} className={tipo === TipoTransacao.RECEITA ? 'text-green-600' : 'text-slate-400'} />
                            </div>
                            <p className={`font-semibold ${tipo === TipoTransacao.RECEITA ? 'text-green-700 dark:text-green-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                Receita
                            </p>
                        </button>

                        <button
                            type="button"
                            onClick={() => setTipo(TipoTransacao.DESPESA)}
                            className={`flex-1 p-4 rounded-lg border-2 transition-all ${tipo === TipoTransacao.DESPESA
                                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                : 'border-slate-200 dark:border-slate-700 hover:border-red-300'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <DollarSign size={24} className={tipo === TipoTransacao.DESPESA ? 'text-red-600' : 'text-slate-400'} />
                            </div>
                            <p className={`font-semibold ${tipo === TipoTransacao.DESPESA ? 'text-red-700 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                Despesa
                            </p>
                        </button>
                    </div>
                </div>

                {/* Informações Básicas */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Informações Básicas</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Descrição */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Descrição <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={descricao}
                                onChange={e => setDescricao(e.target.value)}
                                placeholder="Ex: Pagamento de fornecedor, Venda de passagem..."
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Valor */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Valor <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    min="0"
                                    value={valor}
                                    onChange={e => setValor(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Moeda */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Moeda
                            </label>
                            <select
                                value={moeda}
                                onChange={e => setMoeda(e.target.value as Moeda)}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={Moeda.BRL}>BRL - Real</option>
                                <option value={Moeda.USD}>USD - Dólar</option>
                                <option value={Moeda.EUR}>EUR - Euro</option>
                                <option value={Moeda.PYG}>PYG - Guarani</option>
                                <option value={Moeda.ARS}>ARS - Peso Argentino</option>
                            </select>
                        </div>

                        {/* Categoria */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Categoria <span className="text-red-500">*</span>
                            </label>
                            {tipo === TipoTransacao.RECEITA ? (
                                <select
                                    required
                                    value={categoriaReceita}
                                    onChange={e => setCategoriaReceita(e.target.value as CategoriaReceita)}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={CategoriaReceita.VENDA_PASSAGEM}>Venda de Passagem</option>
                                    <option value={CategoriaReceita.FRETAMENTO}>Fretamento</option>
                                    <option value={CategoriaReceita.ENCOMENDA}>Encomenda</option>
                                    <option value={CategoriaReceita.OUTROS}>Outros</option>
                                </select>
                            ) : (
                                <select
                                    required
                                    value={categoriaDespesa}
                                    onChange={e => setCategoriaDespesa(e.target.value as CategoriaDespesa)}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={CategoriaDespesa.COMBUSTIVEL}>Combustível</option>
                                    <option value={CategoriaDespesa.MANUTENCAO}>Manutenção</option>
                                    <option value={CategoriaDespesa.PECAS}>Peças</option>
                                    <option value={CategoriaDespesa.SALARIOS}>Salários</option>
                                    <option value={CategoriaDespesa.FOLHA_PAGAMENTO}>Folha de Pagamento</option>
                                    <option value={CategoriaDespesa.IMPOSTOS}>Impostos</option>
                                    <option value={CategoriaDespesa.PEDAGIO}>Pedágio</option>
                                    <option value={CategoriaDespesa.SEGURO}>Seguro</option>
                                    <option value={CategoriaDespesa.ALUGUEL}>Aluguel</option>
                                    <option value={CategoriaDespesa.OUTROS}>Outros</option>
                                </select>
                            )}
                        </div>

                        {/* Número do Documento */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Número do Documento
                            </label>
                            <input
                                type="text"
                                value={numeroDocumento}
                                onChange={e => setNumeroDocumento(e.target.value)}
                                placeholder="Ex: NF-12345, OS-987"
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Centros de Custo */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Centros de Custo</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Centro de Custo */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Centro de Custo <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={centroCusto}
                                onChange={e => setCentroCusto(e.target.value as CentroCusto)}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={CentroCusto.ESTOQUE}>Estoque - Equipamentos e Produtos</option>
                                <option value={CentroCusto.VENDAS}>Vendas - Serviços Prestados</option>
                                <option value={CentroCusto.ADMINISTRATIVO}>Administrativo - RH, Financeiro, Marketing</option>
                            </select>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                ✨ Sugestão automática baseada na categoria
                            </p>
                        </div>

                        {/* Classificação Contábil (apenas para despesas) */}
                        {tipo === TipoTransacao.DESPESA && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Classificação Contábil <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={classificacaoContabil}
                                    onChange={e => setClassificacaoContabil(e.target.value as ClassificacaoContabil)}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={ClassificacaoContabil.CUSTO_FIXO}>Custo Fixo</option>
                                    <option value={ClassificacaoContabil.CUSTO_VARIAVEL}>Custo Variável</option>
                                    <option value={ClassificacaoContabil.DESPESA_FIXA}>Despesa Fixa</option>
                                    <option value={ClassificacaoContabil.DESPESA_VARIAVEL}>Despesa Variável</option>
                                </select>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    ✨ Sugestão automática baseada na categoria
                                </p>
                            </div>
                        )}

                        {/* Info helper */}
                        <div className="md:col-span-2">
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                <p className="text-sm text-blue-800 dark:text-blue-300">
                                    <strong>Dica:</strong> {tipo === TipoTransacao.RECEITA
                                        ? 'Receitas de serviços são VENDAS. Venda de ativos (ex: ônibus) são ESTOQUE.'
                                        : 'Custos relacionam-se à produção/vendas. Despesas são administrativas.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Datas e Status */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Datas e Status</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Data de Emissão */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Data de Emissão <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="date"
                                    required
                                    value={dataEmissao}
                                    onChange={e => setDataEmissao(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Data de Vencimento */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Data de Vencimento <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="date"
                                    required
                                    value={dataVencimento}
                                    onChange={e => setDataVencimento(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Status <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={status}
                                onChange={e => setStatus(e.target.value as StatusTransacao)}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={StatusTransacao.PENDENTE}>Pendente</option>
                                <option value={StatusTransacao.PAGA}>Paga</option>
                                <option value={StatusTransacao.PARCIALMENTE_PAGA}>Parcialmente Paga</option>
                                <option value={StatusTransacao.CANCELADA}>Cancelada</option>
                            </select>
                        </div>

                        {/* Forma de Pagamento */}
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Forma de Pagamento
                            </label>
                            <select
                                value={formaPagamento}
                                onChange={e => setFormaPagamento(e.target.value as FormaPagamento)}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={FormaPagamento.DINHEIRO}>Dinheiro</option>
                                <option value={FormaPagamento.PIX}>PIX</option>
                                <option value={FormaPagamento.CARTAO_CREDITO}>Cartão de Crédito</option>
                                <option value={FormaPagamento.CARTAO_DEBITO}>Cartão de Débito</option>
                                <option value={FormaPagamento.BOLETO}>Boleto</option>
                                <option value={FormaPagamento.TRANSFERENCIA}>Transferência</option>
                                <option value={FormaPagamento.CHEQUE}>Cheque</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Observações */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Observações</h2>
                    <textarea
                        value={observacoes}
                        onChange={e => setObservacoes(e.target.value)}
                        rows={4}
                        placeholder="Informações adicionais sobre a transação..."
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Ações */}
                <div className="flex gap-3 justify-end">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/financeiro')}
                        className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                    >
                        <Save size={18} />
                        Salvar Transação
                    </button>
                </div>
            </form>
        </div>
    );
};
