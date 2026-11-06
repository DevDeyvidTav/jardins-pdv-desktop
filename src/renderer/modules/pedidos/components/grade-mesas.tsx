import type { Mesa } from '@shared/types/mesa'
import { TIPO_USO_MESA } from '@shared/types/mesa'
import {
  obterClasseStatusMesa,
  type FiltroStatusMesa,
  mesaPassaNoFiltro,
} from '../constants/mesa-status-cores'

interface GradeMesasProps {
  mesas: Mesa[]
  mesaSelecionadaId: string | null
  filtroStatus: FiltroStatusMesa
  onSelecionar: (mesa: Mesa) => void
}

function IconeBalcao() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden fill="currentColor">
      <path d="M4 4h16v2H4V4zm1 4h14l-1 10H6L5 8zm3 2v6h2v-6H8zm4 0v6h2v-6h-2z" />
    </svg>
  )
}

function IconeDelivery() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden fill="currentColor">
      <path d="M19.15 8.15a1.5 1.5 0 0 0-1.1-.48H15V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v9a1 1 0 0 0 1 1h1.18a2.5 2.5 0 0 0 4.64 0h5.36a2.5 2.5 0 0 0 4.64 0H21a1 1 0 0 0 1-1v-3.17a3 3 0 0 0-.85-2.05l-2-2.03ZM6.5 16.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm10 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2ZM15 9.67h2.67L19.5 11.5H15V9.67Z" />
    </svg>
  )
}

function rotuloTipo(mesa: Mesa): string {
  const tipo = mesa.tipoUso ?? TIPO_USO_MESA.COMUM
  if (tipo === TIPO_USO_MESA.BALCAO) {
    return 'Balcao'
  }
  if (tipo === TIPO_USO_MESA.DELIVERY) {
    return 'Delivery'
  }
  return 'Mesa'
}

function tipoUsoMesa(mesa: Mesa): string {
  return mesa.tipoUso ?? TIPO_USO_MESA.COMUM
}

export function GradeMesas({
  mesas,
  mesaSelecionadaId,
  filtroStatus,
  onSelecionar,
}: GradeMesasProps) {
  const mesasFiltradas = mesas.filter((mesa) =>
    mesaPassaNoFiltro(mesa.status, mesa.ativo, filtroStatus),
  )

  if (mesas.length === 0) {
    return (
      <p className="grade-mesas__vazio" data-testid="estado-vazio-mesas">
        Nenhuma mesa cadastrada. Use &quot;Cadastrar mesas&quot; para criar o intervalo.
      </p>
    )
  }

  if (mesasFiltradas.length === 0) {
    return (
      <p className="grade-mesas__vazio" data-testid="estado-vazio-filtro-mesas">
        Nenhuma mesa com o filtro selecionado.
      </p>
    )
  }

  return (
    <div className="grade-mesas" data-testid="grade-mesas">
      {mesasFiltradas.map((mesa) => {
        const selecionada = mesa.id === mesaSelecionadaId
        const classeStatus = obterClasseStatusMesa(mesa.status, mesa.ativo)
        const tipo = tipoUsoMesa(mesa)
        const tipoClasse =
          tipo === TIPO_USO_MESA.BALCAO
            ? ' grade-mesas__celula--balcao'
            : tipo === TIPO_USO_MESA.DELIVERY
              ? ' grade-mesas__celula--delivery'
              : ''

        return (
          <button
            key={mesa.id}
            type="button"
            className={`grade-mesas__celula ${classeStatus}${tipoClasse}${
              selecionada ? ' grade-mesas__celula--selecionada' : ''
            }`}
            data-testid="item-mesa"
            data-mesa-numero={mesa.numero}
            data-tipo-uso={tipo}
            aria-pressed={selecionada}
            aria-label={`${rotuloTipo(mesa)} ${mesa.numero}`}
            onClick={() => onSelecionar(mesa)}
          >
            {tipo === TIPO_USO_MESA.BALCAO ? (
              <span className="grade-mesas__icone" data-testid="icone-mesa-balcao">
                <IconeBalcao />
              </span>
            ) : null}
            {tipo === TIPO_USO_MESA.DELIVERY ? (
              <span className="grade-mesas__icone" data-testid="icone-mesa-delivery">
                <IconeDelivery />
              </span>
            ) : null}
            <span className="grade-mesas__numero" data-testid="mesa-numero">
              {mesa.numero}
            </span>
          </button>
        )
      })}
    </div>
  )
}
