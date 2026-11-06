import type { Mesa, SequenciaMesas, TipoUsoMesa } from '@shared/types/mesa'
import { TIPO_USO_MESA } from '@shared/types/mesa'

function tipoUsoDe(mesa: Mesa): TipoUsoMesa {
  return mesa.tipoUso ?? TIPO_USO_MESA.COMUM
}

/** Agrupa mesas ativas em intervalos consecutivos do mesmo tipo de uso. */
export function agruparSequenciasMesas(mesas: Mesa[]): SequenciaMesas[] {
  const ordenadas = mesas
    .filter((mesa) => mesa.ativo)
    .slice()
    .sort((a, b) => a.numero - b.numero || tipoUsoDe(a).localeCompare(tipoUsoDe(b)))

  const sequencias: SequenciaMesas[] = []

  for (const mesa of ordenadas) {
    const tipoUso = tipoUsoDe(mesa)
    const atual = sequencias[sequencias.length - 1]

    if (
      atual &&
      atual.tipoUso === tipoUso &&
      mesa.numero === atual.numeroFinal + 1
    ) {
      atual.numeroFinal = mesa.numero
      atual.quantidade += 1
      atual.mesaIds.push(mesa.id)
      continue
    }

    sequencias.push({
      tipoUso,
      numeroInicial: mesa.numero,
      numeroFinal: mesa.numero,
      quantidade: 1,
      mesaIds: [mesa.id],
    })
  }

  return sequencias
}
