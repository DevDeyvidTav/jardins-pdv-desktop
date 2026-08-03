import { useMemo, useState } from 'react'
import type { Mesa } from '@shared/types/mesa'
import { STATUS_MESA } from '@shared/types/mesa'

interface ModalAgruparMesasProps {
  mesaPrincipal: Mesa
  mesas: Mesa[]
  carregando: boolean
  onConfirmar: (mesaIds: string[], motivo?: string) => Promise<boolean>
  onFechar: () => void
}

export function ModalAgruparMesas({
  mesaPrincipal,
  mesas,
  carregando,
  onConfirmar,
  onFechar,
}: ModalAgruparMesasProps) {
  const elegiveis = useMemo(
    () =>
      mesas.filter(
        (mesa) =>
          mesa.id !== mesaPrincipal.id &&
          mesa.ativo &&
          mesa.status === STATUS_MESA.LIVRE,
      ),
    [mesaPrincipal.id, mesas],
  )

  const [selecionadas, setSelecionadas] = useState<string[]>([])
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)

  function alternarMesa(mesaId: string) {
    setSelecionadas((atual) =>
      atual.includes(mesaId)
        ? atual.filter((id) => id !== mesaId)
        : [...atual, mesaId],
    )
  }

  async function handleConfirmar() {
    if (selecionadas.length === 0) return
    setEnviando(true)
    try {
      const ok = await onConfirmar(
        [mesaPrincipal.id, ...selecionadas],
        motivo.trim() || undefined,
      )
      if (ok) onFechar()
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="modal-pagamento" data-testid="modal-agrupar-mesas">
      <div className="modal-pagamento__backdrop" onClick={onFechar} />
      <div className="modal-pagamento__conteudo" role="dialog" aria-modal="true">
        <h2>Agrupar mesas</h2>
        <p data-testid="agrupar-mesa-principal">
          Mesa principal: <strong>{mesaPrincipal.numero}</strong>
        </p>

        <fieldset className="modal-agrupar-mesas__lista" data-testid="lista-mesas-agrupar">
          <legend>Mesas livres</legend>
          {elegiveis.length === 0 ? (
            <p>Nenhuma mesa livre disponivel.</p>
          ) : (
            elegiveis.map((mesa) => (
              <label key={mesa.id} className="modal-agrupar-mesas__item">
                <input
                  type="checkbox"
                  data-testid={`check-mesa-agrupar-${mesa.numero}`}
                  checked={selecionadas.includes(mesa.id)}
                  disabled={carregando || enviando}
                  onChange={() => alternarMesa(mesa.id)}
                />
                Mesa {mesa.numero}
              </label>
            ))
          )}
        </fieldset>

        {selecionadas.length > 0 ? (
          <p data-testid="confirmacao-agrupamento">
            Grupo: Mesa {mesaPrincipal.numero} (principal) +{' '}
            {elegiveis
              .filter((m) => selecionadas.includes(m.id))
              .map((m) => m.numero)
              .join(', ')}
          </p>
        ) : null}

        <label htmlFor="motivo-agrupamento">Motivo (opcional)</label>
        <input
          id="motivo-agrupamento"
          data-testid="motivo-agrupamento"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          disabled={carregando || enviando}
        />

        <div className="modal-pagamento__acoes">
          <button type="button" data-testid="cancelar-agrupamento" onClick={onFechar}>
            Cancelar
          </button>
          <button
            type="button"
            data-testid="confirmar-agrupamento"
            disabled={selecionadas.length === 0 || carregando || enviando}
            onClick={() => void handleConfirmar()}
          >
            Confirmar agrupamento
          </button>
        </div>
      </div>
    </div>
  )
}
