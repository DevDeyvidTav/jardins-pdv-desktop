import { afterEach, describe, expect, it } from 'vitest'
import { prepararAmbientePedidos } from '../../helpers/pedido-teste'
import { executarEmTransacaoImediata } from '../../../src/main/database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../src/main/database/inicializar-banco'
import { FORMA_PAGAMENTO } from '../../../src/shared/types/pagamento-pedido'
import { CODIGOS_ERRO_PEDIDOS, ErroPedidos } from '../../../src/main/modules/pedidos/errors/erros-pedidos'
import {
  CODIGOS_ERRO_DIVISAO_CONTA,
  ErroDivisaoConta,
} from '../../../src/main/modules/divisao-conta/errors/erros-divisao-conta'
import { criarRegistrarPagamentoPedido } from '../../../src/main/modules/pagamentos/use-cases/registrar-pagamento-pedido'
import { criarAdicionarItemPedido } from '../../../src/main/modules/pedidos/use-cases/adicionar-item-pedido'
import { criarPagamentoPedidoRepository } from '../../../src/main/modules/pagamentos/repositories/pagamento-pedido.repository'
import { criarCriarDivisaoConta } from '../../../src/main/modules/divisao-conta/use-cases/criar-divisao-conta'
import { criarRegistrarPagamentoParteDivisao } from '../../../src/main/modules/divisao-conta/use-cases/registrar-pagamento-parte-divisao'
import { criarCancelarDivisaoConta } from '../../../src/main/modules/divisao-conta/use-cases/consultar-cancelar-divisao'
import {
  criarPedidoDivisaoContaRepository,
  criarPedidoDivisaoParteRepository,
  criarPedidoDivisaoMovimentacaoRepository,
} from '../../../src/main/modules/divisao-conta/repositories/divisao-conta.repository'
import { criarAdicionarPizzaAoPedido } from '../../../src/main/modules/pizzas/use-cases/adicionar-pizza-ao-pedido'
import { CODIGOS_ERRO_PIZZAS, ErroPizzas } from '../../../src/main/modules/pizzas/errors/erros-pizzas'
import { criarPizzaPedidoItemRepository } from '../../../src/main/modules/pizzas/repositories/pizza-pedido-item.repository'

