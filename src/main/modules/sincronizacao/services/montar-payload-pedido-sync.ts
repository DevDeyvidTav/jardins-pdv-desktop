import type { ConexaoSqlite } from '../../../database/conexao-sqlite'
import type { Pedido, PedidoItem } from '@shared/types/pedido'
import { criarPedidoRepository } from '../../pedidos/repositories/pedido.repository'
import { criarPedidoItemRepository } from '../../pedidos/repositories/pedido-item.repository'
import { CODIGOS_ERRO_PEDIDOS, ErroPedidos } from '../../pedidos/errors/erros-pedidos'

function serializarPedido(pedido: Pedido): Record<string, unknown> {
  return {
    id: pedido.id,
    referencia: pedido.referencia,
    sessaoCaixaId: pedido.sessaoCaixaId,
    mesaId: pedido.mesaId,
    clienteId: pedido.clienteId,
    mesaAgrupamentoId: pedido.mesaAgrupamentoId,
    tipo: pedido.tipo,
    status: pedido.status,
    subtotalCentavos: pedido.subtotalCentavos,
    descontoItensCentavos: pedido.descontoItensCentavos,
    descontoPedidoCentavos: pedido.descontoPedidoCentavos,
    taxaEntregaCentavos: pedido.taxaEntregaCentavos,
    totalCentavos: pedido.totalCentavos,
    valorPagoCentavos: pedido.valorPagoCentavos,
    valorCortesiaCentavos: pedido.valorCortesiaCentavos,
    valorRestanteCentavos: pedido.valorRestanteCentavos,
    criadoEm: pedido.criadoEm,
    atualizadoEm: pedido.atualizadoEm,
    finalizadoEm: pedido.finalizadoEm,
    canceladoEm: pedido.canceladoEm,
    motivoCancelamento: pedido.motivoCancelamento,
    version: 1,
  }
}

function serializarItem(item: PedidoItem): Record<string, unknown> {
  return {
    id: item.id,
    pedidoId: item.pedidoId,
    produtoId: item.produtoId,
    tipo: item.tipo,
    produtoNome: item.produtoNome,
    quantidade: item.quantidade,
    precoUnitarioCentavos: item.precoUnitarioCentavos,
    subtotalCentavos: item.subtotalCentavos,
    descontoCentavos: item.descontoCentavos,
    totalCentavos: item.totalCentavos,
    observacao: item.observacao,
    criadoEm: item.criadoEm,
    atualizadoEm: item.atualizadoEm,
    canceladoEm: item.canceladoEm,
    motivoCancelamento: item.motivoCancelamento,
  }
}

export function montarPayloadPedidoSync(
  pedidoId: string,
  conexao?: ConexaoSqlite,
): Record<string, unknown> {
  const repositorioPedido = conexao
    ? criarPedidoRepository(conexao)
    : criarPedidoRepository()
  const repositorioItem = conexao
    ? criarPedidoItemRepository(conexao)
    : criarPedidoItemRepository()

  const pedido = repositorioPedido.buscarPorId(pedidoId)
  if (!pedido) {
    throw new ErroPedidos(
      CODIGOS_ERRO_PEDIDOS.PEDIDO_NAO_ENCONTRADO,
      'Pedido nao encontrado para montar payload de sincronizacao.',
    )
  }

  const itens = repositorioItem.listarPorPedido(pedidoId, false)

  return {
    pedido: serializarPedido(pedido),
    itens: itens.map(serializarItem),
  }
}
