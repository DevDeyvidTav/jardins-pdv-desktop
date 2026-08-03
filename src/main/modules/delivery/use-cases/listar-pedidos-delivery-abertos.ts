import type {
  ItemDeliveryAberto,
  ListarPedidosDeliveryAbertosEntrada,
} from '@shared/types/pedido'
import { STATUS_PEDIDO, TIPO_PEDIDO } from '@shared/types/pedido'
import {
  criarPedidoRepository,
  type PedidoRepository,
} from '../../pedidos/repositories/pedido.repository'
import {
  criarPedidoEntregaRepository,
  type PedidoEntregaRepository,
} from '../repositories/pedido-entrega.repository'

export function criarListarPedidosDeliveryAbertos(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioEntrega: PedidoEntregaRepository = criarPedidoEntregaRepository(),
) {
  return function listarPedidosDeliveryAbertos(
    entrada?: ListarPedidosDeliveryAbertosEntrada,
  ): ItemDeliveryAberto[] {
    const todosPedidosAbertos = repositorioPedido.listarPedidosAbertos()
    const pedidosDelivery = todosPedidosAbertos.filter(
      (p) => p.tipo === TIPO_PEDIDO.DELIVERY && p.status === STATUS_PEDIDO.ABERTO,
    )

    const itens: ItemDeliveryAberto[] = []

    for (const pedido of pedidosDelivery) {
      const entrega = repositorioEntrega.buscarPorPedidoId(pedido.id)
      if (!entrega) continue

      if (entrada?.status && entrega.status !== entrada.status) continue

      itens.push({ pedido, entrega })
    }

    return itens
  }
}

export const listarPedidosDeliveryAbertos = criarListarPedidosDeliveryAbertos()
