import type { DadosFiscaisProduto } from '@shared/types/produto'
import { FISCAL_PRODUTO_PADRAO } from '@shared/utils/fiscal-produto'

export const NCM_PIZZA_PADRAO = '19059090'

export interface SnapshotFiscalItem {
  fiscalNcm: string | null
  fiscalCfop: string
  fiscalIcmsOrigem: number
  fiscalIcmsCsosn: string
  fiscalPisCst: string
  fiscalCofinsCst: string
}

export const SNAPSHOT_FISCAL_PIZZA: SnapshotFiscalItem = {
  fiscalNcm: NCM_PIZZA_PADRAO,
  fiscalCfop: FISCAL_PRODUTO_PADRAO.fiscalCfop,
  fiscalIcmsOrigem: FISCAL_PRODUTO_PADRAO.fiscalIcmsOrigem,
  fiscalIcmsCsosn: FISCAL_PRODUTO_PADRAO.fiscalIcmsCsosn,
  fiscalPisCst: FISCAL_PRODUTO_PADRAO.fiscalPisCst,
  fiscalCofinsCst: FISCAL_PRODUTO_PADRAO.fiscalCofinsCst,
}

export function snapshotFiscalDeProduto(
  produto: Pick<
    DadosFiscaisProduto,
    | 'fiscalNcm'
    | 'fiscalCfop'
    | 'fiscalIcmsOrigem'
    | 'fiscalIcmsCsosn'
    | 'fiscalPisCst'
    | 'fiscalCofinsCst'
  >,
): SnapshotFiscalItem {
  return {
    fiscalNcm: produto.fiscalNcm,
    fiscalCfop: produto.fiscalCfop || FISCAL_PRODUTO_PADRAO.fiscalCfop,
    fiscalIcmsOrigem: produto.fiscalIcmsOrigem ?? FISCAL_PRODUTO_PADRAO.fiscalIcmsOrigem,
    fiscalIcmsCsosn: produto.fiscalIcmsCsosn || FISCAL_PRODUTO_PADRAO.fiscalIcmsCsosn,
    fiscalPisCst: produto.fiscalPisCst || FISCAL_PRODUTO_PADRAO.fiscalPisCst,
    fiscalCofinsCst: produto.fiscalCofinsCst || FISCAL_PRODUTO_PADRAO.fiscalCofinsCst,
  }
}

export function itemProdutoPodeEmitirNfce(item: {
  produtoId: string | null
  fiscalNcm: string | null
}): boolean {
  if (!item.produtoId) {
    return true
  }

  return Boolean(item.fiscalNcm && item.fiscalNcm.trim().length >= 8)
}
