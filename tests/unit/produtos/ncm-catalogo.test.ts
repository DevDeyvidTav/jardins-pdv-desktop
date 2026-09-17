import { describe, expect, it } from 'vitest'
import { resolverFiscalChinaExpress, TOTAL_ITENS_CHINA_EXPRESS } from '../../../src/shared/data/china-express-catalogo-fiscal'
import { resolverNcmProduto } from '../../../src/shared/data/ncm-catalogo-restaurante'
import { preencherFiscalProduto } from '../../../src/shared/utils/preencher-fiscal-produto'

describe('ncm-catalogo-restaurante', () => {
  it('carrega catalogo China Express do PDF', () => {
    expect(TOTAL_ITENS_CHINA_EXPRESS).toBeGreaterThan(500)
  })

  it('resolve dados fiscais exatos do China Express', () => {
    const sugestao = resolverFiscalChinaExpress('COCA COLA LATA')
    expect(sugestao?.ncm).toBe('21069090')
    expect(sugestao?.fiscalCfop).toBe('5102')
    expect(sugestao?.fiscalIcmsCsosn).toBe('102')
    expect(sugestao?.cest).toBe('1701000')
  })

  it('prioriza China Express sobre heuristica generica', () => {
    const sugestao = resolverNcmProduto('AGUA MINERAL 500', 'Refrigerantes')
    expect(sugestao?.ncm).toBe('22011000')
    expect(sugestao?.fiscalCfop).toBe('5405')
    expect(sugestao?.fiscalPisCst).toBe('01')
    expect(sugestao?.cest).toBe('0300200')
  })

  it('resolve NCM exato do seed de apresentacao', () => {
    expect(resolverNcmProduto('Coca-Cola Lata 350ml', 'Bebidas')?.ncm).toBe('22021000')
    expect(resolverNcmProduto('Filé Mignon com Fritas', 'Pratos')?.ncm).toBe('21069090')
  })

  it('aplica CEST e CSOSN 500 para refrigerante em lata', () => {
    const sugestao = resolverNcmProduto('Guaraná Antarctica Lata', 'Bebidas')
    expect(sugestao?.cest).toBe('0301002')
    expect(sugestao?.fiscalIcmsCsosn).toBe('500')
  })

  it('nao sobrescreve produto que ja tem NCM sem --force', () => {
    const resultado = preencherFiscalProduto({
      id: '1',
      nome: 'Coca-Cola Lata 350ml',
      categoriaNome: 'Bebidas',
      fiscalNcm: '99999999',
      fiscalCest: null,
      fiscalCfop: '5102',
      fiscalIcmsOrigem: 0,
      fiscalIcmsCsosn: '102',
      fiscalPisCst: '07',
      fiscalCofinsCst: '07',
      fiscalAliquotaNacional: null,
    })

    expect(resultado.motivo).toBe('ja_preenchido')
    expect(resultado.atualizado).toBe(false)
  })
})
