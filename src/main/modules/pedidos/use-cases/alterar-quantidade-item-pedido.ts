import type { AlterarQuantidadeItemPedidoEntrada, ResumoPedido } from '@shared/types/pedido'
import { CODIGOS_ERRO_PEDIDOS, ErroPedidos } from '../errors/erros-pedidos'
import type { PedidoRepository } from '../repositories/pedido.repository'
import { criarPedidoRepository } from '../repositories/pedido.repository'
import type { PedidoItemRepository } from '../repositories/pedido-item.repository'
import { criarPedidoItemRepository } from '../repositories/pedido-item.repository'
import { recalcularTotaisPedido } from '../services/recalcular-totais-pedido'
import { garantirPedidoAberto, obterResumoPedido } from './consultas-pedido'

export function criarAlterarQuantidadeItemPedido(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioItem: PedidoItemRepository = criarPedidoItemRepository(),
) {
  return function alterarQuantidadeItemPedido(
    entrada: AlterarQuantidadeItemPedidoEntrada,
  ): ResumoPedido {
    const pedido = repositorioPedido.buscarPorId(entrada.pedidoId)

    if (!pedido) {
      throw new ErroPedidos(
        CODIGOS_ERRO_PEDIDOS.PEDIDO_NAO_ENCONTRADO,
        'Pedido nao encontrado.',
      )
    }

    garantirPedidoAberto(pedido)

    if (entrada.quantidade <= 0) {
      throw new ErroPedidos(
        CODIGOS_ERRO_PEDIDOS.QUANTIDADE_INVALIDA,
        'Quantidade deve ser maior que zero.',
      )
    }

    const item = repositorioItem.buscarPorId(entrada.itemId)

    if (!item || item.pedidoId !== entrada.pedidoId || item.canceladoEm) {
      throw new ErroPedidos(CODIGOS_ERRO_PEDIDOS.ITEM_NAO_ENCONTRADO, 'Item nao encontrado.')
    }

    repositorioItem.atualizarQuantidade(entrada.itemId, entrada.quantidade)
    recalcularTotaisPedido(entrada.pedidoId, repositorioPedido, repositorioItem)

    return obterResumoPedido({ pedidoId: entrada.pedidoId })
  }
}

export const alterarQuantidadeItemPedido = criarAlterarQuantidadeItemPedido()
