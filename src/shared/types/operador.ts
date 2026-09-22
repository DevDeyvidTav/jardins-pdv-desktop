export const TAMANHO_PIN_OPERADOR = 6

export const PERFIL_OPERADOR = {
  ADMIN: 'ADMIN',
  OPERADOR: 'OPERADOR',
} as const

export type PerfilOperador = (typeof PERFIL_OPERADOR)[keyof typeof PERFIL_OPERADOR]

export const PERMISSAO_PDV = {
  CONFIGURACOES: 'CONFIGURACOES',
  TAXA_ENTREGA_PADRAO: 'TAXA_ENTREGA_PADRAO',
  FISCAL_PRODUTO: 'FISCAL_PRODUTO',
  CATALOGO_PIZZA: 'CATALOGO_PIZZA',
} as const

export type PermissaoPdv = (typeof PERMISSAO_PDV)[keyof typeof PERMISSAO_PDV]

export interface OperadorConfig {
  operadorId: string
  operadorNome: string
  perfil: PerfilOperador
}

export interface OperadorResumo {
  operadorId: string
  operadorNome: string
  perfil: PerfilOperador
}

/** Dados expostos na tela de login (sem perfil). */
export interface OperadorEntradaResumo {
  operadorId: string
  operadorNome: string
}

export interface SalvarOperadorEntrada {
  operadorId: string
  pin: string
}

export interface AutenticarOperadorEntrada {
  operadorNome: string
  pin: string
}
