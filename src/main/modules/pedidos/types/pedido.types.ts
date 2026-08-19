import { TIPO_PEDIDO_ITEM } from '@shared/types/pizza'

export type {
  Pedido,
  PedidoItem,
  ResumoPedido,
  StatusPedido,
  TipoPedido,
} from '@shared/types/pedido'
export { STATUS_PEDIDO, TIPO_PEDIDO } from '@shared/types/pedido'

export interface LinhaPedidoSql {
  id: string
  referencia: number | null
  sessao_caixa_id: string
  mesa_id: string | null
  cliente_id: string | null
  mesa_agrupamento_id: string | null
  tipo: string
  status: string
  subtotal_centavos: number
  /** Coluna legada usada apenas para popular desconto_pedido_centavos na migracao. */
  desconto_centavos: number
  total_centavos: number
  desconto_itens_centavos: number
  desconto_pedido_centavos: number
  taxa_entrega_centavos: number
  valor_pago_centavos: number
  valor_cortesia_centavos: number
  valor_restante_centavos: number
  criado_em: string
  atualizado_em: string
  finalizado_em: string | null
  cancelado_em: string | null
  motivo_cancelamento: string | null
}

export interface LinhaPedidoItemSql {
  id: string
  pedido_id: string
  produto_id: string | null
  tipo: string | null
  produto_nome: string
  quantidade: number
  preco_unitario_centavos: number
  subtotal_centavos: number
  desconto_centavos: number
  total_centavos: number
  observacao: string | null
  criado_em: string
  atualizado_em: string
  cancelado_em: string | null
  motivo_cancelamento: string | null
}

const COLUNAS_PEDIDO = `
  id, referencia, sessao_caixa_id, mesa_id, cliente_id,
  mesa_agrupamento_id,
  tipo, status,
  subtotal_centavos, desconto_centavos, total_centavos,
  desconto_itens_centavos, desconto_pedido_centavos,
  COALESCE(taxa_entrega_centavos, 0) AS taxa_entrega_centavos,
  valor_pago_centavos, valor_cortesia_centavos, valor_restante_centavos,
  criado_em, atualizado_em, finalizado_em, cancelado_em, motivo_cancelamento
`.trim()

const COLUNAS_PEDIDO_ITEM = `
  id, pedido_id, produto_id, tipo, produto_nome, quantidade,
  preco_unitario_centavos, subtotal_centavos, desconto_centavos,
  total_centavos, observacao, criado_em, atualizado_em, cancelado_em,
  motivo_cancelamento
`.trim()

export function obterColunasPedido(): string {
  return COLUNAS_PEDIDO
}

export function obterColunasPedidoItem(): string {
  return COLUNAS_PEDIDO_ITEM
}

export function mapearLinhaPedido(
  linha: LinhaPedidoSql,
): import('@shared/types/pedido').Pedido {
  return {
    id: linha.id,
    referencia: Number(linha.referencia) || 0,
    sessaoCaixaId: linha.sessao_caixa_id,
    mesaId: linha.mesa_id,
    clienteId: linha.cliente_id ?? null,
    mesaAgrupamentoId: linha.mesa_agrupamento_id ?? null,
    tipo: linha.tipo as import('@shared/types/pedido').TipoPedido,
    status: linha.status as import('@shared/types/pedido').StatusPedido,
    subtotalCentavos: Number(linha.subtotal_centavos) || 0,
    // Mantem campo legado como alias para o desconto geral.
    descontoCentavos:
      Number(linha.desconto_pedido_centavos ?? linha.desconto_centavos) || 0,
    descontoItensCentavos: Number(linha.desconto_itens_centavos) || 0,
    descontoPedidoCentavos: Number(linha.desconto_pedido_centavos) || 0,
    taxaEntregaCentavos: Number(linha.taxa_entrega_centavos) || 0,
    totalCentavos: Number(linha.total_centavos) || 0,
    valorPagoCentavos: Number(linha.valor_pago_centavos) || 0,
    valorCortesiaCentavos: Number(linha.valor_cortesia_centavos) || 0,
    valorRestanteCentavos: Number(linha.valor_restante_centavos) || 0,
    criadoEm: linha.criado_em,
    atualizadoEm: linha.atualizado_em,
    finalizadoEm: linha.finalizado_em,
    canceladoEm: linha.cancelado_em,
    motivoCancelamento: linha.motivo_cancelamento ?? null,
  }
}

export function mapearLinhaPedidoItem(
  linha: LinhaPedidoItemSql,
): import('@shared/types/pedido').PedidoItem {
  return {
    id: linha.id,
    pedidoId: linha.pedido_id,
    produtoId: linha.produto_id,
    tipo:
      (linha.tipo as import('@shared/types/pizza').TipoPedidoItem | null) ??
      TIPO_PEDIDO_ITEM.PRODUTO,
    produtoNome: linha.produto_nome,
    quantidade: linha.quantidade,
    precoUnitarioCentavos: linha.preco_unitario_centavos,
    subtotalCentavos: Number(linha.subtotal_centavos) || 0,
    descontoCentavos: Number(linha.desconto_centavos) || 0,
    totalCentavos: Number(linha.total_centavos) || 0,
    observacao: linha.observacao,
    criadoEm: linha.criado_em,
    atualizadoEm: linha.atualizado_em,
    canceladoEm: linha.cancelado_em,
    motivoCancelamento: linha.motivo_cancelamento ?? null,
    pizza: null,
  }
}