describe('transacoes financeiras', () => {
  let encerrar: (() => void) | undefined

  afterEach(() => {
    encerrar?.()
    encerrar = undefined
  })

  it('faz rollback completo ao falhar pagamento comum', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrar = ambiente.encerrar
    const repositorioPagamento = criarPagamentoPedidoRepository()

    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    ambiente.adicionarItemPedido({
      pedidoId: pedido.id,
      produtoId: ambiente.produto.id,
      quantidade: 1,
    })

    const registrar = criarRegistrarPagamentoPedido(
      ambiente.repositorioPedido,
      ambiente.repositorioItem,
      ambiente.repositorioSessao,
      ambiente.repositorioMesa,
      repositorioPagamento,
    )

    expect(() =>
      registrar({
        pedidoId: pedido.id,
        formaPagamento: FORMA_PAGAMENTO.DINHEIRO,
        valorCentavos: 999_999,
      }),
    ).toThrow(ErroPedidos)

    expect(repositorioPagamento.listarPorPedido(pedido.id)).toHaveLength(0)

    const pedidoAtual = ambiente.repositorioPedido.buscarPorId(pedido.id)!
    expect(pedidoAtual.valorPagoCentavos).toBe(0)
    expect(pedidoAtual.status).toBe('ABERTO')
  })

  it('faz rollback ao falhar inclusao de item no meio da transacao', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrar = ambiente.encerrar
    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })

    const adicionar = criarAdicionarItemPedido(
      ambiente.repositorioPedido,
      ambiente.repositorioItem,
      {
        buscarPorId: () => {
          throw new ErroPedidos(
            CODIGOS_ERRO_PEDIDOS.PRODUTO_NAO_ENCONTRADO,
            'falha simulada',
          )
        },
      } as never,
    )

    expect(() =>
      adicionar({
        pedidoId: pedido.id,
        produtoId: 'inexistente',
        quantidade: 1,
      }),
    ).toThrow(ErroPedidos)

    const itens = ambiente.repositorioItem.listarPorPedido(pedido.id, true)
    expect(itens).toHaveLength(0)
  })

  it('faz rollback ao falhar inclusao de pizza', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrar = ambiente.encerrar
    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    const itensAntes = ambiente.repositorioItem.listarPorPedido(pedido.id, true).length
    const pizzasRepo = criarPizzaPedidoItemRepository()

    const adicionar = criarAdicionarPizzaAoPedido(
      ambiente.repositorioPedido,
      ambiente.repositorioItem,
      pizzasRepo,
      {
        buscarPorId: () => {
          throw new ErroPizzas(
            CODIGOS_ERRO_PIZZAS.PIZZA_CATEGORIA_NAO_ENCONTRADA,
            'falha simulada',
          )
        },
      } as never,
    )

    expect(() =>
      adicionar({
        pedidoId: pedido.id,
        categoriaId: 'cat-inexistente',
        tamanhoId: 'tam-inexistente',
        saborIds: ['sabor-inexistente'],
      }),
    ).toThrow(ErroPizzas)

    expect(ambiente.repositorioItem.listarPorPedido(pedido.id, true)).toHaveLength(itensAntes)
    const pedidoAtual = ambiente.repositorioPedido.buscarPorId(pedido.id)!
    expect(pedidoAtual.totalCentavos).toBe(0)
  })

  it('impede pagamento vinculado a parte inexistente via FK', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrar = ambiente.encerrar
    const repositorioPagamento = criarPagamentoPedidoRepository()
    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    ambiente.adicionarItemPedido({
      pedidoId: pedido.id,
      produtoId: ambiente.produto.id,
      quantidade: 1,
    })

    const conexao = obterConexaoBancoLocal()
    expect(() => {
      executarEmTransacaoImediata(conexao, () => {
        repositorioPagamento.inserir(
          pedido.id,
          ambiente.sessao.id,
          { formaPagamento: FORMA_PAGAMENTO.DINHEIRO, valorCentavos: 100 },
          false,
          'parte-inexistente',
        )
      })
    }).toThrow()

    expect(repositorioPagamento.listarPorPedido(pedido.id)).toHaveLength(0)
  })

  it('impede pagamento de parte de outro pedido e nao cria pagamento parcial', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrar = ambiente.encerrar
    const [mesa2] = ambiente.criarMesasPorIntervalo({ numeroInicial: 2, numeroFinal: 2 })

    const pedidoA = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    ambiente.adicionarItemPedido({
      pedidoId: pedidoA.id,
      produtoId: ambiente.produto.id,
      quantidade: 2,
    })
    const pedidoB = ambiente.criarPedidoMesa({ mesaId: mesa2.id })
    ambiente.adicionarItemPedido({
      pedidoId: pedidoB.id,
      produtoId: ambiente.produto.id,
      quantidade: 2,
    })

    const repositorioDivisao = criarPedidoDivisaoContaRepository()
    const repositorioParte = criarPedidoDivisaoParteRepository()
    const repositorioMov = criarPedidoDivisaoMovimentacaoRepository()
    const repositorioPagamento = criarPagamentoPedidoRepository()

    const criarDivisao = criarCriarDivisaoConta(
      ambiente.repositorioPedido,
      ambiente.repositorioSessao,
      repositorioPagamento,
      repositorioDivisao,
      repositorioParte,
      repositorioMov,
    )

    const divisaoA = criarDivisao({
      pedidoId: pedidoA.id,
      partes: [
        { identificacao: 'A1', valorDefinidoCentavos: 600 },
        { identificacao: 'A2', valorDefinidoCentavos: 600 },
      ],
    })
    const divisaoB = criarDivisao({
      pedidoId: pedidoB.id,
      partes: [
        { identificacao: 'B1', valorDefinidoCentavos: 600 },
        { identificacao: 'B2', valorDefinidoCentavos: 600 },
      ],
    })

    const registrarParte = criarRegistrarPagamentoParteDivisao(
      ambiente.repositorioPedido,
      ambiente.repositorioItem,
      ambiente.repositorioSessao,
      ambiente.repositorioMesa,
      repositorioPagamento,
      repositorioDivisao,
      repositorioParte,
      repositorioMov,
    )

    expect(() =>
      registrarParte({
        pedidoId: pedidoA.id,
        parteId: divisaoB.partes[0]!.id,
        formaPagamento: FORMA_PAGAMENTO.DINHEIRO,
        valorCentavos: 100,
      }),
    ).toThrow(ErroDivisaoConta)

    expect(repositorioPagamento.listarPorPedido(pedidoA.id)).toHaveLength(0)
    expect(ambiente.repositorioPedido.buscarPorId(pedidoA.id)!.valorPagoCentavos).toBe(0)
    expect(divisaoA.partes[0]!.id).toBeTruthy()
  })

  it('rollback de pagamento de parte ao exceder restante preserva totais', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrar = ambiente.encerrar
    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    ambiente.adicionarItemPedido({
      pedidoId: pedido.id,
      produtoId: ambiente.produto.id,
      quantidade: 2,
    })

    const repositorioDivisao = criarPedidoDivisaoContaRepository()
    const repositorioParte = criarPedidoDivisaoParteRepository()
    const repositorioMov = criarPedidoDivisaoMovimentacaoRepository()
    const repositorioPagamento = criarPagamentoPedidoRepository()

    const criarDivisao = criarCriarDivisaoConta(
      ambiente.repositorioPedido,
      ambiente.repositorioSessao,
      repositorioPagamento,
      repositorioDivisao,
      repositorioParte,
      repositorioMov,
    )
    const resumo = criarDivisao({
      pedidoId: pedido.id,
      partes: [
        { identificacao: 'P1', valorDefinidoCentavos: 600 },
        { identificacao: 'P2', valorDefinidoCentavos: 600 },
      ],
    })

    const registrarParte = criarRegistrarPagamentoParteDivisao(
      ambiente.repositorioPedido,
      ambiente.repositorioItem,
      ambiente.repositorioSessao,
      ambiente.repositorioMesa,
      repositorioPagamento,
      repositorioDivisao,
      repositorioParte,
      repositorioMov,
    )

    try {
      registrarParte({
        pedidoId: pedido.id,
        parteId: resumo.partes[0]!.id,
        formaPagamento: FORMA_PAGAMENTO.DINHEIRO,
        valorCentavos: 999,
      })
      expect.fail('deveria falhar')
    } catch (erro) {
      expect(erro).toBeInstanceOf(ErroDivisaoConta)
      expect((erro as ErroDivisaoConta).codigo).toBe(
        CODIGOS_ERRO_DIVISAO_CONTA.PAGAMENTO_EXCEDE_VALOR_RESTANTE_DA_PARTE,
      )
    }

    expect(repositorioPagamento.listarPorPedido(pedido.id)).toHaveLength(0)
    const pedidoAtual = ambiente.repositorioPedido.buscarPorId(pedido.id)!
    expect(pedidoAtual.valorPagoCentavos).toBe(0)
    expect(pedidoAtual.totalCentavos).toBe(1200)
  })

  it('permite pagamento comum com parte nula e cancela divisao sem pagamentos juntos', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrar = ambiente.encerrar
    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    ambiente.adicionarItemPedido({
      pedidoId: pedido.id,
      produtoId: ambiente.produto.id,
      quantidade: 2,
    })

    const repositorioDivisao = criarPedidoDivisaoContaRepository()
    const repositorioParte = criarPedidoDivisaoParteRepository()
    const repositorioMov = criarPedidoDivisaoMovimentacaoRepository()
    const repositorioPagamento = criarPagamentoPedidoRepository()

    const criarDivisao = criarCriarDivisaoConta(
      ambiente.repositorioPedido,
      ambiente.repositorioSessao,
      repositorioPagamento,
      repositorioDivisao,
      repositorioParte,
      repositorioMov,
    )
    criarDivisao({
      pedidoId: pedido.id,
      partes: [
        { identificacao: 'P1', valorDefinidoCentavos: 600 },
        { identificacao: 'P2', valorDefinidoCentavos: 600 },
      ],
    })

    const cancelar = criarCancelarDivisaoConta(
      ambiente.repositorioPedido,
      repositorioDivisao,
      repositorioParte,
      repositorioPagamento,
      repositorioMov,
    )
    cancelar({ pedidoId: pedido.id, motivo: 'teste' })

    const pagamento = ambiente.registrarPagamentoPedido({
      pedidoId: pedido.id,
      formaPagamento: FORMA_PAGAMENTO.DINHEIRO,
      valorCentavos: 1200,
    })
    expect(pagamento.pagamentos[0]?.pedidoDivisaoParteId ?? null).toBeNull()
    expect(repositorioPagamento.listarPorPedido(pedido.id)).toHaveLength(1)
  })
})
