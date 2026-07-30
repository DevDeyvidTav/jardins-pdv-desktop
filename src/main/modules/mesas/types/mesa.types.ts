export type { Mesa, StatusMesa } from '@shared/types/mesa'
export { STATUS_MESA } from '@shared/types/mesa'

export interface LinhaMesaSql {
  id: string
  numero: number
  nome: string
  status: string
  ativo: number
  criado_em: string
  atualizado_em: string
}

const COLUNAS_MESA = `id, numero, nome, status, ativo, criado_em, atualizado_em`

export function obterColunasMesa(): string {
  return COLUNAS_MESA
}

export function mapearLinhaMesa(
  linha: LinhaMesaSql,
): import('@shared/types/mesa').Mesa {
  return {
    id: linha.id,
    numero: linha.numero,
    nome: linha.nome,
    status: linha.status as import('@shared/types/mesa').StatusMesa,
    ativo: linha.ativo === 1,
    criadoEm: linha.criado_em,
    atualizadoEm: linha.atualizado_em,
  }
}
