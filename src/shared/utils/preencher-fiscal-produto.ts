import type { DadosFiscaisProduto } from '@shared/types/produto'
import { resolverNcmProduto, type SugestaoNcmProduto } from '@shared/data/ncm-catalogo-restaurante'
import { FISCAL_PRODUTO_PADRAO, resolverDadosFiscaisProduto } from '@shared/utils/fiscal-produto'

export interface ProdutoParaPreencherFiscal {
  id: string
  nome: string
  categoriaNome: string
  fiscalNcm: string | null
  fiscalCest: string | null
  fiscalCfop: string
  fiscalIcmsOrigem: number
  fiscalIcmsCsosn: string
  fiscalPisCst: string
  fiscalCofinsCst: string
  fiscalAliquotaNacional: number | null
}

export interface ResultadoPreencherFiscalProduto {
  produtoId: string
  nome: string
  atualizado: boolean
  motivo: 'atualizado' | 'sem_sugestao' | 'ja_preenchido' | 'sem_alteracao'
  sugestao?: SugestaoNcmProduto
  dadosFiscais?: DadosFiscaisProduto
}

export function montarDadosFiscaisComSugestao(
  produto: ProdutoParaPreencherFiscal,
  sugestao: SugestaoNcmProduto,
): DadosFiscaisProduto {
  return resolverDadosFiscaisProduto({
    fiscalNcm: sugestao.ncm,
    fiscalCest: sugestao.cest ?? produto.fiscalCest,
    fiscalCfop: sugestao.fiscalCfop ?? (produto.fiscalCfop || FISCAL_PRODUTO_PADRAO.fiscalCfop),
    fiscalIcmsOrigem: produto.fiscalIcmsOrigem,
    fiscalIcmsCsosn: sugestao.fiscalIcmsCsosn ?? produto.fiscalIcmsCsosn,
    fiscalPisCst: sugestao.fiscalPisCst ?? produto.fiscalPisCst,
    fiscalCofinsCst: sugestao.fiscalCofinsCst ?? produto.fiscalCofinsCst,
    fiscalAliquotaNacional: produto.fiscalAliquotaNacional,
  })
}

export function preencherFiscalProduto(
  produto: ProdutoParaPreencherFiscal,
  opcoes: { forcar?: boolean } = {},
): ResultadoPreencherFiscalProduto {
  if (produto.fiscalNcm && !opcoes.forcar) {
    return {
      produtoId: produto.id,
      nome: produto.nome,
      atualizado: false,
      motivo: 'ja_preenchido',
    }
  }

  const sugestao = resolverNcmProduto(produto.nome, produto.categoriaNome)
  if (!sugestao) {
    return {
      produtoId: produto.id,
      nome: produto.nome,
      atualizado: false,
      motivo: 'sem_sugestao',
    }
  }

  const dadosFiscais = montarDadosFiscaisComSugestao(produto, sugestao)
  const jaIgual =
    produto.fiscalNcm === dadosFiscais.fiscalNcm &&
    produto.fiscalCest === dadosFiscais.fiscalCest &&
    produto.fiscalCfop === dadosFiscais.fiscalCfop &&
    produto.fiscalIcmsCsosn === dadosFiscais.fiscalIcmsCsosn &&
    produto.fiscalPisCst === dadosFiscais.fiscalPisCst &&
    produto.fiscalCofinsCst === dadosFiscais.fiscalCofinsCst

  if (jaIgual && produto.fiscalNcm) {
    return {
      produtoId: produto.id,
      nome: produto.nome,
      atualizado: false,
      motivo: 'sem_alteracao',
      sugestao,
      dadosFiscais,
    }
  }

  return {
    produtoId: produto.id,
    nome: produto.nome,
    atualizado: true,
    motivo: 'atualizado',
    sugestao,
    dadosFiscais,
  }
}
