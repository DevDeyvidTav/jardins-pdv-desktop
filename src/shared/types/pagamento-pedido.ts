export const FORMA_PAGAMENTO = {
  DINHEIRO: 'DINHEIRO',
  CARTAO_CREDITO: 'CARTAO_CREDITO',
  CARTAO_DEBITO: 'CARTAO_DEBITO',
  PIX_MAQUINETA: 'PIX_MAQUINETA',
  PIX_CNPJ: 'PIX_CNPJ',
  TALAO: 'TALAO',
  CORTESIA: 'CORTESIA',
} as const

export type FormaPagamento = (typeof FORMA_PAGAMENTO)[keyof typeof FORMA_PAGAMENTO]

export const FORMAS_PAGAMENTO_PEDIDO = [
  FORMA_PAGAMENTO.DINHEIRO,
  FORMA_PAGAMENTO.CARTAO_CREDITO,
  FORMA_PAGAMENTO.CARTAO_DEBITO,
  FORMA_PAGAMENTO.PIX_MAQUINETA,
  FORMA_PAGAMENTO.PIX_CNPJ,
  FORMA_PAGAMENTO.TALAO,
  FORMA_PAGAMENTO.CORTESIA,
] as const

export const FORMAS_PAGAMENTO_BAIXA_TALAO = [
  FORMA_PAGAMENTO.DINHEIRO,
  FORMA_PAGAMENTO.CARTAO_CREDITO,
  FORMA_PAGAMENTO.CARTAO_DEBITO,
  FORMA_PAGAMENTO.PIX_MAQUINETA,
  FORMA_PAGAMENTO.PIX_CNPJ,
] as const

export const ROTULOS_FORMA_PAGAMENTO: Record<FormaPagamento, string> = {
  [FORMA_PAGAMENTO.DINHEIRO]: 'Dinheiro',
  [FORMA_PAGAMENTO.CARTAO_CREDITO]: 'Cartão crédito',
  [FORMA_PAGAMENTO.CARTAO_DEBITO]: 'Cartão débito',
  [FORMA_PAGAMENTO.PIX_MAQUINETA]: 'Pix (maquineta)',
  [FORMA_PAGAMENTO.PIX_CNPJ]: 'Pix (CNPJ)',
  [FORMA_PAGAMENTO.TALAO]: 'Talão',
  [FORMA_PAGAMENTO.CORTESIA]: 'Cortesia',
}

export function totaisFormaPagamentoVazios(): Record<FormaPagamento, number> {
  return {
    [FORMA_PAGAMENTO.DINHEIRO]: 0,
    [FORMA_PAGAMENTO.CARTAO_CREDITO]: 0,
    [FORMA_PAGAMENTO.CARTAO_DEBITO]: 0,
    [FORMA_PAGAMENTO.PIX_MAQUINETA]: 0,
    [FORMA_PAGAMENTO.PIX_CNPJ]: 0,
    [FORMA_PAGAMENTO.TALAO]: 0,
    [FORMA_PAGAMENTO.CORTESIA]: 0,
  }
}

export function pagamentoEntraNoValorPago(forma: FormaPagamento): boolean {
  return forma !== FORMA_PAGAMENTO.CORTESIA
}

export function pagamentoEntraNoCaixa(forma: FormaPagamento): boolean {
  return (
    forma !== FORMA_PAGAMENTO.CORTESIA && forma !== FORMA_PAGAMENTO.TALAO
  )
}

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
  /** O que o cliente entregou. So preenchido em DINHEIRO. */
  valorRecebidoCentavos: number | null
  /** Troco entregue, arredondado para 5 centavos. So preenchido em DINHEIRO. */
  trocoCentavos: number
  status: StatusPagamentoPedido
  motivoCortesia?: string | null
  /** Parte da divisao de conta vinculada, se houver. */
  pedidoDivisaoParteId: string | null
  criadoEm: string
  atualizadoEm: string
  canceladoEm: string | null
}

export interface PagamentoInformado {
  formaPagamento: FormaPagamento
  valorCentavos: number
  /** Obrigatorio na pratica para DINHEIRO; se omitido, assume pagamento exato (sem troco). */
  valorRecebidoCentavos?: number
  /** Motivo obrigatorio quando formaPagamento for CORTESIA. */
  motivoCortesia?: string
}

export interface RegistrarPagamentoPedidoEntrada {
  pedidoId: string
  formaPagamento: FormaPagamento
  valorCentavos: number
  valorRecebidoCentavos?: number
  motivoCortesia?: string
  /** Quando informado, vincula o pagamento a uma parte da divisao. */
  pedidoDivisaoParteId?: string
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
