import type { PedidoRepository } from '../repositories/pedido.repository'
import type { PedidoItemRepository } from '../repositories/pedido-item.repository'
import { calcularTotaisPedidoComTaxa } from '../types/pedido-calculos.types'

export function recalcularTotaisPedido(
  pedidoId: string,
  repositorioPedido: PedidoRepository,
  repositorioItem: PedidoItemRepository,
): void {
  const pedido = repositorioPedido.buscarPorId(pedidoId)

  if (!pedido) {
    throw new Error('Pedido nao encontrado.')
  }

  const itens = repositorioItem.listarPorPedido(pedidoId, true)
  const subtotalCentavos = itens.reduce(
    (total, item) => total + item.subtotalCentavos,
    0,
  )
  const descontoItensCentavos = itens.reduce(
    (total, item) => total + item.descontoCentavos,
    0,
  )

  const {
    subtotalCentavos: subtotal,
    descontoItensCentavos: descontoItens,
    descontoPedidoCentavos: descontoPedido,
    totalCentavos,
    valorRestanteCentavos,
  } = calcularTotaisPedidoComTaxa(
    subtotalCentavos,
    descontoItensCentavos,
    pedido.descontoPedidoCentavos,
    pedido.taxaEntregaCentavos,
    pedido.valorPagoCentavos,
    pedido.valorCortesiaCentavos,
  )

  repositorioPedido.atualizarTotais({
    pedidoId,
    subtotalCentavos: subtotal,
    descontoItensCentavos: descontoItens,
    descontoPedidoCentavos: descontoPedido,
    totalCentavos,
    valorRestanteCentavos,
  })
}
