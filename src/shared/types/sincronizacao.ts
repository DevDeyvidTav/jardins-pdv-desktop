export const STATUS_SYNC_OUTBOX = {
  PENDENTE: 'PENDENTE',
  SINCRONIZADO: 'SINCRONIZADO',
} as const

export type StatusSyncOutbox = (typeof STATUS_SYNC_OUTBOX)[keyof typeof STATUS_SYNC_OUTBOX]

export const ENTIDADE_SYNC = {
  PEDIDO: 'PEDIDO',
  SESSAO_CAIXA: 'SESSAO_CAIXA',
  MOVIMENTO_CAIXA: 'MOVIMENTO_CAIXA',
  CATEGORIA_PRODUTO: 'CATEGORIA_PRODUTO',
  PRODUTO: 'PRODUTO',
  MESA: 'MESA',
  CLIENTE: 'CLIENTE',
  TALAO_BAIXA: 'TALAO_BAIXA',
  PIZZA_CATEGORIA: 'PIZZA_CATEGORIA',
  PIZZA_TAMANHO: 'PIZZA_TAMANHO',
  PIZZA_SABOR: 'PIZZA_SABOR',
  PIZZA_CATEGORIA_SABOR: 'PIZZA_CATEGORIA_SABOR',
  PIZZA_SABOR_PRECO: 'PIZZA_SABOR_PRECO',
} as const

export type EntidadeSync = (typeof ENTIDADE_SYNC)[keyof typeof ENTIDADE_SYNC]

export const OPERACAO_SYNC = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  CANCEL: 'CANCEL',
} as const

export type OperacaoSync = (typeof OPERACAO_SYNC)[keyof typeof OPERACAO_SYNC]

export interface EstadoSincronizacao {
  pendente: number
  sincronizado: number
  apiConfigurada: boolean
  ultimaTentativaEm: string | null
  ultimoSucessoEm: string | null
  ultimoErro: string | null
}
