import { afterEach, describe, expect, it } from 'vitest'
import {
  STATUS_DIVISAO_CONTA,
  STATUS_PARTE_DIVISAO,
  TIPO_MOVIMENTACAO_DIVISAO,
} from '../../../src/shared/types/divisao-conta'
import { FORMA_PAGAMENTO } from '../../../src/shared/types/pagamento-pedido'
import { STATUS_PEDIDO } from '../../../src/shared/types/pedido'
import { CODIGOS_ERRO_DIVISAO_CONTA, ErroDivisaoConta } from '../../../src/main/modules/divisao-conta/errors/erros-divisao-conta'
import { CODIGOS_ERRO_PEDIDOS, ErroPedidos } from '../../../src/main/modules/pedidos/errors/erros-pedidos'
import { criarCriarDivisaoConta } from '../../../src/main/modules/divisao-conta/use-cases/criar-divisao-conta'
import {
  criarCancelarDivisaoConta,
  criarListarHistoricoDivisaoConta,
  criarObterResumoDivisaoConta,
} from '../../../src/main/modules/divisao-conta/use-cases/consultar-cancelar-divisao'
import { criarRegistrarPagamentoParteDivisao } from '../../../src/main/modules/divisao-conta/use-cases/registrar-pagamento-parte-divisao'
import {
  criarPedidoDivisaoContaRepository,
  criarPedidoDivisaoMovimentacaoRepository,
  criarPedidoDivisaoParteRepository,
} from '../../../src/main/modules/divisao-conta/repositories/divisao-conta.repository'
import { criarObterResumoCaixaAtual } from '../../../src/main/modules/caixa/use-cases/obter-resumo-caixa-atual'
import { criarAplicarDescontoPedido } from '../../../src/main/modules/pedidos/use-cases/aplicar-desconto-pedido'
import { criarCriarPedidoDelivery } from '../../../src/main/modules/delivery/use-cases/criar-pedido-delivery'
import { criarAtualizarTaxaEntrega } from '../../../src/main/modules/delivery/use-cases/atualizar-taxa-entrega'
import { criarPedidoEntregaRepository } from '../../../src/main/modules/delivery/repositories/pedido-entrega.repository'
import { prepararAmbientePedidos } from '../../helpers/pedido-teste'

function esperarErroDivisao(fn: () => unknown, codigo: string) {
  try {
    fn()
    throw new Error(`Esperava ErroDivisaoConta ${codigo}`)
  } catch (erro) {
    expect(erro).toBeInstanceOf(ErroDivisaoConta)
    expect((erro as ErroDivisaoConta).codigo).toBe(codigo)
  }
}

function esperarErroPedidos(fn: () => unknown, codigo: string) {
  try {
    fn()
    throw new Error(`Esperava ErroPedidos ${codigo}`)
  } catch (erro) {
    expect(erro).toBeInstanceOf(ErroPedidos)
    expect((erro as ErroPedidos).codigo).toBe(codigo)
  }
}

