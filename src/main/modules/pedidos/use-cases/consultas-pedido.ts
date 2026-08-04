import type { ObterPedidoAbertoPorMesaEntrada, ResumoPedido } from '@shared/types/pedido'
import { STATUS_PEDIDO } from '@shared/types/pedido'
import { montarResumoDivisaoConta } from '../../divisao-conta/services/resumo-divisao-conta'
import { CODIGOS_ERRO_PEDIDOS, ErroPedidos } from '../errors/erros-pedidos'
import type { PedidoRepository } from '../repositories/pedido.repository'
import { criarPedidoRepository } from '../repositories/pedido.repository'
import type { PedidoItemRepository } from '../repositories/pedido-item.repository'
import { criarPedidoItemRepository } from '../repositories/pedido-item.repository'
import { criarPedidoEntregaRepository } from '../../delivery/repositories/pedido-entrega.repository'

export function criarObterPedidoAbertoPorMesa(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioItem: PedidoItemRepository = criarPedidoItemRepository(),
) {
  return function obterPedidoAbertoPorMesa(
    entrada: ObterPedidoAbertoPorMesaEntrada,
  ): ResumoPedido | null {
    const pedido = repositorioPedido.buscarPedidoAbertoPorMesa(entrada.mesaId)

    if (!pedido) {
      return null
    }

    return {
      pedido,
      itens: repositorioItem.listarPorPedido(pedido.id, true),
      entrega: null,
      divisao: montarResumoDivisaoConta(pedido.id, pedido.totalCentavos),
    }
  }
}

export const obterPedidoAbertoPorMesa = criarObterPedidoAbertoPorMesa()

export function criarListarPedidosAbertos(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
) {
  return function listarPedidosAbertos(): import('@shared/types/pedido').Pedido[] {
    return repositorioPedido.listarPedidosAbertos()
  }
}

export const listarPedidosAbertos = criarListarPedidosAbertos()

export function criarObterResumoPedido(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioItem: PedidoItemRepository = criarPedidoItemRepository(),
) {
  return function obterResumoPedido(
    entrada: import('@shared/types/pedido').ObterResumoPedidoEntrada,
  ): ResumoPedido {
    const pedido = repositorioPedido.buscarPorId(entrada.pedidoId)

    if (!pedido) {
      throw new ErroPedidos(
        CODIGOS_ERRO_PEDIDOS.PEDIDO_NAO_ENCONTRADO,
        'Pedido nao encontrado.',
      )
    }

    const apenasItensAtivos = !(entrada.incluirItensCancelados ?? false)
    const repositorioEntrega = criarPedidoEntregaRepository()
    const entrega = repositorioEntrega.buscarPorPedidoId(pedido.id)

    return {
      pedido,
      itens: repositorioItem.listarPorPedido(pedido.id, apenasItensAtivos),
      entrega: entrega ?? null,
      divisao: montarResumoDivisaoConta(pedido.id, pedido.totalCentavos),
    }
  }
}

export const obterResumoPedido = criarObterResumoPedido()

function garantirPedidoAberto(pedido: import('@shared/types/pedido').Pedido): void {
  if (pedido.status !== STATUS_PEDIDO.ABERTO) {
    throw new ErroPedidos(
      CODIGOS_ERRO_PEDIDOS.PEDIDO_NAO_ABERTO,
      'Pedido nao esta aberto para alteracao.',
    )
  }
}

export { garantirPedidoAberto }
