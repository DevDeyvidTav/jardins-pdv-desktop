export const TIPO_PEDIDO = {
  MESA: 'MESA',
  BALCAO: 'BALCAO',
} as const

export type TipoPedido = (typeof TIPO_PEDIDO)[keyof typeof TIPO_PEDIDO]

export const STATUS_PEDIDO = {
  ABERTO: 'ABERTO',
  FINALIZADO: 'FINALIZADO',
  CANCELADO: 'CANCELADO',
} as const

export type StatusPedido = (typeof STATUS_PEDIDO)[keyof typeof STATUS_PEDIDO]

export interface Pedido {
  id: string
  sessaoCaixaId: string
  mesaId: string | null
  tipo: TipoPedido
  status: StatusPedido
  subtotalCentavos: number
  descontoCentavos: number
  totalCentavos: number
  criadoEm: string
  atualizadoEm: string
  finalizadoEm: string | null
  canceladoEm: string | null
}

export interface PedidoItem {
  id: string
  pedidoId: string
  produtoId: string
  produtoNome: string
  quantidade: number
  precoUnitarioCentavos: number
  totalCentavos: number
  observacao: string | null
  criadoEm: string
  atualizadoEm: string
  canceladoEm: string | null
}

export interface ResumoPedido {
  pedido: Pedido
  itens: PedidoItem[]
}

export interface CriarPedidoMesaEntrada {
  mesaId: string
}

export interface ObterPedidoAbertoPorMesaEntrada {
  mesaId: string
}

export interface AdicionarItemPedidoEntrada {
  pedidoId: string
  produtoId: string
  quantidade: number
  observacao?: string
}

export interface AlterarQuantidadeItemPedidoEntrada {
  pedidoId: string
  itemId: string
  quantidade: number
}

export interface RemoverItemPedidoEntrada {
  pedidoId: string
  itemId: string
}

export interface ObterResumoPedidoEntrada {
  pedidoId: string
}

export interface CancelarPedidoEntrada {
  pedidoId: string
}
