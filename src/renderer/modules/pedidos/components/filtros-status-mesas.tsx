import {
  FILTROS_STATUS_MESA,
  ROTULOS_FILTRO_STATUS_MESA,
  type FiltroStatusMesa,
} from '../constants/mesa-status-cores'

interface FiltrosStatusMesasProps {
  filtroAtivo: FiltroStatusMesa
  onAlterarFiltro: (filtro: FiltroStatusMesa) => void
}

const ORDEM_FILTROS: FiltroStatusMesa[] = [
  FILTROS_STATUS_MESA.LIVRE,
  FILTROS_STATUS_MESA.OCUPADA,
  FILTROS_STATUS_MESA.AGRUPADA,
  FILTROS_STATUS_MESA.INATIVA,
  FILTROS_STATUS_MESA.TODAS,
]

export function FiltrosStatusMesas({ filtroAtivo, onAlterarFiltro }: FiltrosStatusMesasProps) {
  return (
    <div className="filtros-status-mesas" data-testid="filtros-status-mesas" role="group">
      {ORDEM_FILTROS.map((filtro) => {
        const ativo = filtroAtivo === filtro

        return (
          <button
            key={filtro}
            type="button"
            className={`filtros-status-mesas__botao filtros-status-mesas__botao--${filtro.toLowerCase()}${
              ativo ? ' filtros-status-mesas__botao--ativo' : ''
            }`}
            data-testid={`filtro-mesa-${filtro.toLowerCase()}`}
            aria-pressed={ativo}
            onClick={() => onAlterarFiltro(filtro)}
          >
            {ROTULOS_FILTRO_STATUS_MESA[filtro]}
          </button>
        )
      })}
    </div>
  )
}
