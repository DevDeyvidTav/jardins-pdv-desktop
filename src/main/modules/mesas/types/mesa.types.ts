export type { Mesa, StatusMesa, TipoUsoMesa } from '@shared/types/mesa'
export { STATUS_MESA, TIPO_USO_MESA } from '@shared/types/mesa'

export interface LinhaMesaSql {
  id: string
  numero: number
  nome: string
  status: string
  tipo_uso: string
  ativo: number
  criado_em: string
  atualizado_em: string
}

const COLUNAS_MESA = `id, numero, nome, status, tipo_uso, ativo, criado_em, atualizado_em`

export function obterColunasMesa(): string {
  return COLUNAS_MESA
}

function normalizarTipoUso(valor: string | null | undefined): import('@shared/types/mesa').TipoUsoMesa {
  if (valor === 'BALCAO' || valor === 'DELIVERY' || valor === 'COMUM') {
    return valor
  }
  return 'COMUM'
}

export function mapearLinhaMesa(
  linha: LinhaMesaSql,
): import('@shared/types/mesa').Mesa {
  return {
    id: linha.id,
    numero: linha.numero,
    nome: linha.nome,
    status: linha.status as import('@shared/types/mesa').StatusMesa,
    tipoUso: normalizarTipoUso(linha.tipo_uso),
    ativo: linha.ativo === 1,
    criadoEm: linha.criado_em,
    atualizadoEm: linha.atualizado_em,
  }
}
