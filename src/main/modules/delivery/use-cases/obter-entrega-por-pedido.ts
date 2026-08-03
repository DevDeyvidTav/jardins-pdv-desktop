import type { ObterEntregaPorPedidoEntrada, PedidoEntrega } from '@shared/types/pedido'
import { ErroDelivery, CODIGOS_ERRO_DELIVERY } from '../errors/erros-delivery'
import {
  criarPedidoEntregaRepository,
  type PedidoEntregaRepository,
} from '../repositories/pedido-entrega.repository'

export function criarObterEntregaPorPedido(
  repositorioEntrega: PedidoEntregaRepository = criarPedidoEntregaRepository(),
) {
  return function obterEntregaPorPedido(
    entrada: ObterEntregaPorPedidoEntrada,
  ): PedidoEntrega {
    const entrega = repositorioEntrega.buscarPorPedidoId(entrada.pedidoId)
    if (!entrega) {
      throw new ErroDelivery(
        CODIGOS_ERRO_DELIVERY.ENTREGA_NAO_ENCONTRADA,
        'Entrega nao encontrada para este pedido.',
      )
    }
    return entrega
  }
}

export const obterEntregaPorPedido = criarObterEntregaPorPedido()
