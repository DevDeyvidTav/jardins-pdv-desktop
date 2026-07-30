import type { PedidoRepository } from '../repositories/pedido.repository'
import type { PedidoItemRepository } from '../repositories/pedido-item.repository'
import { calcularTotaisPedido } from '../types/pedido-calculos.types'

export function recalcularTotaisPedido(
  pedidoId: string,
  repositorioPedido: PedidoRepository,
  repositorioItem: PedidoItemRepository,
): void {
  const pedido = repositorioPedido.buscarPorId(pedidoId)

  if (!pedido) {
    throw new Error('Pedido nao encontrado.')
  }

  const subtotalCentavos = repositorioItem.somarTotaisAtivos(pedidoId)
  const { totalCentavos } = calcularTotaisPedido(
    subtotalCentavos,
    pedido.descontoCentavos,
  )

  repositorioPedido.atualizarTotais({
    pedidoId,
    subtotalCentavos,
    totalCentavos,
  })
}
