import { describe, expect, it } from 'vitest'
import {
  adicionarItemPedidoSchema,
  aplicarDescontoPedidoSchema,
  criarPedidoMesaSchema,
} from '../../../src/main/modules/pedidos/schemas/pedido.schema'
import { criarMesasPorIntervaloSchema } from '../../../src/main/modules/mesas/schemas/mesa.schema'

describe('mesa.schema', () => {
  it('valida criacao de mesas por intervalo', () => {
    expect(
      criarMesasPorIntervaloSchema.parse({ numeroInicial: 1, numeroFinal: 30 }),
    ).toEqual({
      numeroInicial: 1,
      numeroFinal: 30,
    })
  })

  it('impede intervalo com final menor que inicial', () => {
    expect(() =>
      criarMesasPorIntervaloSchema.parse({ numeroInicial: 10, numeroFinal: 5 }),
    ).toThrow()
  })
})

describe('pedido.schema', () => {
  it('valida criacao de pedido de mesa', () => {
    expect(criarPedidoMesaSchema.parse({ mesaId: 'mesa-1' }).mesaId).toBe('mesa-1')
  })

  it('impede item com quantidade zero', () => {
    expect(() =>
      adicionarItemPedidoSchema.parse({
        pedidoId: 'p1',
        produtoId: 'prod-1',
        quantidade: 0,
      }),
    ).toThrow()
  })

  it('impede item com quantidade negativa', () => {
    expect(() =>
      adicionarItemPedidoSchema.parse({
        pedidoId: 'p1',
        produtoId: 'prod-1',
        quantidade: -1,
      }),
    ).toThrow()
  })

  it('exige motivo quando o desconto e maior que zero', () => {
    expect(() =>
      aplicarDescontoPedidoSchema.parse({
        pedidoId: 'p1',
        descontoCentavos: 100,
      }),
    ).toThrow(/Motivo do desconto/)

    expect(
      aplicarDescontoPedidoSchema.parse({
        pedidoId: 'p1',
        descontoCentavos: 100,
        motivoDesconto: 'Promocao',
      }).motivoDesconto,
    ).toBe('Promocao')
  })
})
