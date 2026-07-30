import type { Mesa } from '@shared/types/mesa'
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

        return (
          <button
            key={mesa.id}
            type="button"
            className={`grade-mesas__celula ${classeStatus}${
              selecionada ? ' grade-mesas__celula--selecionada' : ''
            }`}
            data-testid="item-mesa"
            data-mesa-numero={mesa.numero}
            aria-pressed={selecionada}
            aria-label={`Mesa ${mesa.numero}`}
            onClick={() => onSelecionar(mesa)}
          >
            <span className="grade-mesas__numero" data-testid="mesa-numero">
              {mesa.numero}
            </span>
          </button>
        )
      })}
    </div>
  )
}
