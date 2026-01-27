import { CategoriaDespesa, CentroCusto, ClassificacaoContabil } from '../../types';

/**
 * Retorna o Centro de Custo e Classificação Contábil sugeridos baseados na categoria de despesa
 */
export const getSugestaoClassificacao = (
    categoriaDespesa: CategoriaDespesa
): { centro_custo: CentroCusto; classificacao_contabil: ClassificacaoContabil } => {
    const mapeamento: Record<CategoriaDespesa, { centro_custo: CentroCusto; classificacao_contabil: ClassificacaoContabil }> = {
        [CategoriaDespesa.COMBUSTIVEL]: {
            centro_custo: CentroCusto.VENDAS,
            classificacao_contabil: ClassificacaoContabil.CUSTO_VARIAVEL
        },
        [CategoriaDespesa.MANUTENCAO]: {
            centro_custo: CentroCusto.VENDAS,
            classificacao_contabil: ClassificacaoContabil.CUSTO_VARIAVEL
        },
        [CategoriaDespesa.PECAS]: {
            centro_custo: CentroCusto.ESTOQUE,
            classificacao_contabil: ClassificacaoContabil.CUSTO_VARIAVEL
        },
        [CategoriaDespesa.SALARIOS]: {
            centro_custo: CentroCusto.ADMINISTRATIVO,
            classificacao_contabil: ClassificacaoContabil.DESPESA_FIXA
        },
        [CategoriaDespesa.FOLHA_PAGAMENTO]: {
            centro_custo: CentroCusto.ADMINISTRATIVO,
            classificacao_contabil: ClassificacaoContabil.DESPESA_FIXA
        },
        [CategoriaDespesa.IMPOSTOS]: {
            centro_custo: CentroCusto.ADMINISTRATIVO,
            classificacao_contabil: ClassificacaoContabil.DESPESA_VARIAVEL
        },
        [CategoriaDespesa.PEDAGIO]: {
            centro_custo: CentroCusto.VENDAS,
            classificacao_contabil: ClassificacaoContabil.CUSTO_VARIAVEL
        },
        [CategoriaDespesa.SEGURO]: {
            centro_custo: CentroCusto.VENDAS,
            classificacao_contabil: ClassificacaoContabil.CUSTO_FIXO
        },
        [CategoriaDespesa.ALUGUEL]: {
            centro_custo: CentroCusto.ADMINISTRATIVO,
            classificacao_contabil: ClassificacaoContabil.DESPESA_FIXA
        },
        [CategoriaDespesa.OUTROS]: {
            centro_custo: CentroCusto.ADMINISTRATIVO,
            classificacao_contabil: ClassificacaoContabil.DESPESA_VARIAVEL
        }
    };

    return mapeamento[categoriaDespesa];
};
