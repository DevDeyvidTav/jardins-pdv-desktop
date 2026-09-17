import { describe, expect, it } from 'vitest'
import { avaliarEmissaoNfce } from '../../../src/main/modules/pedidos/services/avaliar-emissao-nfce'
import type { PedidoItem } from '../../../src/shared/types/pedido'

const pedido = {
  totalCentavos: 5000,
  valorCortesiaCentavos: 0,
  valorPagoCentavos: 0,
}

const itemComNcm: PedidoItem = {
  id: 'item-1',
  pedidoId: 'ped-1',
  produtoId: 'prod-1',
  tipo: 'PRODUTO',
  produtoNome: 'Coca-Cola',
  quantidade: 1,
  precoUnitarioCentavos: 5000,
  subtotalCentavos: 5000,
  descontoCentavos: 0,
  totalCentavos: 5000,
  observacao: null,
  criadoEm: '2026-09-06T00:00:00.000Z',
  atualizadoEm: '2026-09-06T00:00:00.000Z',
  canceladoEm: null,
  motivoCancelamento: null,
  fiscalNcm: '22021000',
  fiscalCfop: '5102',
  fiscalIcmsOrigem: 0,
  fiscalIcmsCsosn: '102',
  fiscalPisCst: '07',
  fiscalCofinsCst: '07',
}

describe('avaliarEmissaoNfce', () => {
  it('aceita solicitacao com NCM e CPF valido', () => {
    const resultado = avaliarEmissaoNfce({
      pedido,
      itens: [itemComNcm],
      fiscalSolicitado: true,
      fiscalCpfDestinatario: '52998224725',
    })

    expect(resultado).toEqual({ ok: true, cpf: '52998224725' })
  })

  it('bloqueia produto sem NCM', () => {
    const resultado = avaliarEmissaoNfce({
      pedido,
      itens: [{ ...itemComNcm, fiscalNcm: null }],
      fiscalSolicitado: true,
    })

    expect(resultado.ok).toBe(false)
    if (!resultado.ok) {
      expect(resultado.motivo).toContain('NCM')
    }
  })

  it('bloqueia fechamento so com cortesia', () => {
    const resultado = avaliarEmissaoNfce({
      pedido: { ...pedido, valorCortesiaCentavos: 5000 },
      itens: [itemComNcm],
      fiscalSolicitado: true,
      valorPagoAposPagamento: 0,
      valorCortesiaAposPagamento: 5000,
      exigirValorPago: true,
    })

    expect(resultado.ok).toBe(false)
  })

  it('permite pizza sem produtoId', () => {
    const resultado = avaliarEmissaoNfce({
      pedido,
      itens: [{ ...itemComNcm, produtoId: null, fiscalNcm: '19059090' }],
      fiscalSolicitado: true,
    })

    expect(resultado.ok).toBe(true)
  })
})
