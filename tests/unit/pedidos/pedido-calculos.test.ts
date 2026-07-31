import { describe, expect, it } from 'vitest'
import { calcularTotaisItemCentavos, calcularTotaisPedido } from '../../../src/main/modules/pedidos/types/pedido-calculos.types'

describe('pedido-calculos', () => {
  it('calcula total do item', () => {
    expect(calcularTotaisItemCentavos(2, 600, 0)).toEqual({
      subtotalCentavos: 1200,
      totalCentavos: 1200,
    })
  })

  it('calcula total do pedido com desconto zero', () => {
    expect(
      calcularTotaisPedido(2500, 0, 0, 0, 0),
    ).toEqual({
      subtotalCentavos: 2500,
      descontoItensCentavos: 0,
      descontoPedidoCentavos: 0,
      totalCentavos: 2500,
      valorRestanteCentavos: 2500,
    })
  })
})
