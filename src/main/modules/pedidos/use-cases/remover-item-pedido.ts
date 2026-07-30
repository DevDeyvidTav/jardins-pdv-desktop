import type { RemoverItemPedidoEntrada, ResumoPedido } from '@shared/types/pedido'
import { CODIGOS_ERRO_PEDIDOS, ErroPedidos } from '../errors/erros-pedidos'
import type { PedidoRepository } from '../repositories/pedido.repository'
import { criarPedidoRepository } from '../repositories/pedido.repository'
import type { PedidoItemRepository } from '../repositories/pedido-item.repository'
import { criarPedidoItemRepository } from '../repositories/pedido-item.repository'
import { recalcularTotaisPedido } from '../services/recalcular-totais-pedido'
import { garantirPedidoAberto, obterResumoPedido } from './consultas-pedido'

export function criarRemoverItemPedido(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioItem: PedidoItemRepository = criarPedidoItemRepository(),
) {
  return function removerItemPedido(entrada: RemoverItemPedidoEntrada): ResumoPedido {
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
      throw new ErroPedidos(CODIGOS_ERRO_PEDIDOS.ITEM_NAO_ENCONTRADO, 'Item nao encontrado.')
    }

    repositorioItem.cancelar(entrada.itemId)
    recalcularTotaisPedido(entrada.pedidoId, repositorioPedido, repositorioItem)

    return obterResumoPedido({ pedidoId: entrada.pedidoId })
  }
}

export const removerItemPedido = criarRemoverItemPedido()
