import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, CheckCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ImportadorExtrato } from '../components/Financeiro/ImportadorExtrato';
import { ConciliacaoCard } from '../components/Financeiro/ConciliacaoCard';
import { findMatches } from '../utils/conciliacaoMatcher';
import { IExtratoBancario, ITransacaoBancaria, ITransacao, TipoTransacao, StatusTransacao, Moeda, CentroCusto } from '../types';
import { authClient } from '../lib/auth-client';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/Layout/PageHeader';
import { DashboardCard } from '../components/Layout/DashboardCard';
import { cn } from '../lib/utils';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

// Mock data para simular transações do sistema (em produção viria da API/Store)
const MOCK_SISTEMA_TRANSACOES: ITransacao[] = [
    {
        id: 'sis-1',
        tipo: TipoTransacao.INCOME,
        descricao: 'Venda de Passagem - João Silva',
        valor: 150.00,
        moeda: Moeda.BRL,
        data_emissao: '2023-11-20',
        data_vencimento: '2023-11-20',
        status: StatusTransacao.PAID,
        criado_por: 'admin',
        criado_em: '2023-11-20T10:00:00Z'
    },
    {
        id: 'sis-2',
        tipo: TipoTransacao.EXPENSE,
        descricao: 'Posto Ipiranga - Abastecimento',
        valor: 350.50,
        moeda: Moeda.BRL,
        data_emissao: '2023-11-21',
        data_vencimento: '2023-11-21',
        status: StatusTransacao.PAID,
        criado_por: 'admin',
        criado_em: '2023-11-21T14:30:00Z'
    }
];

export const ConciliacaoBancaria: React.FC = () => {
    const navigate = useNavigate();
    const [extrato, setExtrato] = useState<IExtratoBancario | null>(null);
    const [matches, setMatches] = useState<any[]>([]);
    const [transacoesSistema, setTransacoesSistema] = useState<ITransacao[]>(MOCK_SISTEMA_TRANSACOES);
    const [success, setSuccess] = useState<string | null>(null);

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
        setSuccess(`Conciliado! Banco: ${idBancario} <-> Sistema: ${idSistema}`);
        setTimeout(() => setSuccess(null), 3000);
    };

    const handleCriar = (transacaoBancaria: ITransacaoBancaria) => {
        // Criar nova transação no sistema baseada no extrato
        const novaTransacao: ITransacao = {
            id: `new-${Date.now()}`,
            tipo: transacaoBancaria.tipo === 'CREDITO' ? TipoTransacao.INCOME : TipoTransacao.EXPENSE,
            descricao: transacaoBancaria.descricao,
            valor: transacaoBancaria.valor,
            moeda: Moeda.BRL,
            data_emissao: transacaoBancaria.data,
            data_vencimento: transacaoBancaria.data,
            status: StatusTransacao.PAID,
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

        setSuccess('Transação criada e conciliada com sucesso!');
        setTimeout(() => setSuccess(null), 3000);
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
            {success && (
                <Alert className="border-emerald-500 text-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 animate-in fade-in slide-in-from-top-2 duration-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <AlertTitle>Sucesso</AlertTitle>
                    <AlertDescription>{success}</AlertDescription>
                </Alert>
            )}
            {/* Header Module */}
            <PageHeader
                title="Conciliação Bancária"
                subtitle="Sincronismo estratégico entre movimentações bancárias e registros operacionais"
                icon={RefreshCw}
                backLink="/admin/financeiro"
                backLabel="Painel Financeiro"
                rightElement={extrato && (
                    <div className="flex gap-4">
                        <div className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-sm flex items-center gap-2 animate-in zoom-in-95">
                            <CheckCircle2 size={16} strokeWidth={3} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{conciliadosCount} CONCILIADOS</span>
                        </div>
                        <div className="px-6 py-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 rounded-sm flex items-center gap-2 animate-in zoom-in-95">
                            <AlertCircle size={16} strokeWidth={3} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{pendentes.length} PENDENTES</span>
                        </div>
                    </div>
                )}
            />

            {/* Importador ou Lista */}
            {!extrato ? (
                <div className="max-w-2xl mx-auto mt-10">
                    <ImportadorExtrato onImport={handleImport} />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Executive Summary Card */}
                    <Card className="shadow-2xl shadow-muted/20 bg-card   border border-border/40 rounded-[2.5rem] overflow-hidden">
                        <div className="p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-primary/10 rounded-sm text-primary">
                                    <RefreshCw size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-foreground uppercase tracking-tight">{extrato.banco}</h3>
                                    <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">AG: {extrato.agencia} | CC: {extrato.conta}</p>
                                </div>
                            </div>

                            <div className="flex gap-12">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Saldo Final Extrato</p>
                                    <p className="text-2xl font-black text-foreground tracking-tight">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(extrato.saldo_final)}
                                    </p>
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={() => setExtrato(null)}
                                    className="h-14 px-6 rounded-sm border-border/40 hover:bg-muted text-muted-foreground transition-all"
                                >
                                    <RefreshCw size={18} className="mr-2" />
                                    Trocar Arquivo
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Lista de Transações */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
                            Transações Pendentes
                            <span className="text-[12px] font-bold text-muted-foreground normal-case opacity-60">
                                {pendentes.length} registros aguardando ação
                            </span>
                        </h2>
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
