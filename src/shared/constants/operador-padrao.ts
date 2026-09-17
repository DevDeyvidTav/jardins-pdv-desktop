import type { PerfilOperador } from '../types/operador'

export interface OperadorPadraoSeed {
  id: string
  nome: string
  pin: string
  perfil: PerfilOperador
}

/** Usuarios criados na primeira inicializacao do terminal. */
export const OPERADORES_PADRAO: readonly OperadorPadraoSeed[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    nome: 'Passira',
    pin: '147147',
    perfil: 'OPERADOR',
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    nome: 'Welida',
    pin: '258258',
    perfil: 'OPERADOR',
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    nome: 'Nathalia',
    pin: '369369',
    perfil: 'ADMIN',
  },
] as const

/** @deprecated Use OPERADORES_PADRAO */
export const OPERADOR_PADRAO_NOME = OPERADORES_PADRAO[0].nome

/** @deprecated Use OPERADORES_PADRAO */
export const OPERADOR_PADRAO_PIN = OPERADORES_PADRAO[0].pin
