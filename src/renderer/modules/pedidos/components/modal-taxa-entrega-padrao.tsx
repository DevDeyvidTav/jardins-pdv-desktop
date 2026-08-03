import { useState, type FormEvent } from 'react'
import { converterReaisParaCentavos, formatarMoeda } from '@shared/utils/moeda'

function formatarCentavosParaInput(centavos: number): string {
  return (centavos / 100).toFixed(2).replace('.', ',')
}

interface ModalTaxaEntregaPadraoProps {
  taxaAtualCentavos: number
  salvando?: boolean
  onSalvar: (taxaCentavos: number) => Promise<boolean>
  onFechar: () => void
}

export function ModalTaxaEntregaPadrao({
  taxaAtualCentavos,
  salvando = false,
  onSalvar,
  onFechar,
}: ModalTaxaEntregaPadraoProps) {
  const [valor, setValor] = useState(formatarCentavosParaInput(taxaAtualCentavos))
  const [erro, setErro] = useState<string | null>(null)

  async function handleSubmit(evento: FormEvent) {
    evento.preventDefault()
    const centavos = converterReaisParaCentavos(valor)
    if (centavos === null) {
      setErro('Informe um valor valido.')
      return
    }
    setErro(null)
    const ok = await onSalvar(centavos)
    if (ok) onFechar()
  }

  const preview = converterReaisParaCentavos(valor)

  return (
    <div className="modal-pagamento" data-testid="modal-taxa-entrega-padrao">
      <div className="modal-pagamento__backdrop" onClick={() => !salvando && onFechar()} />
      <div className="modal-pagamento__conteudo" role="dialog" aria-modal="true">
        <header className="modal-pagamento__cabecalho">
          <h2>Taxa de entrega padrao</h2>
          <button
            type="button"
            className="modal-pagamento__fechar"
            disabled={salvando}
            onClick={onFechar}
          >
            Fechar
          </button>
        </header>
        <p style={{ margin: '0 0 1rem', color: '#4b5563', fontSize: '0.9rem' }}>
          Valor sugerido ao criar um novo delivery. Pode ser alterado em cada pedido.
        </p>
        <form onSubmit={(e) => void handleSubmit(e)}>
          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: 4 }}>
            Taxa (R$)
            <input
              type="text"
              inputMode="decimal"
              value={valor}
              data-testid="input-taxa-entrega-padrao"
              disabled={salvando}
              onChange={(e) => setValor(e.target.value)}
              style={{
                display: 'block',
                width: '100%',
                marginTop: 4,
                padding: '8px',
                borderRadius: 4,
                border: '1px solid #ccc',
              }}
            />
          </label>
          {preview !== null ? (
            <p style={{ margin: '0.5rem 0', color: '#6b7280', fontSize: '0.8125rem' }}>
              {formatarMoeda(preview)}
            </p>
          ) : null}
          {erro ? (
            <p style={{ color: '#dc2626', fontSize: '0.8125rem' }} role="alert">
              {erro}
            </p>
          ) : null}
          <div className="modal-confirmacao__acoes" style={{ marginTop: '1rem' }}>
            <button
              type="button"
              className="painel-mesa-pedido__acao-secundaria"
              disabled={salvando}
              onClick={onFechar}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="painel-mesa-pedido__acao-principal"
              data-testid="botao-salvar-taxa-padrao"
              disabled={salvando}
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
