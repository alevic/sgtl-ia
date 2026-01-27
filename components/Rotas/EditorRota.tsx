import React from 'react';
import { IRota, IPontoRota } from '../../types';
import { SeletorPontoRota } from './SeletorPontoRota';
import { criarPontoRotaVazio, validarRota, calcularDuracaoRota, gerarNomeRota, calcularTemposRelativos } from '../../utils/rotaValidation';
import { Plus, X, ArrowUp, ArrowDown, AlertCircle, Clock, Route } from 'lucide-react';

interface EditorRotaProps {
    rota: IRota;
    onChange: (rota: IRota) => void;
    readonly?: boolean;
}

export const EditorRota: React.FC<EditorRotaProps> = ({
    rota,
    onChange,
    readonly = false
}) => {
    const handlePontoChange = (index: number, pontoAtualizado: IPontoRota) => {
        let novosPontos = [...rota.pontos];
        novosPontos[index] = pontoAtualizado;

        // Recalcular tempos acumulados
        novosPontos = calcularTemposRelativos(novosPontos);

        onChange({
            ...rota,
            pontos: novosPontos,
            nome: gerarNomeRota(novosPontos),
            duracao_estimada_minutos: calcularDuracaoRota(novosPontos)
        });
    };

    const adicionarParada = () => {
        const novosPontos = [...rota.pontos];
        const novaPosicao = novosPontos.length - 1; // Antes do destino

        // Inserir nova parada antes do destino
        const novaParada = criarPontoRotaVazio('PARADA_INTERMEDIARIA', novaPosicao);
        novosPontos.splice(novaPosicao, 0, novaParada);

        // Reordenar
        let pontosReordenados = novosPontos.map((p, idx) => ({ ...p, ordem: idx }));

        // Recalcular tempos
        pontosReordenados = calcularTemposRelativos(pontosReordenados);

        onChange({
            ...rota,
            pontos: pontosReordenados,
            nome: gerarNomeRota(pontosReordenados),
            duracao_estimada_minutos: calcularDuracaoRota(pontosReordenados)
        });
    };

    const removerParada = (index: number) => {
        // Não permitir remover origem ou destino
        if (index === 0 || index === rota.pontos.length - 1) return;

        const novosPontos = rota.pontos.filter((_, i) => i !== index);
        let pontosReordenados = novosPontos.map((p, idx) => ({ ...p, ordem: idx }));

        // Recalcular tempos
        pontosReordenados = calcularTemposRelativos(pontosReordenados);

        onChange({
            ...rota,
            pontos: pontosReordenados,
            nome: gerarNomeRota(pontosReordenados),
            duracao_estimada_minutos: calcularDuracaoRota(pontosReordenados)
        });
    };

    const moverParada = (index: number, direcao: 'up' | 'down') => {
        // Não permitir mover origem ou destino
        if (index === 0 || index === rota.pontos.length - 1) return;

        const novoIndice = direcao === 'up' ? index - 1 : index + 1;

        // Verificar limites
        if (novoIndice < 1 || novoIndice >= rota.pontos.length - 1) return;

        const novosPontos = [...rota.pontos];
        [novosPontos[index], novosPontos[novoIndice]] = [novosPontos[novoIndice], novosPontos[index]];

        let pontosReordenados = novosPontos.map((p, idx) => ({ ...p, ordem: idx }));

        // Recalcular tempos
        pontosReordenados = calcularTemposRelativos(pontosReordenados);

        onChange({
            ...rota,
            pontos: pontosReordenados,
            nome: gerarNomeRota(pontosReordenados),
            duracao_estimada_minutos: calcularDuracaoRota(pontosReordenados)
        });
    };

    const validacao = validarRota(rota);
    const duracaoHoras = rota.duracao_estimada_minutos
        ? Math.floor(rota.duracao_estimada_minutos / 60)
        : 0;
    const duracaoMinutos = rota.duracao_estimada_minutos
        ? rota.duracao_estimada_minutos % 60
        : 0;

    return (
        <div className="space-y-6">
            {/* Header com informações da rota */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-sm p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Route size={20} className="text-blue-600" />
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                            {rota.nome || 'Rota sem nome'}
                        </h4>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${rota.tipo_rota === 'IDA'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}>
                        {rota.tipo_rota}
                    </span>
                </div>

                {rota.duracao_estimada_minutos && rota.duracao_estimada_minutos > 0 && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Clock size={16} />
                        <span>
                            Duração estimada: {duracaoHoras}h {duracaoMinutos}min
                        </span>
                    </div>
                )}
            </div>

            {/* Mensagens de validação */}
            {!validacao.valida && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-sm p-4">
                    <div className="flex items-start gap-2">
                        <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h5 className="font-semibold text-red-800 dark:text-red-400 mb-2">
                                Problemas encontrados na rota:
                            </h5>
                            <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
                                {validacao.erros.map((erro, idx) => (
                                    <li key={idx}>{erro}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Lista de pontos */}
            <div className="space-y-4">
                {rota.pontos.map((ponto, index) => (
                    <div
                        key={ponto.id}
                        className="relative"
                    >
                        {/* Linha conectora (exceto para o último ponto) */}
                        {index < rota.pontos.length - 1 && (
                            <div className="absolute left-6 top-full h-4 w-0.5 bg-gradient-to-b from-blue-400 to-blue-300 dark:from-blue-600 dark:to-blue-700 z-0" />
                        )}

                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-4 relative z-10">
                            <div className="flex items-start gap-4">
                                {/* Indicador visual */}
                                <div className="flex flex-col items-center gap-2 pt-2">
                                    <div className={`w-3 h-3 rounded-full ${ponto.tipo === 'ORIGEM'
                                        ? 'bg-green-500'
                                        : ponto.tipo === 'DESTINO'
                                            ? 'bg-red-500'
                                            : 'bg-blue-500'
                                        }`} />
                                </div>

                                {/* Editor do ponto */}
                                <div className="flex-1">
                                    <SeletorPontoRota
                                        ponto={ponto}
                                        onChange={(p) => handlePontoChange(index, p)}
                                        readonly={readonly}
                                    />
                                </div>

                                {/* Controles (apenas para paradas intermediárias) */}
                                {!readonly && ponto.tipo === 'PARADA_INTERMEDIARIA' && (
                                    <div className="flex flex-col gap-2 pt-2">
                                        <button
                                            onClick={() => moverParada(index, 'up')}
                                            disabled={index === 1}
                                            className="p-2 rounded-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Mover para cima"
                                        >
                                            <ArrowUp size={16} className="text-slate-600 dark:text-slate-400" />
                                        </button>
                                        <button
                                            onClick={() => moverParada(index, 'down')}
                                            disabled={index === rota.pontos.length - 2}
                                            className="p-2 rounded-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Mover para baixo"
                                        >
                                            <ArrowDown size={16} className="text-slate-600 dark:text-slate-400" />
                                        </button>
                                        <button
                                            onClick={() => removerParada(index)}
                                            className="p-2 rounded-sm bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                            title="Remover parada"
                                        >
                                            <X size={16} className="text-red-600 dark:text-red-400" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Botão adicionar parada */}
            {!readonly && (
                <button
                    onClick={adicionarParada}
                    className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-sm hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                >
                    <Plus size={20} />
                    Adicionar Parada Intermediária
                </button>
            )}
        </div>
    );
};
