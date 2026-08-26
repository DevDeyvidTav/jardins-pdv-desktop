import {
  STATUS_DIVISAO_CONTA,
  STATUS_PARTE_DIVISAO,
  type ParteDivisaoResumo,
  type ResumoDivisaoConta,
  type StatusParteDivisao,
} from '@shared/types/divisao-conta'
import { STATUS_PAGAMENTO_PEDIDO } from '@shared/types/pagamento-pedido'
import {
  criarPagamentoPedidoRepository,
  type PagamentoPedidoRepository,
} from '../../pagamentos/repositories/pagamento-pedido.repository'
import {
  criarPedidoDivisaoContaRepository,
  criarPedidoDivisaoParteRepository,
  type PedidoDivisaoContaRepository,
  type PedidoDivisaoParteRepository,
} from '../repositories/divisao-conta.repository'
import { CODIGOS_ERRO_PEDIDOS, ErroPedidos } from '../../pedidos/errors/erros-pedidos'

export function calcularStatusParte(
  valorDefinidoCentavos: number,
  valorPagoCentavos: number,
): StatusParteDivisao {
  if (valorPagoCentavos <= 0) return STATUS_PARTE_DIVISAO.PENDENTE
  if (valorPagoCentavos < valorDefinidoCentavos) {
    return STATUS_PARTE_DIVISAO.PARCIALMENTE_PAGA
  }
  return STATUS_PARTE_DIVISAO.QUITADA
}

export function criarMontarResumoDivisaoConta(
  repositorioDivisao: PedidoDivisaoContaRepository = criarPedidoDivisaoContaRepository(),
  repositorioParte: PedidoDivisaoParteRepository = criarPedidoDivisaoParteRepository(),
  repositorioPagamento: PagamentoPedidoRepository = criarPagamentoPedidoRepository(),
) {
  return function montarResumoDivisaoConta(
    pedidoId: string,
    valorPedidoCentavos: number,
  ): ResumoDivisaoConta | null {
    const divisao = repositorioDivisao.buscarPorPedido(pedidoId)
    if (!divisao) return null

    const partesDb = repositorioParte.listarPorDivisao(divisao.id)
    const pagamentosPedido = repositorioPagamento
      .listarPorPedido(pedidoId)
      .filter(
        (p) =>
          p.status === STATUS_PAGAMENTO_PEDIDO.CONFIRMADO && p.canceladoEm === null,
      )

    const partes: ParteDivisaoResumo[] = partesDb.map((parte) => {
      const pagamentosParte = pagamentosPedido.filter(
        (p) => p.pedidoDivisaoParteId === parte.id,
      )
      const valorPagoCentavos = pagamentosParte.reduce(
        (acc, p) => acc + p.valorCentavos,
        0,
      )
      const valorRestanteCentavos = Math.max(
        0,
        parte.valorDefinidoCentavos - valorPagoCentavos,
      )
      return {
        id: parte.id,
        identificacao: parte.identificacao,
        valorDefinidoCentavos: parte.valorDefinidoCentavos,
        valorPagoCentavos,
        valorRestanteCentavos,
        status: calcularStatusParte(parte.valorDefinidoCentavos, valorPagoCentavos),
        pagamentos: pagamentosParte.map((p) => ({
          id: p.id,
          formaPagamento: p.formaPagamento,
          valorCentavos: p.valorCentavos,
          valorRecebidoCentavos: p.valorRecebidoCentavos,
          trocoCentavos: p.trocoCentavos,
          criadoEm: p.criadoEm,
          motivoCortesia: p.motivoCortesia,
        })),
      }
    })

    const valorPagoCentavos = partes.reduce((acc, p) => acc + p.valorPagoCentavos, 0)

    return {
      divisao: {
        id: divisao.id,
        pedidoId: divisao.pedidoId,
        status: divisao.status,
        valorTotalCentavos: divisao.valorTotalCentavos,
        criadoEm: divisao.criadoEm,
        canceladoEm: divisao.canceladoEm,
      },
      partes,
      totais: {
        valorPedidoCentavos,
        valorPagoCentavos,
        valorRestanteCentavos: Math.max(0, valorPedidoCentavos - valorPagoCentavos),
      },
    }
  }
}

export const montarResumoDivisaoConta = criarMontarResumoDivisaoConta()

export function garantirPedidoSemDivisaoAtiva(
  pedidoId: string,
  repositorioDivisao: PedidoDivisaoContaRepository = criarPedidoDivisaoContaRepository(),
): void {
  const ativa = repositorioDivisao.buscarAtivaPorPedido(pedidoId)
  if (ativa) {
    throw new ErroPedidos(
      CODIGOS_ERRO_PEDIDOS.ALTERACAO_PEDIDO_BLOQUEADA_POR_DIVISAO_ATIVA,
      'Pedido possui divisao de conta ativa. Cancele a divisao ou quite as partes antes de alterar o pedido.',
    )
  }
}

export function garantirPagamentoSemDivisaoAtiva(
  pedidoId: string,
  repositorioDivisao: PedidoDivisaoContaRepository = criarPedidoDivisaoContaRepository(),
): void {
  const ativa = repositorioDivisao.buscarAtivaPorPedido(pedidoId)
  if (ativa) {
    throw new ErroPedidos(
      CODIGOS_ERRO_PEDIDOS.PAGAMENTO_BLOQUEADO_POR_DIVISAO_ATIVA,
      'Pedido possui divisao ativa. Registre o pagamento pela parte correspondente.',
    )
  }
}

export function pedidoPossuiDivisaoAtiva(
  pedidoId: string,
  repositorioDivisao: PedidoDivisaoContaRepository = criarPedidoDivisaoContaRepository(),
): boolean {
  return Boolean(repositorioDivisao.buscarAtivaPorPedido(pedidoId))
}

export { STATUS_DIVISAO_CONTA, STATUS_PARTE_DIVISAO }
