import type {
  ItemHistoricoPedido,
  ListarHistoricoPedidosEntrada,
} from '@shared/types/pedido'
import { FILTRO_STATUS_HISTORICO_PEDIDO } from '@shared/types/pedido'
import type { FormaPagamento } from '@shared/types/pagamento-pedido'
import {
  criarPedidoRepository,
  type PedidoRepository,
} from '../repositories/pedido.repository'

export function criarListarHistoricoPedidos(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
) {
  return function listarHistoricoPedidos(
    entrada: ListarHistoricoPedidosEntrada = {},
  ): ItemHistoricoPedido[] {
    const status = entrada.status ?? FILTRO_STATUS_HISTORICO_PEDIDO.TODOS
    const formaPagamento = entrada.formaPagamento ?? ''

    return repositorioPedido.listarHistorico({
      status,
      formaPagamento,
    }).map((item) => ({
      pedido: item.pedido,
      mesaNumero: item.mesaNumero,
      formasPagamento: item.formasPagamento as FormaPagamento[],
      totalPagoCentavos: item.totalPagoCentavos,
    }))
  }
}

export const listarHistoricoPedidos = criarListarHistoricoPedidos()
