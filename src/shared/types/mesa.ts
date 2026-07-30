export const STATUS_MESA = {
  LIVRE: 'LIVRE',
  OCUPADA: 'OCUPADA',
  INATIVA: 'INATIVA',
} as const

export type StatusMesa = (typeof STATUS_MESA)[keyof typeof STATUS_MESA]

export interface Mesa {
  id: string
  numero: number
  nome: string
  status: StatusMesa
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
}

export interface CriarMesasPorIntervaloEntrada {
  numeroInicial: number
  numeroFinal: number
}

export interface AtualizarMesaEntrada {
  mesaId: string
  numero?: number
  nome?: string
}

export interface InativarMesaEntrada {
  mesaId: string
}
