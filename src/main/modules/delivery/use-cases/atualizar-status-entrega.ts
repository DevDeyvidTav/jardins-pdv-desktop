import type { AtualizarStatusEntregaEntrada, PedidoEntrega } from '@shared/types/pedido'
import { STATUS_PEDIDO, STATUS_ENTREGA } from '@shared/types/pedido'
import { ErroDelivery, CODIGOS_ERRO_DELIVERY } from '../errors/erros-delivery'
import {
  criarPedidoEntregaRepository,
  type PedidoEntregaRepository,
} from '../repositories/pedido-entrega.repository'
import {
  criarPedidoRepository,
  type PedidoRepository,
} from '../../pedidos/repositories/pedido.repository'

const TRANSICOES_VALIDAS: Record<string, string[]> = {
  [STATUS_ENTREGA.AGUARDANDO_PREPARO]: [STATUS_ENTREGA.EM_PREPARO],
  [STATUS_ENTREGA.EM_PREPARO]: [STATUS_ENTREGA.SAIU_PARA_ENTREGA],
  [STATUS_ENTREGA.SAIU_PARA_ENTREGA]: [STATUS_ENTREGA.ENTREGUE],
  [STATUS_ENTREGA.ENTREGUE]: [],
  [STATUS_ENTREGA.CANCELADA]: [],
}

export function criarAtualizarStatusEntrega(
  repositorioEntrega: PedidoEntregaRepository = criarPedidoEntregaRepository(),
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
) {
  return function atualizarStatusEntrega(
    entrada: AtualizarStatusEntregaEntrada,
  ): PedidoEntrega {
    const pedido = repositorioPedido.buscarPorId(entrada.pedidoId)
    if (!pedido) {
      throw new ErroDelivery(
        CODIGOS_ERRO_DELIVERY.PEDIDO_NAO_ENCONTRADO,
        'Pedido nao encontrado.',
      )
    }

    // Não permite alterar status de entrega de pedido cancelado
    if (pedido.status === STATUS_PEDIDO.CANCELADO) {
      throw new ErroDelivery(
        CODIGOS_ERRO_DELIVERY.STATUS_ENTREGA_INVALIDO,
        'Nao e possivel alterar o status de entrega de um pedido cancelado.',
      )
    }

    const entrega = repositorioEntrega.buscarPorPedidoId(entrada.pedidoId)
    if (!entrega) {
      throw new ErroDelivery(
        CODIGOS_ERRO_DELIVERY.ENTREGA_NAO_ENCONTRADA,
        'Entrega nao encontrada para este pedido.',
      )
    }

    // Não permite alterar entrega já finalizada ou cancelada
    if (
      entrega.status === STATUS_ENTREGA.ENTREGUE ||
      entrega.status === STATUS_ENTREGA.CANCELADA
    ) {
      throw new ErroDelivery(
        CODIGOS_ERRO_DELIVERY.STATUS_ENTREGA_INVALIDO,
        `Entrega com status "${entrega.status}" nao pode ser alterada.`,
      )
    }

    const transicoesPermitidas = TRANSICOES_VALIDAS[entrega.status] ?? []
    if (!transicoesPermitidas.includes(entrada.status)) {
      throw new ErroDelivery(
        CODIGOS_ERRO_DELIVERY.TRANSICAO_STATUS_ENTREGA_INVALIDA,
        `Transicao de "${entrega.status}" para "${entrada.status}" nao e permitida.`,
      )
    }

    return repositorioEntrega.atualizarStatus(entrada.pedidoId, entrada.status)
  }
}

export const atualizarStatusEntrega = criarAtualizarStatusEntrega()