describe('divisao de conta', () => {
  let encerrar: (() => void) | undefined
  afterEach(() => encerrar?.())

  async function setup(quantidade = 3) {
    const ambiente = await prepararAmbientePedidos()
    encerrar = ambiente.encerrar

    const repositorioDivisao = criarPedidoDivisaoContaRepository()
    const repositorioParte = criarPedidoDivisaoParteRepository()
    const repositorioMovimentacao = criarPedidoDivisaoMovimentacaoRepository()

    const criarDivisao = criarCriarDivisaoConta(
      ambiente.repositorioPedido,
      ambiente.repositorioSessao,
      ambiente.repositorioPagamento,
      repositorioDivisao,
      repositorioParte,
      repositorioMovimentacao,
    )
    const obterResumo = criarObterResumoDivisaoConta(
      ambiente.repositorioPedido,
      repositorioDivisao,
      repositorioParte,
      ambiente.repositorioPagamento,
    )
    const cancelar = criarCancelarDivisaoConta(
      ambiente.repositorioPedido,
      repositorioDivisao,
      repositorioParte,
      ambiente.repositorioPagamento,
      repositorioMovimentacao,
    )
    const listarHistorico = criarListarHistoricoDivisaoConta(repositorioMovimentacao)
    const registrarParte = criarRegistrarPagamentoParteDivisao(
      ambiente.repositorioPedido,
      ambiente.repositorioItem,
      ambiente.repositorioSessao,
      ambiente.repositorioMesa,
      ambiente.repositorioPagamento,
      repositorioDivisao,
      repositorioParte,
      repositorioMovimentacao,
    )
    const aplicarDesconto = criarAplicarDescontoPedido(
      ambiente.repositorioPedido,
      ambiente.repositorioItem,
      ambiente.repositorioSessao,
      ambiente.repositorioMesa,
    )

    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    ambiente.adicionarItemPedido({
      pedidoId: pedido.id,
      produtoId: ambiente.produto.id,
      quantidade,
    })
    const pedidoAtual = ambiente.repositorioPedido.buscarPorId(pedido.id)!
    const total = pedidoAtual.totalCentavos

    return {
      ...ambiente,
      pedido: pedidoAtual,
      total,
      criarDivisao,
      obterResumo,
      cancelar,
      listarHistorico,
      registrarParte,
      aplicarDesconto,
      repositorioDivisao,
      repositorioParte,
      repositorioMovimentacao,
    }
  }

  it('cria divisao com duas partes que fecham exatamente o total', async () => {
    const ambiente = await setup(2)
    const metade = ambiente.total / 2
    const resumo = ambiente.criarDivisao({
      pedidoId: ambiente.pedido.id,
      partes: [
        { identificacao: 'Joao', valorDefinidoCentavos: metade },
        { identificacao: 'Maria', valorDefinidoCentavos: metade },
      ],
    })

    expect(resumo.divisao.status).toBe(STATUS_DIVISAO_CONTA.ATIVA)
    expect(resumo.partes).toHaveLength(2)
    expect(resumo.totais.valorPedidoCentavos).toBe(ambiente.total)
  })

  it('cria divisao com tres ou mais partes', async () => {
    const ambiente = await setup(3)
    const resumo = ambiente.criarDivisao({
      pedidoId: ambiente.pedido.id,
      partes: [
        { identificacao: 'A', valorDefinidoCentavos: 600 },
        { identificacao: 'B', valorDefinidoCentavos: 600 },
        { identificacao: 'C', valorDefinidoCentavos: 600 },
      ],
    })
    expect(resumo.partes).toHaveLength(3)
  })

  it('impede divisao com apenas uma parte', async () => {
    const ambiente = await setup(2)
    esperarErroDivisao(
      () =>
        ambiente.criarDivisao({
          pedidoId: ambiente.pedido.id,
          partes: [{ identificacao: 'So', valorDefinidoCentavos: ambiente.total }],
        }),
      CODIGOS_ERRO_DIVISAO_CONTA.DIVISAO_PRECISA_DE_DUAS_OU_MAIS_PARTES,
    )
  })

  it('impede parte com valor zero', async () => {
    const ambiente = await setup(2)
    esperarErroDivisao(
      () =>
        ambiente.criarDivisao({
          pedidoId: ambiente.pedido.id,
          partes: [
            { identificacao: 'A', valorDefinidoCentavos: 0 },
            { identificacao: 'B', valorDefinidoCentavos: ambiente.total },
          ],
        }),
      CODIGOS_ERRO_DIVISAO_CONTA.DIVISAO_VALOR_PARTE_INVALIDO,
    )
  })

  it('impede parte com valor negativo', async () => {
    const ambiente = await setup(2)
    esperarErroDivisao(
      () =>
        ambiente.criarDivisao({
          pedidoId: ambiente.pedido.id,
          partes: [
            { identificacao: 'A', valorDefinidoCentavos: -100 },
            { identificacao: 'B', valorDefinidoCentavos: ambiente.total + 100 },
          ],
        }),
      CODIGOS_ERRO_DIVISAO_CONTA.DIVISAO_VALOR_PARTE_INVALIDO,
    )
  })

  it('impede soma menor que o total do pedido', async () => {
    const ambiente = await setup(2)
    esperarErroDivisao(
      () =>
        ambiente.criarDivisao({
          pedidoId: ambiente.pedido.id,
          partes: [
            { identificacao: 'A', valorDefinidoCentavos: 100 },
            { identificacao: 'B', valorDefinidoCentavos: 100 },
          ],
        }),
      CODIGOS_ERRO_DIVISAO_CONTA.DIVISAO_VALORES_NAO_FECHAM_COM_TOTAL_PEDIDO,
    )
  })

  it('impede soma maior que o total do pedido', async () => {
    const ambiente = await setup(2)
    esperarErroDivisao(
      () =>
        ambiente.criarDivisao({
          pedidoId: ambiente.pedido.id,
          partes: [
            { identificacao: 'A', valorDefinidoCentavos: ambiente.total },
            { identificacao: 'B', valorDefinidoCentavos: 100 },
          ],
        }),
      CODIGOS_ERRO_DIVISAO_CONTA.DIVISAO_VALORES_NAO_FECHAM_COM_TOTAL_PEDIDO,
    )
  })

  it('impede criar divisao em pedido cancelado', async () => {
    const ambiente = await setup(2)
    ambiente.cancelarPedido({
      pedidoId: ambiente.pedido.id,
      motivoCancelamento: 'teste',
    })
    esperarErroDivisao(
      () =>
        ambiente.criarDivisao({
          pedidoId: ambiente.pedido.id,
          partes: [
            { identificacao: 'A', valorDefinidoCentavos: 600 },
            { identificacao: 'B', valorDefinidoCentavos: 600 },
          ],
        }),
      CODIGOS_ERRO_DIVISAO_CONTA.PEDIDO_NAO_ABERTO,
    )
  })

  it('impede criar divisao em pedido finalizado', async () => {
    const ambiente = await setup(2)
    ambiente.registrarPagamentoPedido({
      pedidoId: ambiente.pedido.id,
      formaPagamento: FORMA_PAGAMENTO.PIX,
      valorCentavos: ambiente.total,
    })
    esperarErroDivisao(
      () =>
        ambiente.criarDivisao({
          pedidoId: ambiente.pedido.id,
          partes: [
            { identificacao: 'A', valorDefinidoCentavos: 600 },
            { identificacao: 'B', valorDefinidoCentavos: 600 },
          ],
        }),
      CODIGOS_ERRO_DIVISAO_CONTA.PEDIDO_NAO_ABERTO,
    )
  })

  it('impede criar divisao com pagamentos existentes', async () => {
    const ambiente = await setup(2)
    ambiente.registrarPagamentoPedido({
      pedidoId: ambiente.pedido.id,
      formaPagamento: FORMA_PAGAMENTO.PIX,
      valorCentavos: 100,
    })
    esperarErroDivisao(
      () =>
        ambiente.criarDivisao({
          pedidoId: ambiente.pedido.id,
          partes: [
            { identificacao: 'A', valorDefinidoCentavos: 500 },
            { identificacao: 'B', valorDefinidoCentavos: 600 },
          ],
        }),
      CODIGOS_ERRO_DIVISAO_CONTA.DIVISAO_NAO_PERMITIDA_COM_PAGAMENTOS_EXISTENTES,
    )
  })

  it('impede criar segunda divisao ativa para o mesmo pedido', async () => {
    const ambiente = await setup(2)
    const metade = ambiente.total / 2
    ambiente.criarDivisao({
      pedidoId: ambiente.pedido.id,
      partes: [
        { identificacao: 'A', valorDefinidoCentavos: metade },
        { identificacao: 'B', valorDefinidoCentavos: metade },
      ],
    })
    esperarErroDivisao(
      () =>
        ambiente.criarDivisao({
          pedidoId: ambiente.pedido.id,
          partes: [
            { identificacao: 'A', valorDefinidoCentavos: metade },
            { identificacao: 'B', valorDefinidoCentavos: metade },
          ],
        }),
      CODIGOS_ERRO_DIVISAO_CONTA.DIVISAO_JA_EXISTE,
    )
  })

  it('vincula pagamento a uma parte e permite multiplos pagamentos', async () => {
    const ambiente = await setup(2)
    const metade = ambiente.total / 2
    const criado = ambiente.criarDivisao({
      pedidoId: ambiente.pedido.id,
      partes: [
        { identificacao: 'Joao', valorDefinidoCentavos: metade },
        { identificacao: 'Maria', valorDefinidoCentavos: metade },
      ],
    })
    const parte = criado.partes[0]!

    const parcial = ambiente.registrarParte({
      pedidoId: ambiente.pedido.id,
      parteId: parte.id,
      formaPagamento: FORMA_PAGAMENTO.PIX,
      valorCentavos: 200,
    })
    expect(parcial.partes[0]?.status).toBe(STATUS_PARTE_DIVISAO.PARCIALMENTE_PAGA)
    expect(parcial.partes[0]?.pagamentos).toHaveLength(1)

    const quitada = ambiente.registrarParte({
      pedidoId: ambiente.pedido.id,
      parteId: parte.id,
      formaPagamento: FORMA_PAGAMENTO.DINHEIRO,
      valorCentavos: metade - 200,
    })
    expect(quitada.partes[0]?.status).toBe(STATUS_PARTE_DIVISAO.QUITADA)
    expect(quitada.partes[0]?.pagamentos).toHaveLength(2)
  })

  it('impede pagamento acima do restante da parte e do pedido', async () => {
    const ambiente = await setup(2)
    const metade = ambiente.total / 2
    const criado = ambiente.criarDivisao({
      pedidoId: ambiente.pedido.id,
      partes: [
        { identificacao: 'A', valorDefinidoCentavos: metade },
        { identificacao: 'B', valorDefinidoCentavos: metade },
      ],
    })

    esperarErroDivisao(
      () =>
        ambiente.registrarParte({
          pedidoId: ambiente.pedido.id,
          parteId: criado.partes[0]!.id,
          formaPagamento: FORMA_PAGAMENTO.PIX,
          valorCentavos: metade + 1,
        }),
      CODIGOS_ERRO_DIVISAO_CONTA.PAGAMENTO_EXCEDE_VALOR_RESTANTE_DA_PARTE,
    )
  })

  it('pagamento em dinheiro continua afetando caixa e cortesia funciona vinculada', async () => {
    const ambiente = await setup(2)
    const metade = ambiente.total / 2
    const criado = ambiente.criarDivisao({
      pedidoId: ambiente.pedido.id,
      partes: [
        { identificacao: 'A', valorDefinidoCentavos: metade },
        { identificacao: 'B', valorDefinidoCentavos: metade },
      ],
    })

    ambiente.registrarParte({
      pedidoId: ambiente.pedido.id,
      parteId: criado.partes[0]!.id,
      formaPagamento: FORMA_PAGAMENTO.DINHEIRO,
      valorCentavos: metade,
    })
    ambiente.registrarParte({
      pedidoId: ambiente.pedido.id,
      parteId: criado.partes[1]!.id,
      formaPagamento: FORMA_PAGAMENTO.CORTESIA,
      valorCentavos: metade,
      motivoCortesia: 'Cortesia do gerente',
    })

    const caixa = criarObterResumoCaixaAtual()()!
    expect(caixa.totalVendasDinheiroCentavos).toBe(metade)

    const pedido = ambiente.repositorioPedido.buscarPorId(ambiente.pedido.id)!
    expect(pedido.valorCortesiaCentavos).toBe(metade)
    expect(pedido.status).toBe(STATUS_PEDIDO.FINALIZADO)
  })

  it('marca divisao como QUITADA apenas quando todas as partes forem quitadas e finaliza', async () => {
    const ambiente = await setup(2)
    const metade = ambiente.total / 2
    const criado = ambiente.criarDivisao({
      pedidoId: ambiente.pedido.id,
      partes: [
        { identificacao: 'A', valorDefinidoCentavos: metade },
        { identificacao: 'B', valorDefinidoCentavos: metade },
      ],
    })

    const aposPrimeira = ambiente.registrarParte({
      pedidoId: ambiente.pedido.id,
      parteId: criado.partes[0]!.id,
      formaPagamento: FORMA_PAGAMENTO.PIX,
      valorCentavos: metade,
    })
    expect(aposPrimeira.divisao.status).toBe(STATUS_DIVISAO_CONTA.ATIVA)
    expect(ambiente.repositorioPedido.buscarPorId(ambiente.pedido.id)?.status).toBe(
      STATUS_PEDIDO.ABERTO,
    )

    const final = ambiente.registrarParte({
      pedidoId: ambiente.pedido.id,
      parteId: criado.partes[1]!.id,
      formaPagamento: FORMA_PAGAMENTO.PIX,
      valorCentavos: metade,
    })
    expect(final.divisao.status).toBe(STATUS_DIVISAO_CONTA.QUITADA)
    expect(ambiente.repositorioPedido.buscarPorId(ambiente.pedido.id)?.status).toBe(
      STATUS_PEDIDO.FINALIZADO,
    )
  })

  it('impede adicionar item e alterar desconto durante divisao ativa', async () => {
    const ambiente = await setup(2)
    const metade = ambiente.total / 2
    ambiente.criarDivisao({
      pedidoId: ambiente.pedido.id,
      partes: [
        { identificacao: 'A', valorDefinidoCentavos: metade },
        { identificacao: 'B', valorDefinidoCentavos: metade },
      ],
    })

    esperarErroPedidos(
      () =>
        ambiente.adicionarItemPedido({
          pedidoId: ambiente.pedido.id,
          produtoId: ambiente.produto.id,
          quantidade: 1,
        }),
      CODIGOS_ERRO_PEDIDOS.ALTERACAO_PEDIDO_BLOQUEADA_POR_DIVISAO_ATIVA,
    )

    esperarErroPedidos(
      () =>
        ambiente.aplicarDesconto({
          pedidoId: ambiente.pedido.id,
          descontoCentavos: 100,
        }),
      CODIGOS_ERRO_PEDIDOS.ALTERACAO_PEDIDO_BLOQUEADA_POR_DIVISAO_ATIVA,
    )

    esperarErroPedidos(
      () =>
        ambiente.registrarPagamentoPedido({
          pedidoId: ambiente.pedido.id,
          formaPagamento: FORMA_PAGAMENTO.PIX,
          valorCentavos: 100,
        }),
      CODIGOS_ERRO_PEDIDOS.PAGAMENTO_BLOQUEADO_POR_DIVISAO_ATIVA,
    )
  })

  it('impede alterar taxa de entrega durante divisao ativa', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrar = ambiente.encerrar

    const criarDelivery = criarCriarPedidoDelivery(
      ambiente.repositorioPedido,
      ambiente.repositorioSessao,
      criarPedidoEntregaRepository(),
    )
    const atualizarTaxa = criarAtualizarTaxaEntrega(
      ambiente.repositorioPedido,
      ambiente.repositorioItem,
      criarPedidoEntregaRepository(),
    )
    const repositorioDivisao = criarPedidoDivisaoContaRepository()
    const repositorioParte = criarPedidoDivisaoParteRepository()
    const repositorioMovimentacao = criarPedidoDivisaoMovimentacaoRepository()
    const criarDivisao = criarCriarDivisaoConta(
      ambiente.repositorioPedido,
      ambiente.repositorioSessao,
      ambiente.repositorioPagamento,
      repositorioDivisao,
      repositorioParte,
      repositorioMovimentacao,
    )

    const resumo = criarDelivery({
      clienteNome: 'Cliente',
      telefone: '81999999999',
      taxaEntregaCentavos: 0,
    })
    ambiente.adicionarItemPedido({
      pedidoId: resumo.pedido.id,
      produtoId: ambiente.produto.id,
      quantidade: 2,
    })
    const pedido = ambiente.repositorioPedido.buscarPorId(resumo.pedido.id)!
    const metade = pedido.totalCentavos / 2
    criarDivisao({
      pedidoId: pedido.id,
      partes: [
        { identificacao: 'A', valorDefinidoCentavos: metade },
        { identificacao: 'B', valorDefinidoCentavos: metade },
      ],
    })

    esperarErroPedidos(
      () =>
        atualizarTaxa({
          pedidoId: pedido.id,
          taxaEntregaCentavos: 500,
        }),
      CODIGOS_ERRO_PEDIDOS.ALTERACAO_PEDIDO_BLOQUEADA_POR_DIVISAO_ATIVA,
    )
  })

  it('cancela divisao sem pagamentos e impede cancelar apos primeiro pagamento', async () => {
    const ambiente = await setup(2)
    const metade = ambiente.total / 2
    const criado = ambiente.criarDivisao({
      pedidoId: ambiente.pedido.id,
      partes: [
        { identificacao: 'A', valorDefinidoCentavos: metade },
        { identificacao: 'B', valorDefinidoCentavos: metade },
      ],
    })

    const cancelado = ambiente.cancelar({
      pedidoId: ambiente.pedido.id,
      motivo: 'cliente desistiu',
    })
    expect(cancelado.divisao.status).toBe(STATUS_DIVISAO_CONTA.CANCELADA)

    const historico = ambiente.listarHistorico({ pedidoId: ambiente.pedido.id })
    expect(historico.some((h) => h.tipo === TIPO_MOVIMENTACAO_DIVISAO.DIVISAO_CANCELADA)).toBe(
      true,
    )

    // Novo pedido: cancela apos pagamento
    const [mesa2] = ambiente.criarMesasPorIntervalo({ numeroInicial: 2, numeroFinal: 2 })
    const pedido2 = ambiente.criarPedidoMesa({ mesaId: mesa2.id })
    ambiente.adicionarItemPedido({
      pedidoId: pedido2.id,
      produtoId: ambiente.produto.id,
      quantidade: 2,
    })
    const total2 = ambiente.repositorioPedido.buscarPorId(pedido2.id)!.totalCentavos
    const criado2 = ambiente.criarDivisao({
      pedidoId: pedido2.id,
      partes: [
        { identificacao: 'A', valorDefinidoCentavos: total2 / 2 },
        { identificacao: 'B', valorDefinidoCentavos: total2 / 2 },
      ],
    })
    ambiente.registrarParte({
      pedidoId: pedido2.id,
      parteId: criado2.partes[0]!.id,
      formaPagamento: FORMA_PAGAMENTO.PIX,
      valorCentavos: 100,
    })
    esperarErroDivisao(
      () => ambiente.cancelar({ pedidoId: pedido2.id }),
      CODIGOS_ERRO_DIVISAO_CONTA.CANCELAMENTO_DIVISAO_NAO_PERMITIDO_COM_PAGAMENTOS,
    )
    expect(criado.divisao.id).toBeTruthy()
  })

  it('preserva historico de divisao e faz rollback ao criar com falha', async () => {
    const ambiente = await setup(2)
    const metade = ambiente.total / 2
    ambiente.criarDivisao({
      pedidoId: ambiente.pedido.id,
      partes: [
        { identificacao: 'A', valorDefinidoCentavos: metade },
        { identificacao: 'B', valorDefinidoCentavos: metade },
      ],
    })
    const historico = ambiente.listarHistorico({ pedidoId: ambiente.pedido.id })
    expect(historico.some((h) => h.tipo === TIPO_MOVIMENTACAO_DIVISAO.DIVISAO_CRIADA)).toBe(true)
    expect(historico.filter((h) => h.tipo === TIPO_MOVIMENTACAO_DIVISAO.PARTE_CRIADA)).toHaveLength(
      2,
    )

    // Rollback: tentativa invalida nao altera estado ja cancelavel (segundo pedido)
    const [mesa3] = ambiente.criarMesasPorIntervalo({ numeroInicial: 3, numeroFinal: 3 })
    const pedido3 = ambiente.criarPedidoMesa({ mesaId: mesa3.id })
    ambiente.adicionarItemPedido({
      pedidoId: pedido3.id,
      produtoId: ambiente.produto.id,
      quantidade: 2,
    })
    const antes = ambiente.repositorioDivisao.buscarPorPedido(pedido3.id)
    expect(antes).toBeNull()

    esperarErroDivisao(
      () =>
        ambiente.criarDivisao({
          pedidoId: pedido3.id,
          partes: [
            { identificacao: 'A', valorDefinidoCentavos: 100 },
            { identificacao: 'B', valorDefinidoCentavos: 100 },
          ],
        }),
      CODIGOS_ERRO_DIVISAO_CONTA.DIVISAO_VALORES_NAO_FECHAM_COM_TOTAL_PEDIDO,
    )
    expect(ambiente.repositorioDivisao.buscarPorPedido(pedido3.id)).toBeNull()
    expect(ambiente.listarHistorico({ pedidoId: pedido3.id })).toHaveLength(0)
  })

  it('faz rollback ao registrar pagamento invalido em parte', async () => {
    const ambiente = await setup(2)
    const metade = ambiente.total / 2
    const criado = ambiente.criarDivisao({
      pedidoId: ambiente.pedido.id,
      partes: [
        { identificacao: 'A', valorDefinidoCentavos: metade },
        { identificacao: 'B', valorDefinidoCentavos: metade },
      ],
    })

    esperarErroDivisao(
      () =>
        ambiente.registrarParte({
          pedidoId: ambiente.pedido.id,
          parteId: criado.partes[0]!.id,
          formaPagamento: FORMA_PAGAMENTO.PIX,
          valorCentavos: metade + 50,
        }),
      CODIGOS_ERRO_DIVISAO_CONTA.PAGAMENTO_EXCEDE_VALOR_RESTANTE_DA_PARTE,
    )

    expect(ambiente.repositorioPagamento.listarPorPedido(ambiente.pedido.id)).toHaveLength(0)
    const pedido = ambiente.repositorioPedido.buscarPorId(ambiente.pedido.id)!
    expect(pedido.valorPagoCentavos).toBe(0)
    expect(pedido.valorRestanteCentavos).toBe(ambiente.total)
  })

  it('ao cancelar pedido com divisao ativa marca divisao CANCELADA preservando historico', async () => {
    const ambiente = await setup(2)
    const metade = ambiente.total / 2
    ambiente.criarDivisao({
      pedidoId: ambiente.pedido.id,
      partes: [
        { identificacao: 'A', valorDefinidoCentavos: metade },
        { identificacao: 'B', valorDefinidoCentavos: metade },
      ],
    })

    ambiente.cancelarPedido({
      pedidoId: ambiente.pedido.id,
      motivoCancelamento: 'mesa fechou',
    })

    const divisao = ambiente.repositorioDivisao.buscarPorPedido(ambiente.pedido.id)!
    expect(divisao.status).toBe(STATUS_DIVISAO_CONTA.CANCELADA)
    expect(ambiente.repositorioParte.listarPorDivisao(divisao.id)).toHaveLength(2)
    const historico = ambiente.listarHistorico({ pedidoId: ambiente.pedido.id })
    expect(historico.some((h) => h.tipo === TIPO_MOVIMENTACAO_DIVISAO.DIVISAO_CANCELADA)).toBe(
      true,
    )
  })
})
