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
  sessao_caixa_id: string
  mesa_id: string | null
  tipo: string
  status: string
  subtotal_centavos: number
  desconto_centavos: number
  total_centavos: number
  criado_em: string
  atualizado_em: string
  finalizado_em: string | null
  cancelado_em: string | null
}

export interface LinhaPedidoItemSql {
  id: string
  pedido_id: string
  produto_id: string
  produto_nome: string
  quantidade: number
  preco_unitario_centavos: number
  total_centavos: number
  observacao: string | null
  criado_em: string
  atualizado_em: string
  cancelado_em: string | null
}

const COLUNAS_PEDIDO = `
  id, sessao_caixa_id, mesa_id, tipo, status,
  subtotal_centavos, desconto_centavos, total_centavos,
  criado_em, atualizado_em, finalizado_em, cancelado_em
`.trim()

const COLUNAS_PEDIDO_ITEM = `
  id, pedido_id, produto_id, produto_nome, quantidade,
  preco_unitario_centavos, total_centavos, observacao,
  criado_em, atualizado_em, cancelado_em
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
    sessaoCaixaId: linha.sessao_caixa_id,
    mesaId: linha.mesa_id,
    tipo: linha.tipo as import('@shared/types/pedido').TipoPedido,
    status: linha.status as import('@shared/types/pedido').StatusPedido,
    subtotalCentavos: linha.subtotal_centavos,
    descontoCentavos: linha.desconto_centavos,
    totalCentavos: linha.total_centavos,
    criadoEm: linha.criado_em,
    atualizadoEm: linha.atualizado_em,
    finalizadoEm: linha.finalizado_em,
    canceladoEm: linha.cancelado_em,
  }
}

export function mapearLinhaPedidoItem(
  linha: LinhaPedidoItemSql,
): import('@shared/types/pedido').PedidoItem {
  return {
    id: linha.id,
    pedidoId: linha.pedido_id,
    produtoId: linha.produto_id,
    produtoNome: linha.produto_nome,
    quantidade: linha.quantidade,
    precoUnitarioCentavos: linha.preco_unitario_centavos,
    totalCentavos: linha.total_centavos,
    observacao: linha.observacao,
    criadoEm: linha.criado_em,
    atualizadoEm: linha.atualizado_em,
    canceladoEm: linha.cancelado_em,
  }
}
