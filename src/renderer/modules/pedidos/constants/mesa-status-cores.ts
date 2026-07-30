import { STATUS_MESA, type StatusMesa } from '@shared/types/mesa'

/** Filtros disponiveis na barra inferior da grade (espelho do Swfast). */
export const FILTROS_STATUS_MESA = {
  TODAS: 'TODAS',
  LIVRE: STATUS_MESA.LIVRE,
  OCUPADA: STATUS_MESA.OCUPADA,
  INATIVA: STATUS_MESA.INATIVA,
} as const

export type FiltroStatusMesa =
  (typeof FILTROS_STATUS_MESA)[keyof typeof FILTROS_STATUS_MESA]

export const ROTULOS_FILTRO_STATUS_MESA: Record<FiltroStatusMesa, string> = {
  [FILTROS_STATUS_MESA.TODAS]: 'Todas',
  [FILTROS_STATUS_MESA.LIVRE]: 'Livres',
  [FILTROS_STATUS_MESA.OCUPADA]: 'Ocupadas',
  [FILTROS_STATUS_MESA.INATIVA]: 'Inativas',
}

export const ROTULOS_STATUS_MESA: Record<StatusMesa, string> = {
  [STATUS_MESA.LIVRE]: 'Livre',
  [STATUS_MESA.OCUPADA]: 'Ocupada',
  [STATUS_MESA.INATIVA]: 'Inativa',
}

export function obterClasseStatusMesa(status: StatusMesa, ativo: boolean): string {
  if (!ativo || status === STATUS_MESA.INATIVA) {
    return 'grade-mesas__celula--inativa'
  }

  if (status === STATUS_MESA.OCUPADA) {
    return 'grade-mesas__celula--ocupada'
  }

  return 'grade-mesas__celula--livre'
}

export function mesaPassaNoFiltro(
  status: StatusMesa,
  ativo: boolean,
  filtro: FiltroStatusMesa,
): boolean {
  if (filtro === FILTROS_STATUS_MESA.TODAS) {
    return true
  }

  if (filtro === FILTROS_STATUS_MESA.INATIVA) {
    return !ativo || status === STATUS_MESA.INATIVA
  }

  return ativo && status === filtro
}
