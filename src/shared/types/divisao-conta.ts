export const STATUS_DIVISAO_CONTA = {
  ATIVA: 'ATIVA',
  QUITADA: 'QUITADA',
  CANCELADA: 'CANCELADA',
} as const

export type StatusDivisaoConta =
  (typeof STATUS_DIVISAO_CONTA)[keyof typeof STATUS_DIVISAO_CONTA]

export const STATUS_PARTE_DIVISAO = {
  PENDENTE: 'PENDENTE',
  PARCIALMENTE_PAGA: 'PARCIALMENTE_PAGA',
  QUITADA: 'QUITADA',
} as const

export type StatusParteDivisao =
  (typeof STATUS_PARTE_DIVISAO)[keyof typeof STATUS_PARTE_DIVISAO]

export const TIPO_MOVIMENTACAO_DIVISAO = {
  DIVISAO_CRIADA: 'DIVISAO_CRIADA',
  PARTE_CRIADA: 'PARTE_CRIADA',
  PAGAMENTO_VINCULADO_A_PARTE: 'PAGAMENTO_VINCULADO_A_PARTE',
  PARTE_ATUALIZADA_PARA_PARCIALMENTE_PAGA: 'PARTE_ATUALIZADA_PARA_PARCIALMENTE_PAGA',
  PARTE_QUITADA: 'PARTE_QUITADA',
  DIVISAO_QUITADA: 'DIVISAO_QUITADA',
  DIVISAO_CANCELADA: 'DIVISAO_CANCELADA',
} as const

export type TipoMovimentacaoDivisao =
  (typeof TIPO_MOVIMENTACAO_DIVISAO)[keyof typeof TIPO_MOVIMENTACAO_DIVISAO]

export interface PedidoDivisaoConta {
  id: string
  pedidoId: string
  status: StatusDivisaoConta
  valorTotalCentavos: number
  criadoEm: string
  atualizadoEm: string
  canceladoEm: string | null
  motivoCancelamento: string | null
}

export interface PedidoDivisaoParte {
  id: string
  pedidoDivisaoContaId: string
  identificacao: string
  valorDefinidoCentavos: number
  status: StatusParteDivisao
  criadoEm: string
  atualizadoEm: string
  quitadoEm: string | null
}

export interface PedidoDivisaoMovimentacao {
  id: string
  pedidoId: string
  pedidoDivisaoContaId: string
  pedidoDivisaoParteId: string | null
  tipo: TipoMovimentacaoDivisao
  dadosAntesJson: string
  dadosDepoisJson: string
  motivo: string | null
  operadorId: string | null
  criadoEm: string
}

export interface CriarParteDivisaoEntrada {
  identificacao: string
  valorDefinidoCentavos: number
}

export interface CriarDivisaoContaEntrada {
  pedidoId: string
  partes: CriarParteDivisaoEntrada[]
}

export interface ObterResumoDivisaoContaEntrada {
  pedidoId: string
}

export interface RegistrarPagamentoParteDivisaoEntrada {
  pedidoId: string
  parteId: string
  /** Forma de pagamento do dominio (DINHEIRO, PIX, etc.). */
  formaPagamento: import('./pagamento-pedido').FormaPagamento
  valorCentavos: number
  valorRecebidoCentavos?: number
  motivoCortesia?: string
  fiscalSolicitado?: boolean
  fiscalCpfDestinatario?: string | null
}

export interface CancelarDivisaoContaEntrada {
  pedidoId: string
  motivo?: string
}

export interface ListarHistoricoDivisaoContaEntrada {
  pedidoId: string
}

export interface PagamentoParteResumo {
  id: string
  formaPagamento: string
  valorCentavos: number
  valorRecebidoCentavos: number | null
  trocoCentavos: number
  criadoEm: string
  motivoCortesia?: string | null
}

export interface ParteDivisaoResumo {
  id: string
  identificacao: string
  valorDefinidoCentavos: number
  valorPagoCentavos: number
  valorRestanteCentavos: number
  status: StatusParteDivisao
  pagamentos: PagamentoParteResumo[]
}

export interface ResumoDivisaoConta {
  divisao: {
    id: string
    pedidoId: string
    status: StatusDivisaoConta
    valorTotalCentavos: number
    criadoEm: string
    canceladoEm: string | null
  }
  partes: ParteDivisaoResumo[]
  totais: {
    valorPedidoCentavos: number
    valorPagoCentavos: number
    valorRestanteCentavos: number
  }
}
