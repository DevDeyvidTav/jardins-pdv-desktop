import type { CancelarPedidoEntrada, Pedido } from '@shared/types/pedido'
import { STATUS_PEDIDO, TIPO_PEDIDO } from '@shared/types/pedido'
import { STATUS_MESA } from '@shared/types/mesa'
import type { MesaRepository } from '../../mesas/repositories/mesa.repository'
import { criarMesaRepository } from '../../mesas/repositories/mesa.repository'
import { CODIGOS_ERRO_PEDIDOS, ErroPedidos } from '../errors/erros-pedidos'
import type { PedidoRepository } from '../repositories/pedido.repository'
import { criarPedidoRepository } from '../repositories/pedido.repository'

export function criarCancelarPedido(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioMesa: MesaRepository = criarMesaRepository(),
) {
  return function cancelarPedido(entrada: CancelarPedidoEntrada): Pedido {
    const pedido = repositorioPedido.buscarPorId(entrada.pedidoId)

    if (!pedido) {
      throw new ErroPedidos(
        CODIGOS_ERRO_PEDIDOS.PEDIDO_NAO_ENCONTRADO,
        'Pedido nao encontrado.',
      )
    }

    if (pedido.status !== STATUS_PEDIDO.ABERTO) {
      throw new ErroPedidos(
        CODIGOS_ERRO_PEDIDOS.PEDIDO_NAO_ABERTO,
        'Pedido nao esta aberto para cancelamento.',
      )
    }

    const pedidoCancelado = repositorioPedido.cancelar(entrada.pedidoId)

    if (pedido.tipo === TIPO_PEDIDO.MESA && pedido.mesaId) {
      repositorioMesa.atualizarStatus(pedido.mesaId, STATUS_MESA.LIVRE)
    }

    return pedidoCancelado
  }
}

export const cancelarPedido = criarCancelarPedido()
