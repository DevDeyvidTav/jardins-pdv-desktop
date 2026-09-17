import { describe, expect, it } from 'vitest'
import {
  FISCAL_PRODUTO_PADRAO,
  normalizarCodigoFiscal,
  resolverDadosFiscaisProduto,
} from '../../../src/shared/utils/fiscal-produto'

describe('fiscal-produto', () => {
  it('aplica defaults do Simples Nacional quando campos fiscais nao sao informados', () => {
    expect(resolverDadosFiscaisProduto()).toEqual(FISCAL_PRODUTO_PADRAO)
  })

  it('normaliza codigos fiscais removendo caracteres nao numericos', () => {
    expect(normalizarCodigoFiscal('2202.10.00')).toBe('22021000')
    expect(normalizarCodigoFiscal('')).toBeNull()
  })

  it('preserva NCM e CEST informados', () => {
    expect(
      resolverDadosFiscaisProduto({
        fiscalNcm: '22021000',
        fiscalCest: '0300700',
        fiscalIcmsCsosn: '500',
      }),
    ).toEqual({
      ...FISCAL_PRODUTO_PADRAO,
      fiscalNcm: '22021000',
      fiscalCest: '0300700',
      fiscalIcmsCsosn: '500',
    })
  })
})
