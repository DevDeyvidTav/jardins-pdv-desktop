import { afterEach, describe, expect, it } from 'vitest'
import { FORMA_PAGAMENTO } from '../../../src/shared/types/pagamento-pedido'
import { criarAplicarDescontoPedido } from '../../../src/main/modules/pedidos/use-cases/aplicar-desconto-pedido'
import { criarObterResumoCaixaAtual } from '../../../src/main/modules/caixa/use-cases/obter-resumo-caixa-atual'
import { prepararAmbientePedidos } from '../../helpers/pedido-teste'

describe('aplicarDescontoPedido e pagamentos com cortesia', () => {
  let encerrar: (() => void) | undefined
  afterEach(() => encerrar?.())

  async function criarAmbienteComItem() {
    const ambiente = await prepararAmbientePedidos()
    encerrar = ambiente.encerrar
    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    // Adiciona item com precoUnitario=600, quantidade=2, subtotal=1200
    ambiente.adicionarItemPedido({
      pedidoId: pedido.id,
      produtoId: ambiente.produto.id,
      quantidade: 2,
    })
    return { ambiente, pedido }
  }

  it('aplica desconto do item ao adicionar item no pedido', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrar = ambiente.encerrar
    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    const resumo = ambiente.adicionarItemPedido({
      pedidoId: pedido.id,
      produtoId: ambiente.produto.id,
      quantidade: 2,
      descontoCentavos: 200, // 200 de desconto no item
    })

    expect(resumo.pedido.subtotalCentavos).toBe(1200)
    expect(resumo.pedido.descontoItensCentavos).toBe(200)
    expect(resumo.pedido.totalCentavos).toBe(1000)
    expect(resumo.pedido.valorRestanteCentavos).toBe(1000)
  })

  it('impede desconto do item maior que subtotal do item', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrar = ambiente.encerrar
    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    expect(() =>
      ambiente.adicionarItemPedido({
        pedidoId: pedido.id,
        produtoId: ambiente.produto.id,
        quantidade: 1, // subtotal = 600
        descontoCentavos: 700,
      }),
    ).toThrow(/Desconto do item nao pode ser maior que o subtotal/)
  })

  it('aplica desconto geral valido no pedido', async () => {
    const { ambiente, pedido } = await criarAmbienteComItem()
    const aplicarDesconto = criarAplicarDescontoPedido(
      ambiente.repositorioPedido,
      ambiente.repositorioItem,
      ambiente.repositorioSessao,
      ambiente.repositorioMesa,
    )

    const resumo = aplicarDesconto({
      pedidoId: pedido.id,
      descontoCentavos: 300,
      motivoDesconto: 'Promocao',
    })

    expect(resumo.pedido.subtotalCentavos).toBe(1200)
    expect(resumo.pedido.descontoPedidoCentavos).toBe(300)
    expect(resumo.pedido.totalCentavos).toBe(900)
    expect(resumo.pedido.valorRestanteCentavos).toBe(900)
    expect(resumo.pedido.status).toBe('ABERTO')
  })

  it('finaliza o pedido e libera a mesa se desconto cobrir todo o valor restante', async () => {
    const { ambiente, pedido } = await criarAmbienteComItem()
    const aplicarDesconto = criarAplicarDescontoPedido(
      ambiente.repositorioPedido,
      ambiente.repositorioItem,
      ambiente.repositorioSessao,
      ambiente.repositorioMesa,
    )

    const resumo = aplicarDesconto({
      pedidoId: pedido.id,
      descontoCentavos: 1200,
    })

    expect(resumo.pedido.totalCentavos).toBe(0)
    expect(resumo.pedido.valorRestanteCentavos).toBe(0)
    expect(resumo.pedido.status).toBe('FINALIZADO')
    expect(ambiente.repositorioMesa.buscarPorId(ambiente.mesa.id)?.status).toBe('LIVRE')
  })

  it('impede desconto geral maior que o total do pedido', async () => {
    const { ambiente, pedido } = await criarAmbienteComItem()
    const aplicarDesconto = criarAplicarDescontoPedido(
      ambiente.repositorioPedido,
      ambiente.repositorioItem,
      ambiente.repositorioSessao,
      ambiente.repositorioMesa,
    )

    expect(() =>
      aplicarDesconto({
        pedidoId: pedido.id,
        descontoCentavos: 1500,
      }),
    ).toThrow(/Desconto do pedido nao pode ser maior/)
  })

  it('registra pagamento em cortesia com motivo obrigatorio e nao altera saldo de gaveta', async () => {
    const { ambiente, pedido } = await criarAmbienteComItem()
    
    // Cortesia sem motivo deve falhar
    expect(() =>
      ambiente.registrarPagamentoPedido({
        pedidoId: pedido.id,
        formaPagamento: FORMA_PAGAMENTO.CORTESIA,
        valorCentavos: 400,
      }),
    ).toThrow(/Motivo da cortesia/)

    // Cortesia com motivo valido
    const resumo = ambiente.registrarPagamentoPedido({
      pedidoId: pedido.id,
      formaPagamento: FORMA_PAGAMENTO.CORTESIA,
      valorCentavos: 400,
      motivoCortesia: 'Cortesia da casa',
    })

    expect(resumo.totalPagoCentavos).toBe(0) // valorPago (financeiro) e 0
    expect(resumo.valorRestanteCentavos).toBe(800)

    const resumoCaixa = criarObterResumoCaixaAtual()()!
    expect(resumoCaixa.saldoAtualEsperadoCentavos).toBe(0) // Saldo inicial e 0 e cortesia nao altera saldo de gaveta
  })

  it('pagamento em dinheiro altera o saldo esperado de gaveta do caixa', async () => {
    const { ambiente, pedido } = await criarAmbienteComItem()
    ambiente.registrarPagamentoPedido({
      pedidoId: pedido.id,
      formaPagamento: FORMA_PAGAMENTO.DINHEIRO,
      valorCentavos: 500,
    })

    const resumoCaixa = criarObterResumoCaixaAtual()()!
    expect(resumoCaixa.totalVendasDinheiroCentavos).toBe(500)
    expect(resumoCaixa.saldoAtualEsperadoCentavos).toBe(500) // 0 inicial + 500 vendas em dinheiro
  })
})
