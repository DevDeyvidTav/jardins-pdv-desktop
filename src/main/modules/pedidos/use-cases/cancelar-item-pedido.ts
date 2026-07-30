import type { CancelarItemPedidoEntrada, ResumoPedido } from '@shared/types/pedido'
import { CODIGOS_ERRO_PEDIDOS, ErroPedidos } from '../errors/erros-pedidos'
import type { PedidoRepository } from '../repositories/pedido.repository'
import { criarPedidoRepository } from '../repositories/pedido.repository'
import type { PedidoItemRepository } from '../repositories/pedido-item.repository'
import { criarPedidoItemRepository } from '../repositories/pedido-item.repository'
import { recalcularTotaisPedido } from '../services/recalcular-totais-pedido'
import { garantirPedidoAberto, obterResumoPedido } from './consultas-pedido'

export function criarCancelarItemPedido(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioItem: PedidoItemRepository = criarPedidoItemRepository(),
) {
  return function cancelarItemPedido(entrada: CancelarItemPedidoEntrada): ResumoPedido {
    const pedido = repositorioPedido.buscarPorId(entrada.pedidoId)

    if (!pedido) {
      throw new ErroPedidos(
        CODIGOS_ERRO_PEDIDOS.PEDIDO_NAO_ENCONTRADO,
        'Pedido nao encontrado.',
      )
    }

    garantirPedidoAberto(pedido)

    const item = repositorioItem.buscarPorId(entrada.itemId)

    if (!item || item.pedidoId !== entrada.pedidoId || item.canceladoEm) {
      throw new ErroPedidos(
        CODIGOS_ERRO_PEDIDOS.ITEM_NAO_ENCONTRADO,
        'Item nao encontrado ou ja cancelado.',
      )
    }

    repositorioItem.cancelar(entrada.itemId)
    recalcularTotaisPedido(entrada.pedidoId, repositorioPedido, repositorioItem)

    return obterResumoPedido({ pedidoId: entrada.pedidoId })
  }
}

export const cancelarItemPedido = criarCancelarItemPedido()

/** Alias mantido para compatibilidade com IPC e UI existentes. */
export const removerItemPedido = cancelarItemPedido
export const criarRemoverItemPedido = criarCancelarItemPedido
