import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { ImportadorExtrato } from '../components/Financeiro/ImportadorExtrato';
import { ConciliacaoCard } from '../components/Financeiro/ConciliacaoCard';
import { findMatches } from '../utils/conciliacaoMatcher';
import { IExtratoBancario, ITransacaoBancaria, ITransacao, TipoTransacao, StatusTransacao, Moeda, CentroCusto } from '../types';

// Mock data para simular transações do sistema (em produção viria da API/Store)
const MOCK_SISTEMA_TRANSACOES: ITransacao[] = [
    {
        id: 'sis-1',
        tipo: TipoTransacao.RECEITA,
        descricao: 'Venda de Passagem - João Silva',
        valor: 150.00,
        moeda: Moeda.BRL,
        data_emissao: '2023-11-20',
        data_vencimento: '2023-11-20',
        status: StatusTransacao.PAGA,
        criado_por: 'admin',
        criado_em: '2023-11-20T10:00:00Z'
    },
    {
        id: 'sis-2',
        tipo: TipoTransacao.DESPESA,
        descricao: 'Posto Ipiranga - Abastecimento',
        valor: 350.50,
        moeda: Moeda.BRL,
        data_emissao: '2023-11-21',
        data_vencimento: '2023-11-21',
        status: StatusTransacao.PAGA,
        criado_por: 'admin',
        criado_em: '2023-11-21T14:30:00Z'
    }
];

export const ConciliacaoBancaria: React.FC = () => {
    const navigate = useNavigate();
    const [extrato, setExtrato] = useState<IExtratoBancario | null>(null);
    const [matches, setMatches] = useState<any[]>([]);
    const [transacoesSistema, setTransacoesSistema] = useState<ITransacao[]>(MOCK_SISTEMA_TRANSACOES);

    const handleImport = (novoExtrato: IExtratoBancario) => {
        setExtrato(novoExtrato);
        // Rodar algoritmo de matching
        const resultados = findMatches(novoExtrato.transacoes, transacoesSistema);
        setMatches(resultados);
    };

    const handleConciliar = (idBancario: string, idSistema: string) => {
        // Atualizar status da transação bancária
        setMatches(prev => prev.map(m => {
            if (m.transacaoBancaria.id === idBancario) {
                return {
                    ...m,
                    transacaoBancaria: { ...m.transacaoBancaria, status: 'CONCILIADO', id_transacao_sistema: idSistema }
                };
            }
            return m;
        }));

        // TODO: Atualizar transação do sistema via API
        alert(`Conciliado! Banco: ${idBancario} <-> Sistema: ${idSistema}`);
    };

    const handleCriar = (transacaoBancaria: ITransacaoBancaria) => {
        // Criar nova transação no sistema baseada no extrato
        const novaTransacao: ITransacao = {
            id: `new-${Date.now()}`,
            tipo: transacaoBancaria.tipo === 'CREDITO' ? TipoTransacao.RECEITA : TipoTransacao.DESPESA,
            descricao: transacaoBancaria.descricao,
            valor: transacaoBancaria.valor,
            moeda: Moeda.BRL,
            data_emissao: transacaoBancaria.data,
            data_vencimento: transacaoBancaria.data,
            status: StatusTransacao.PAGA,
            criado_por: 'conciliacao',
            criado_em: new Date().toISOString(),
            centro_custo: transacaoBancaria.tipo === 'CREDITO' ? CentroCusto.VENDAS : undefined // Sugestão básica
        };

        setTransacoesSistema(prev => [...prev, novaTransacao]);

        // Re-rodar matching para essa transação específica
        setMatches(prev => prev.map(m => {
            if (m.transacaoBancaria.id === transacaoBancaria.id) {
                return {
                    ...m,
                    transacaoBancaria: { ...m.transacaoBancaria, status: 'CONCILIADO', id_transacao_sistema: novaTransacao.id },
                    sugestaoSistema: novaTransacao,
                    score: 100
                };
            }
            return m;
        }));

        alert('Transação criada e conciliada com sucesso!');
    };

    const handleIgnorar = (idBancario: string) => {
        setMatches(prev => prev.map(m => {
            if (m.transacaoBancaria.id === idBancario) {
                return {
                    ...m,
                    transacaoBancaria: { ...m.transacaoBancaria, status: 'IGNORADO' }
                };
            }
            return m;
        }));
    };

    // Filtrar apenas pendentes para exibir
    const pendentes = matches.filter(m => m.transacaoBancaria.status === 'PENDENTE');
    const conciliadosCount = matches.filter(m => m.transacaoBancaria.status === 'CONCILIADO').length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/admin/financeiro')}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Conciliação Bancária</h1>
                        <p className="text-slate-500 dark:text-slate-400">Importe seu extrato e concilie com o sistema</p>
                    </div>
                </div>
                {extrato && (
                    <div className="flex gap-4 text-sm">
                        <div className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg flex items-center gap-2">
                            <CheckCircle size={16} />
                            <span>{conciliadosCount} Conciliados</span>
                        </div>
                        <div className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg flex items-center gap-2">
                            <AlertCircle size={16} />
                            <span>{pendentes.length} Pendentes</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Importador ou Lista */}
            {!extrato ? (
                <div className="max-w-2xl mx-auto mt-10">
                    <ImportadorExtrato onImport={handleImport} />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Resumo do Extrato */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center">
                        <div>
                            <h3 className="font-semibold text-slate-800 dark:text-white">{extrato.banco}</h3>
                            <p className="text-sm text-slate-500">Ag: {extrato.agencia} | CC: {extrato.conta}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-500">Saldo Final</p>
                            <p className="text-xl font-bold text-slate-800 dark:text-white">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(extrato.saldo_final)}
                            </p>
                        </div>
                        <button
                            onClick={() => setExtrato(null)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500"
                            title="Trocar Arquivo"
                        >
                            <RefreshCw size={20} />
                        </button>
                    </div>

                    {/* Lista de Transações */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Transações Pendentes</h2>
                        {pendentes.length === 0 ? (
                            <div className="text-center py-10 text-slate-500">
                                <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
                                <p>Tudo conciliado! Não há pendências.</p>
                            </div>
                        ) : (
                            pendentes.map((match) => (
                                <ConciliacaoCard
                                    key={match.transacaoBancaria.id}
                                    transacaoBancaria={match.transacaoBancaria}
                                    sugestaoSistema={match.sugestaoSistema}
                                    onConciliar={handleConciliar}
                                    onCriar={handleCriar}
                                    onIgnorar={handleIgnorar}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
