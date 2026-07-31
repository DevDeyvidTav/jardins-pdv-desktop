export const FORMA_PAGAMENTO = {
  DINHEIRO: 'DINHEIRO',
  CARTAO_CREDITO: 'CARTAO_CREDITO',
  CARTAO_DEBITO: 'CARTAO_DEBITO',
  PIX: 'PIX',
  CORTESIA: 'CORTESIA',
} as const

export type FormaPagamento = (typeof FORMA_PAGAMENTO)[keyof typeof FORMA_PAGAMENTO]

export const STATUS_PAGAMENTO_PEDIDO = {
  CONFIRMADO: 'CONFIRMADO',
  CANCELADO: 'CANCELADO',
} as const

export type StatusPagamentoPedido =
  (typeof STATUS_PAGAMENTO_PEDIDO)[keyof typeof STATUS_PAGAMENTO_PEDIDO]

export interface PagamentoPedido {
  id: string
  pedidoId: string
  sessaoCaixaId: string
  formaPagamento: FormaPagamento
  valorCentavos: number
  status: StatusPagamentoPedido
  motivoCortesia?: string | null
  criadoEm: string
  atualizadoEm: string
  canceladoEm: string | null
}

export interface PagamentoInformado {
  formaPagamento: FormaPagamento
  valorCentavos: number
  /** Motivo obrigatorio quando formaPagamento for CORTESIA. */
  motivoCortesia?: string
}

export interface RegistrarPagamentoPedidoEntrada {
  pedidoId: string
  formaPagamento: FormaPagamento
  valorCentavos: number
  motivoCortesia?: string
}

export interface ListarPagamentosPedidoEntrada {
  pedidoId: string
}

export interface ResumoPagamentoPedido {
  pedidoId: string
  totalPedidoCentavos: number
  totalPagoCentavos: number
  valorRestanteCentavos: number
  pagamentos: PagamentoPedido[]
}
