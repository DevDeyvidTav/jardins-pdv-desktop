import type { DadosFiscaisProduto } from '@shared/types/produto'

export const FISCAL_PRODUTO_PADRAO: DadosFiscaisProduto = {
  fiscalNcm: null,
  fiscalCest: null,
  fiscalCfop: '5102',
  fiscalIcmsOrigem: 0,
  fiscalIcmsCsosn: '102',
  fiscalPisCst: '07',
  fiscalCofinsCst: '07',
  fiscalAliquotaNacional: null,
}

export function normalizarCodigoFiscal(valor: string | null | undefined): string | null {
  if (!valor) {
    return null
  }

  const apenasDigitos = valor.replace(/\D/g, '')
  return apenasDigitos.length > 0 ? apenasDigitos : null
}

export function resolverDadosFiscaisProduto(
  dados?: Partial<DadosFiscaisProduto>,
): DadosFiscaisProduto {
  return {
    fiscalNcm: normalizarCodigoFiscal(dados?.fiscalNcm ?? FISCAL_PRODUTO_PADRAO.fiscalNcm),
    fiscalCest: normalizarCodigoFiscal(dados?.fiscalCest ?? FISCAL_PRODUTO_PADRAO.fiscalCest),
    fiscalCfop: normalizarCodigoFiscal(dados?.fiscalCfop ?? FISCAL_PRODUTO_PADRAO.fiscalCfop) ?? '5102',
    fiscalIcmsOrigem: dados?.fiscalIcmsOrigem ?? FISCAL_PRODUTO_PADRAO.fiscalIcmsOrigem,
    fiscalIcmsCsosn: dados?.fiscalIcmsCsosn?.trim() || FISCAL_PRODUTO_PADRAO.fiscalIcmsCsosn,
    fiscalPisCst: dados?.fiscalPisCst?.trim() || FISCAL_PRODUTO_PADRAO.fiscalPisCst,
    fiscalCofinsCst: dados?.fiscalCofinsCst?.trim() || FISCAL_PRODUTO_PADRAO.fiscalCofinsCst,
    fiscalAliquotaNacional:
      dados?.fiscalAliquotaNacional === undefined
        ? FISCAL_PRODUTO_PADRAO.fiscalAliquotaNacional
        : dados.fiscalAliquotaNacional,
  }
}
