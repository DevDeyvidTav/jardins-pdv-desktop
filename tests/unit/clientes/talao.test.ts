import { afterEach, describe, expect, it } from 'vitest'
import { FORMA_PAGAMENTO } from '../../../src/shared/types/pagamento-pedido'
import { CODIGOS_ERRO_CLIENTES, ErroClientes } from '../../../src/main/modules/clientes/errors/erros-clientes'
import { criarClienteRepository } from '../../../src/main/modules/clientes/repositories/cliente.repository'
import { criarCriarCliente } from '../../../src/main/modules/clientes/use-cases/criar-cliente'
import { criarVincularClientePedido } from '../../../src/main/modules/clientes/use-cases/vincular-cliente-pedido'
import {
  criarObterContaTalao,
  criarRegistrarBaixaTalao,
} from '../../../src/main/modules/clientes/use-cases/conta-talao'
import { criarObterResumoCaixaAtual } from '../../../src/main/modules/caixa/use-cases/obter-resumo-caixa-atual'
import { criarFecharSessaoCaixa } from '../../../src/main/modules/caixa/use-cases/fechar-sessao-caixa'
import { prepararAmbientePedidos } from '../../helpers/pedido-teste'

describe('talão', () => {
  let encerrar: (() => void) | undefined
  afterEach(() => encerrar?.())

  async function prepararComCliente(liberaTalao = true) {
    const ambiente = await prepararAmbientePedidos()
    encerrar = ambiente.encerrar
    const repositorioCliente = criarClienteRepository()
    const criarCliente = criarCriarCliente(repositorioCliente)
    const vincular = criarVincularClientePedido(ambiente.repositorioPedido, repositorioCliente)
    const obterConta = criarObterContaTalao(repositorioCliente)
    const registrarBaixa = criarRegistrarBaixaTalao(
      repositorioCliente,
      undefined,
      ambiente.repositorioSessao,
    )
    const cliente = criarCliente({
      nome: 'Cliente Talao',
      liberaTalao,
    })
    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    ambiente.adicionarItemPedido({
      pedidoId: pedido.id,
      produtoId: ambiente.produto.id,
      quantidade: 2,
    })
    return {
      ambiente,
      cliente,
      pedido,
      vincular,
      obterConta,
      registrarBaixa,
    }
  }

  it('impede pagar no talão sem cliente vinculado', async () => {
    const { ambiente, pedido } = await prepararComCliente()
    expect(() =>
      ambiente.registrarPagamentoPedido({
        pedidoId: pedido.id,
        formaPagamento: FORMA_PAGAMENTO.TALAO,
        valorCentavos: 1200,
      }),
    ).toThrow(/cliente cadastrado/)
  })

  it('impede pagar no talão quando o cliente nao tem a flag', async () => {
    const { ambiente, cliente, pedido, vincular } = await prepararComCliente(false)
    vincular({ pedidoId: pedido.id, clienteId: cliente.id })
    expect(() =>
      ambiente.registrarPagamentoPedido({
        pedidoId: pedido.id,
        formaPagamento: FORMA_PAGAMENTO.TALAO,
        valorCentavos: 1200,
      }),
    ).toThrow(/nao tem talao/)
  })

  it('lanca talão na conta do mês e nao soma como venda recebida no caixa', async () => {
    const { ambiente, cliente, pedido, vincular, obterConta } = await prepararComCliente()
    vincular({ pedidoId: pedido.id, clienteId: cliente.id })
    ambiente.registrarPagamentoPedido({
      pedidoId: pedido.id,
      formaPagamento: FORMA_PAGAMENTO.TALAO,
      valorCentavos: 1200,
    })

    const conta = obterConta({ clienteId: cliente.id })
    expect(conta.totalLancadoCentavos).toBe(1200)
    expect(conta.totalBaixadoCentavos).toBe(0)
    expect(conta.saldoCentavos).toBe(1200)

    const caixa = criarObterResumoCaixaAtual()()!
    expect(caixa.totalVendasTalaoCentavos).toBe(1200)
    expect(caixa.totalVendasCentavos).toBe(0)
    expect(caixa.saldoAtualEsperadoCentavos).toBe(0)
  })

  it('registra baixa parcial no caixa e recusa valor acima do saldo', async () => {
    const { ambiente, cliente, pedido, vincular, obterConta, registrarBaixa } =
      await prepararComCliente()
    vincular({ pedidoId: pedido.id, clienteId: cliente.id })
    ambiente.registrarPagamentoPedido({
      pedidoId: pedido.id,
      formaPagamento: FORMA_PAGAMENTO.TALAO,
      valorCentavos: 1200,
    })

    registrarBaixa({
      clienteId: cliente.id,
      formaPagamento: FORMA_PAGAMENTO.DINHEIRO,
      valorCentavos: 500,
    })

    const conta = obterConta({ clienteId: cliente.id })
    expect(conta.totalBaixadoCentavos).toBe(500)
    expect(conta.saldoCentavos).toBe(700)

    try {
      registrarBaixa({
        clienteId: cliente.id,
        formaPagamento: FORMA_PAGAMENTO.DINHEIRO,
        valorCentavos: 800,
      })
      throw new Error('deveria ter falhado')
    } catch (erro) {
      expect(erro).toBeInstanceOf(ErroClientes)
      expect((erro as ErroClientes).codigo).toBe(CODIGOS_ERRO_CLIENTES.SALDO_INSUFICIENTE)
    }

    const caixa = criarObterResumoCaixaAtual()()!
    expect(caixa.totalRecebimentoTalaoCentavos).toBe(500)
    expect(caixa.totalVendasDinheiroCentavos).toBe(500)
    expect(caixa.saldoAtualEsperadoCentavos).toBe(500)
  })

  it('registra troco na baixa em dinheiro sem inflar o caixa', async () => {
    const { ambiente, cliente, pedido, vincular, obterConta, registrarBaixa } =
      await prepararComCliente()
    vincular({ pedidoId: pedido.id, clienteId: cliente.id })
    ambiente.registrarPagamentoPedido({
      pedidoId: pedido.id,
      formaPagamento: FORMA_PAGAMENTO.TALAO,
      valorCentavos: 1200,
    })

    const baixa = registrarBaixa({
      clienteId: cliente.id,
      formaPagamento: FORMA_PAGAMENTO.DINHEIRO,
      valorCentavos: 500,
      valorRecebidoCentavos: 1000,
    })

    expect(baixa.valorCentavos).toBe(500)
    expect(baixa.valorRecebidoCentavos).toBe(1000)
    expect(baixa.trocoCentavos).toBe(500)

    const conta = obterConta({ clienteId: cliente.id })
    expect(conta.totalBaixadoCentavos).toBe(500)
    expect(conta.saldoCentavos).toBe(700)

    const caixa = criarObterResumoCaixaAtual()()!
    expect(caixa.totalVendasDinheiroCentavos).toBe(500)
    expect(caixa.saldoAtualEsperadoCentavos).toBe(500)
  })

  it('impede baixa sem caixa aberto e recusa forma talão na baixa', async () => {
    const { ambiente, cliente, pedido, vincular, registrarBaixa } = await prepararComCliente()
    vincular({ pedidoId: pedido.id, clienteId: cliente.id })
    ambiente.registrarPagamentoPedido({
      pedidoId: pedido.id,
      formaPagamento: FORMA_PAGAMENTO.TALAO,
      valorCentavos: 1200,
    })

    expect(() =>
      registrarBaixa({
        clienteId: cliente.id,
        formaPagamento: FORMA_PAGAMENTO.TALAO,
        valorCentavos: 100,
      }),
    ).toThrow(/invalida para baixa/)

    criarFecharSessaoCaixa(ambiente.repositorioSessao)({
      saldoFinalInformadoCentavos: 0,
    })

    try {
      registrarBaixa({
        clienteId: cliente.id,
        formaPagamento: FORMA_PAGAMENTO.DINHEIRO,
        valorCentavos: 100,
      })
      throw new Error('deveria ter falhado')
    } catch (erro) {
      expect(erro).toBeInstanceOf(ErroClientes)
      expect((erro as ErroClientes).codigo).toBe(CODIGOS_ERRO_CLIENTES.CAIXA_NAO_ABERTO)
    }
  })

  it('separa vendas Pix maquineta e Pix CNPJ no caixa', async () => {
    const { ambiente, pedido } = await prepararComCliente()
    ambiente.registrarPagamentoPedido({
      pedidoId: pedido.id,
      formaPagamento: FORMA_PAGAMENTO.PIX_MAQUINETA,
      valorCentavos: 400,
    })
    ambiente.registrarPagamentoPedido({
      pedidoId: pedido.id,
      formaPagamento: FORMA_PAGAMENTO.PIX_CNPJ,
      valorCentavos: 800,
    })

    const caixa = criarObterResumoCaixaAtual()()!
    expect(caixa.totalVendasPixMaquinetaCentavos).toBe(400)
    expect(caixa.totalVendasPixCnpjCentavos).toBe(800)
    expect(caixa.totalVendasPixCentavos).toBe(1200)
    expect(caixa.saldoAtualEsperadoCentavos).toBe(0)
  })
})
