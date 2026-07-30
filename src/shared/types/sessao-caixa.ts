export const STATUS_SESSAO_CAIXA = {
  ABERTO: 'ABERTO',
  FECHADO: 'FECHADO',
  CANCELADO: 'CANCELADO',
} as const

export type StatusSessaoCaixa =
  (typeof STATUS_SESSAO_CAIXA)[keyof typeof STATUS_SESSAO_CAIXA]

export interface SessaoCaixa {
  id: string
  operadorId: string
  operadorNome: string
  saldoInicialCentavos: number
  status: StatusSessaoCaixa
  abertoEm: string
  fechadoEm: string | null
  criadoEm: string
  atualizadoEm: string
}

export interface AbrirSessaoCaixaEntrada {
  operadorId: string
  operadorNome: string
  saldoInicialCentavos: number
}
