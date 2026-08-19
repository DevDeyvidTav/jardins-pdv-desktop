import type { Cliente } from './cliente'
import type { FormaPagamento } from './pagamento-pedido'

export interface TalaoBaixa {
  id: string
  clienteId: string
  sessaoCaixaId: string
  formaPagamento: FormaPagamento
  valorCentavos: number
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
  competencia?: string
  observacao?: string
}
