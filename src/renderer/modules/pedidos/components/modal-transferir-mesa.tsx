import { useMemo, useState } from 'react'
import type { Mesa } from '@shared/types/mesa'
import { STATUS_MESA } from '@shared/types/mesa'

interface ModalTransferirMesaProps {
  mesaAtual: Mesa
  mesas: Mesa[]
  carregando: boolean
  onConfirmar: (mesaDestinoId: string, motivo?: string) => Promise<boolean>
  onFechar: () => void
}

export function ModalTransferirMesa({
  mesaAtual,
  mesas,
  carregando,
  onConfirmar,
  onFechar,
}: ModalTransferirMesaProps) {
  const elegiveis = useMemo(
    () =>
      mesas.filter(
        (mesa) =>
          mesa.id !== mesaAtual.id &&
          mesa.ativo &&
          mesa.status === STATUS_MESA.LIVRE,
      ),
    [mesaAtual.id, mesas],
  )

  const [mesaDestinoId, setMesaDestinoId] = useState(elegiveis[0]?.id ?? '')
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function handleConfirmar() {
    if (!mesaDestinoId) return
    setEnviando(true)
    try {
      const ok = await onConfirmar(mesaDestinoId, motivo.trim() || undefined)
      if (ok) onFechar()
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="modal-pagamento" data-testid="modal-transferir-mesa">
      <div className="modal-pagamento__backdrop" onClick={onFechar} />
      <div className="modal-pagamento__conteudo" role="dialog" aria-modal="true">
        <h2>Transferir mesa</h2>
        <p data-testid="transferir-mesa-origem">
          Mesa atual: <strong>{mesaAtual.numero}</strong>
        </p>

        <label htmlFor="mesa-destino">Mesa destino</label>
        <select
          id="mesa-destino"
          data-testid="select-mesa-destino"
          value={mesaDestinoId}
          disabled={carregando || enviando || elegiveis.length === 0}
          onChange={(e) => setMesaDestinoId(e.target.value)}
        >
          {elegiveis.length === 0 ? (
            <option value="">Nenhuma mesa livre</option>
          ) : (
            elegiveis.map((mesa) => (
              <option key={mesa.id} value={mesa.id}>
                Mesa {mesa.numero}
              </option>
            ))
          )}
        </select>

        <label htmlFor="motivo-transferencia">Motivo (opcional)</label>
        <input
          id="motivo-transferencia"
          data-testid="motivo-transferencia"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          disabled={carregando || enviando}
        />

        <div className="modal-pagamento__acoes">
          <button type="button" data-testid="cancelar-transferencia" onClick={onFechar}>
            Cancelar
          </button>
          <button
            type="button"
            data-testid="confirmar-transferencia"
            disabled={!mesaDestinoId || carregando || enviando}
            onClick={() => void handleConfirmar()}
          >
            Confirmar transferencia
          </button>
        </div>
      </div>
    </div>
  )
}
