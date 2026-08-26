import type { ConexaoSqlite } from '../../../database/conexao-sqlite'
import type { Pedido, PedidoItem } from '@shared/types/pedido'
import type { PagamentoPedido } from '@shared/types/pagamento-pedido'
import type { PizzaPedidoItemResumo } from '@shared/types/pizza'
import type { PedidoEntrega } from '@shared/types/pedido'
import { TIPO_PEDIDO_ITEM } from '@shared/types/pizza'
import { criarPedidoRepository } from '../../pedidos/repositories/pedido.repository'
import { criarPedidoItemRepository } from '../../pedidos/repositories/pedido-item.repository'
import { criarPagamentoPedidoRepository } from '../../pagamentos/repositories/pagamento-pedido.repository'
import { criarPizzaPedidoItemRepository } from '../../pizzas/repositories/pizza-pedido-item.repository'
import { criarPedidoEntregaRepository } from '../../delivery/repositories/pedido-entrega.repository'
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

function serializarPagamento(pagamento: PagamentoPedido): Record<string, unknown> {
  return {
    id: pagamento.id,
    pedidoId: pagamento.pedidoId,
    sessaoCaixaId: pagamento.sessaoCaixaId,
    formaPagamento: pagamento.formaPagamento,
    valorCentavos: pagamento.valorCentavos,
    valorRecebidoCentavos: pagamento.valorRecebidoCentavos,
    trocoCentavos: pagamento.trocoCentavos,
    status: pagamento.status,
    motivoCortesia: pagamento.motivoCortesia ?? null,
    pedidoDivisaoParteId: pagamento.pedidoDivisaoParteId,
    criadoEm: pagamento.criadoEm,
    atualizadoEm: pagamento.atualizadoEm,
    canceladoEm: pagamento.canceladoEm,
  }
}

function serializarPizza(pizza: PizzaPedidoItemResumo): Record<string, unknown> {
  return {
    id: pizza.id,
    pedidoItemId: pizza.pedidoItemId,
    pizzaCategoriaId: pizza.pizzaCategoriaId,
    pizzaTamanhoId: pizza.pizzaTamanhoId,
    regraPrecificacaoSnapshot: pizza.regraPrecificacaoSnapshot,
    valorCalculadoCentavos: pizza.valorCalculadoCentavos,
    observacao: pizza.observacao,
    categoriaNomeSnapshot: pizza.categoriaNomeSnapshot,
    tamanhoNomeSnapshot: pizza.tamanhoNomeSnapshot,
    sabores: pizza.sabores.map((sabor) => ({
      id: sabor.id,
      pizzaPedidoItemId: pizza.id,
      pizzaSaborId: sabor.pizzaSaborId,
      saborNomeSnapshot: sabor.saborNomeSnapshot,
      valorSaborSnapshotCentavos: sabor.valorSaborSnapshotCentavos,
      ordem: sabor.ordem,
    })),
  }
}

function serializarEntrega(entrega: PedidoEntrega): Record<string, unknown> {
  return {
    id: entrega.id,
    pedidoId: entrega.pedidoId,
    clienteNome: entrega.clienteNome,
    telefone: entrega.telefone,
    endereco: entrega.endereco,
    observacao: entrega.observacao,
    status: entrega.status,
    saiuParaEntregaEm: entrega.saiuParaEntregaEm,
    entregueEm: entrega.entregueEm,
    canceladoEm: entrega.canceladoEm,
    motivoCancelamento: entrega.motivoCancelamento,
    criadoEm: entrega.criadoEm,
    atualizadoEm: entrega.atualizadoEm,
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
  const repositorioPagamento = conexao
    ? criarPagamentoPedidoRepository(conexao)
    : criarPagamentoPedidoRepository()
  const repositorioPizza = conexao
    ? criarPizzaPedidoItemRepository(conexao)
    : criarPizzaPedidoItemRepository()
  const repositorioEntrega = conexao
    ? criarPedidoEntregaRepository(conexao)
    : criarPedidoEntregaRepository()

  const pedido = repositorioPedido.buscarPorId(pedidoId)
  if (!pedido) {
    throw new ErroPedidos(
      CODIGOS_ERRO_PEDIDOS.PEDIDO_NAO_ENCONTRADO,
      'Pedido nao encontrado para montar payload de sincronizacao.',
    )
  }

  const itens = repositorioItem.listarPorPedido(pedidoId, false)
  const pagamentos = repositorioPagamento.listarPorPedido(pedidoId)
  const idsPizza = itens
    .filter((item) => item.tipo === TIPO_PEDIDO_ITEM.PIZZA)
    .map((item) => item.id)
  const pizzas = [...repositorioPizza.listarPorPedidoItemIds(idsPizza).values()]
  const entrega = repositorioEntrega.buscarPorPedidoId(pedidoId)

  return {
    pedido: serializarPedido(pedido),
    itens: itens.map(serializarItem),
    pagamentos: pagamentos.map(serializarPagamento),
    pizzas: pizzas.map(serializarPizza),
    entrega: entrega ? serializarEntrega(entrega) : null,
  }
}
