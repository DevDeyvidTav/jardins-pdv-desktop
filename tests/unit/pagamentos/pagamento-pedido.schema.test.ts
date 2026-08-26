import { describe, expect, it } from 'vitest'
import { FORMA_PAGAMENTO } from '../../../src/shared/types/pagamento-pedido'
import { registrarPagamentoPedidoSchema } from '../../../src/main/modules/pagamentos/schemas/pagamento-pedido.schema'

describe('pagamento-pedido.schema', () => {
  it('aceita dinheiro sem valor recebido (pagamento exato)', () => {
    const resultado = registrarPagamentoPedidoSchema.parse({
      pedidoId: 'ped-1',
      formaPagamento: FORMA_PAGAMENTO.DINHEIRO,
      valorCentavos: 1200,
    })
    expect(resultado.valorRecebidoCentavos).toBeUndefined()
  })

  it('aceita dinheiro com valor recebido maior ou igual', () => {
    const resultado = registrarPagamentoPedidoSchema.parse({
      pedidoId: 'ped-1',
      formaPagamento: FORMA_PAGAMENTO.DINHEIRO,
      valorCentavos: 1200,
      valorRecebidoCentavos: 2000,
    })
    expect(resultado.valorRecebidoCentavos).toBe(2000)
  })

  it('rejeita valor recebido menor que o pagamento', () => {
    expect(() =>
      registrarPagamentoPedidoSchema.parse({
        pedidoId: 'ped-1',
        formaPagamento: FORMA_PAGAMENTO.DINHEIRO,
        valorCentavos: 1200,
        valorRecebidoCentavos: 1000,
      }),
    ).toThrow(/recebido/)
  })
})
