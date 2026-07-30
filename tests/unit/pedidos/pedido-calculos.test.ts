import { describe, expect, it } from 'vitest'
import {
  calcularTotalItemCentavos,
  calcularTotaisPedido,
} from '../../../src/main/modules/pedidos/types/pedido-calculos.types'

describe('pedido-calculos', () => {
  it('calcula total do item', () => {
    expect(calcularTotalItemCentavos(2, 600)).toBe(1200)
  })

  it('calcula total do pedido com desconto zero', () => {
    expect(calcularTotaisPedido(2500, 0)).toEqual({
      subtotalCentavos: 2500,
      totalCentavos: 2500,
    })
  })
})
