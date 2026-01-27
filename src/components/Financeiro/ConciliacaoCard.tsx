import React from 'react';
import { Check, X, Plus, Search, AlertCircle } from 'lucide-react';
import { ITransacaoBancaria, ITransacao } from '@/types';

interface ConciliacaoCardProps {
    transacaoBancaria: ITransacaoBancaria;
    sugestaoSistema?: ITransacao;
    onConciliar: (idBancario: string, idSistema: string) => void;
    onCriar: (transacao: ITransacaoBancaria) => void;
    onIgnorar: (idBancario: string) => void;
}

export const ConciliacaoCard: React.FC<ConciliacaoCardProps> = ({
    transacaoBancaria,
    sugestaoSistema,
    onConciliar,
    onCriar,
    onIgnorar
}) => {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex flex-col md:flex-row gap-4 items-center">
            {/* Lado Esquerdo: Extrato Bancário */}
            <div className="flex-1 w-full">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {formatDate(transacaoBancaria.data)}
                    </span>
                    <span className={`text-sm font-bold ${transacaoBancaria.tipo === 'CREDITO' ? 'text-green-600' : 'text-red-600'}`}>
                        {transacaoBancaria.tipo === 'CREDITO' ? '+' : '-'}{formatCurrency(transacaoBancaria.valor)}
                    </span>
                </div>
                <p className="text-sm text-slate-800 dark:text-white font-medium truncate" title={transacaoBancaria.descricao}>
                    {transacaoBancaria.descricao}
                </p>
                <div className="mt-2 flex gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        Extrato
                    </span>
                </div>
            </div>

            {/* Divisor / Status */}
            <div className="flex items-center justify-center">
                {sugestaoSistema ? (
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                        <Check size={16} />
                    </div>
                ) : (
                    <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600">
                        <AlertCircle size={16} />
                    </div>
                )}
            </div>

            {/* Lado Direito: Sistema ou Ações */}
            <div className="flex-1 w-full border-l border-slate-200 dark:border-slate-700 pl-0 md:pl-4">
                {sugestaoSistema ? (
                    // Match Encontrado
                    <div className="bg-green-50 dark:bg-green-900/10 rounded-sm p-3 border border-green-100 dark:border-green-900/30">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs text-green-700 dark:text-green-400 font-semibold mb-1">Sugestão Encontrada</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{sugestaoSistema.descricao}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {formatDate(sugestaoSistema.data_emissao)} • {formatCurrency(sugestaoSistema.valor)}
                                </p>
                            </div>
                            <button
                                onClick={() => onConciliar(transacaoBancaria.id, sugestaoSistema.id)}
                                className="p-2 bg-green-600 hover:bg-green-500 text-white rounded-sm transition-colors"
                                title="Confirmar Conciliação"
                            >
                                <Check size={16} />
                            </button>
                        </div>
                    </div>
                ) : (
                    // Sem Match - Ações
                    <div className="flex flex-col gap-2">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Nenhuma correspondência exata</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onCriar(transacaoBancaria)}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-sm transition-colors"
                            >
                                <Plus size={14} /> Lançar
                            </button>
                            <button
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-sm transition-colors"
                            >
                                <Search size={14} /> Buscar
                            </button>
                            <button
                                onClick={() => onIgnorar(transacaoBancaria.id)}
                                className="p-2 border border-slate-300 dark:border-slate-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-500 rounded-sm transition-colors"
                                title="Ignorar"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
