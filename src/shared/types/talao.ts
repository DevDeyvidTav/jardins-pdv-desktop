import type { Cliente } from './cliente'
import type { FormaPagamento } from './pagamento-pedido'

/**
 * Competencia sintetica para a visao consolidada do talao (todos os meses).
 * Baixas continuam exigindo uma competencia mensal real (YYYY-MM).
 */
export const COMPETENCIA_TODAS_MESES = 'TODAS'

export interface TalaoBaixa {
  id: string
  clienteId: string
  sessaoCaixaId: string
  formaPagamento: FormaPagamento
  valorCentavos: number
  valorRecebidoCentavos: number | null
  trocoCentavos: number
  competencia: string
  observacao: string | null
  criadoEm: string
  atualizadoEm: string
}

export interface LancamentoTalao {
  pagamentoId: string
  pedidoId: string
  pedidoReferencia: number
  tipoPedido: string
  valorCentavos: number
  competencia: string
  criadoEm: string
}

export interface ContaTalaoCliente {
  cliente: Cliente
  competencia: string
  totalLancadoCentavos: number
  totalBaixadoCentavos: number
  saldoCentavos: number
  lancamentos: LancamentoTalao[]
  baixas: TalaoBaixa[]
}

export interface ObterContaTalaoEntrada {
  clienteId: string
  /** YYYY-MM ou COMPETENCIA_TODAS_MESES para consolidar todos os meses. */
  competencia?: string
}

export interface ListarContasTalaoEntrada {
  competencia?: string
  apenasComSaldo?: boolean
}

export interface RegistrarBaixaTalaoEntrada {
  clienteId: string
  formaPagamento: FormaPagamento
  valorCentavos: number
  valorRecebidoCentavos?: number
  competencia?: string
  observacao?: string
}
