import type {
  ListarPagamentosPedidoEntrada,
  PagamentoPedido,
  ResumoPagamentoPedido,
} from '@shared/types/pagamento-pedido'
import { CODIGOS_ERRO_PEDIDOS, ErroPedidos } from '../../pedidos/errors/erros-pedidos'
import { criarPedidoRepository, type PedidoRepository } from '../../pedidos/repositories/pedido.repository'
import {
  criarPagamentoPedidoRepository,
  type PagamentoPedidoRepository,
} from '../repositories/pagamento-pedido.repository'

export function criarListarPagamentosPedido(
  repositorioPagamento: PagamentoPedidoRepository = criarPagamentoPedidoRepository(),
) {
  return function listarPagamentosPedido(
    entrada: ListarPagamentosPedidoEntrada,
  ): PagamentoPedido[] {
    return repositorioPagamento.listarPorPedido(entrada.pedidoId)
  }
}

export function criarObterResumoPagamentoPedido(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioPagamento: PagamentoPedidoRepository = criarPagamentoPedidoRepository(),
) {
  return function obterResumoPagamentoPedido(
    entrada: ListarPagamentosPedidoEntrada,
  ): ResumoPagamentoPedido {
    const pedido = repositorioPedido.buscarPorId(entrada.pedidoId)
    if (!pedido) {
      throw new ErroPedidos(CODIGOS_ERRO_PEDIDOS.PEDIDO_NAO_ENCONTRADO, 'Pedido nao encontrado.')
    }
    const pagamentos = repositorioPagamento.listarPorPedido(pedido.id)
    const totalPagoCentavos = pagamentos
      .filter((pagamento) => pagamento.status === 'CONFIRMADO' && !pagamento.canceladoEm)
      .reduce((total, pagamento) => total + pagamento.valorCentavos, 0)
    return {
      pedidoId: pedido.id,
      totalPedidoCentavos: pedido.totalCentavos,
      totalPagoCentavos,
      valorRestanteCentavos: pedido.totalCentavos - totalPagoCentavos,
      pagamentos,
    }
  }
}

export const listarPagamentosPedido = criarListarPagamentosPedido()
export const obterResumoPagamentoPedido = criarObterResumoPagamentoPedido()
