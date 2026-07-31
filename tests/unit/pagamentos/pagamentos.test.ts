import { afterEach, describe, expect, it } from 'vitest'
import { FORMA_PAGAMENTO } from '../../../src/shared/types/pagamento-pedido'
import { criarObterResumoCaixaAtual } from '../../../src/main/modules/caixa/use-cases/obter-resumo-caixa-atual'
import { criarObterResumoPagamentoPedido } from '../../../src/main/modules/pagamentos/use-cases/consultas-pagamento-pedido'
import { prepararAmbientePedidos } from '../../helpers/pedido-teste'

describe('pagamentos de pedido', () => {
  let encerrar: (() => void) | undefined
  afterEach(() => encerrar?.())

  async function criarPedidoComItem() {
    const ambiente = await prepararAmbientePedidos()
    encerrar = ambiente.encerrar
    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    ambiente.adicionarItemPedido({
      pedidoId: pedido.id,
      produtoId: ambiente.produto.id,
      quantidade: 2,
    })
    return { ambiente, pedido }
  }

  it.each([
    FORMA_PAGAMENTO.DINHEIRO,
    FORMA_PAGAMENTO.CARTAO_CREDITO,
    FORMA_PAGAMENTO.CARTAO_DEBITO,
    FORMA_PAGAMENTO.PIX,
  ])('registra pagamento %s e finaliza pedido', async (formaPagamento) => {
    const { ambiente, pedido } = await criarPedidoComItem()
    const resumo = ambiente.registrarPagamentoPedido({
      pedidoId: pedido.id,
      formaPagamento,
      valorCentavos: 1200,
    })

    expect(resumo.valorRestanteCentavos).toBe(0)
    expect(ambiente.repositorioPagamento.listarPorPedido(pedido.id)).toHaveLength(1)
    expect(ambiente.repositorioPagamento.listarPorPedido(pedido.id)[0]?.formaPagamento).toBe(formaPagamento)
    expect(ambiente.repositorioMesa.buscarPorId(ambiente.mesa.id)?.status).toBe('LIVRE')
  })

  it('aceita pagamento multiplo e atualiza vendas do caixa', async () => {
    const { ambiente, pedido } = await criarPedidoComItem()
    ambiente.registrarPagamentoPedido({
      pedidoId: pedido.id,
      formaPagamento: FORMA_PAGAMENTO.DINHEIRO,
      valorCentavos: 400,
    })
    ambiente.registrarPagamentoPedido({
      pedidoId: pedido.id,
      formaPagamento: FORMA_PAGAMENTO.PIX,
      valorCentavos: 800,
    })
    const caixa = criarObterResumoCaixaAtual()()!
    expect(caixa.totalVendasDinheiroCentavos).toBe(400)
    expect(caixa.totalVendasPixCentavos).toBe(800)
    expect(caixa.saldoAtualEsperadoCentavos).toBe(400)
  })

  it('impede total menor ou maior que o pedido', async () => {
    const { ambiente, pedido } = await criarPedidoComItem()
    expect(() => ambiente.registrarPagamentoPedido({
      pedidoId: pedido.id,
      formaPagamento: FORMA_PAGAMENTO.PIX,
      valorCentavos: 1300,
    })).toThrow(/maior/)
  })

  it('persiste pagamentos e bloqueia novo pagamento apos finalizar', async () => {
    const { ambiente, pedido } = await criarPedidoComItem()
    ambiente.registrarPagamentoPedido({
      pedidoId: pedido.id,
      formaPagamento: FORMA_PAGAMENTO.DINHEIRO,
      valorCentavos: 1200,
    })
    const resumo = criarObterResumoPagamentoPedido(
      undefined,
      ambiente.repositorioPagamento,
    )({ pedidoId: pedido.id })
    expect(resumo.totalPagoCentavos).toBe(1200)
    expect(ambiente.repositorioPagamento.listarPorPedido(pedido.id)[0]?.canceladoEm).toBeNull()
    expect(() => ambiente.registrarPagamentoPedido({
      pedidoId: pedido.id,
      formaPagamento: FORMA_PAGAMENTO.DINHEIRO,
      valorCentavos: 1200,
    })).toThrow()
    expect(ambiente.repositorioMesa.buscarPorId(ambiente.mesa.id)?.status).toBe('LIVRE')
    expect(ambiente.repositorioPagamento.listarPorPedido(pedido.id)).toHaveLength(1)
  })
})
