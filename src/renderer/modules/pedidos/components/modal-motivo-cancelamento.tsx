import { useEffect, useId, useRef, useState } from 'react'

interface ModalMotivoCancelamentoProps {
  titulo: string
  descricao: string
  testId?: string
  confirmando?: boolean
  onConfirmar: (motivoCancelamento: string) => void | Promise<void>
  onFechar: () => void
}

export function ModalMotivoCancelamento({
  titulo,
  descricao,
  testId = 'modal-motivo-cancelamento',
  confirmando = false,
  onConfirmar,
  onFechar,
}: ModalMotivoCancelamentoProps) {
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const campoId = useId()
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleConfirmar = async () => {
    const motivoTrim = motivo.trim()
    if (!motivoTrim) {
      setErro('Informe o motivo do cancelamento.')
      inputRef.current?.focus()
      return
    }

    setErro(null)
    await onConfirmar(motivoTrim)
  }

  return (
    <div className="modal-pagamento" data-testid={testId}>
      <div
        className="modal-pagamento__backdrop"
        onClick={() => {
          if (!confirmando) onFechar()
        }}
      />
      <div className="modal-pagamento__conteudo" role="dialog" aria-modal="true">
        <header className="modal-pagamento__cabecalho">
          <div>
            <h2>{titulo}</h2>
            <p className="modal-pagamento__total" style={{ color: '#b91c1c' }}>
              Essa acao nao pode ser desfeita.
            </p>
          </div>
          <button
            type="button"
            className="modal-pagamento__fechar"
            disabled={confirmando}
            onClick={onFechar}
          >
            Fechar
          </button>
        </header>

        <p style={{ margin: '0 0 1rem', color: '#4b5563', fontSize: '0.9375rem' }}>
          {descricao}
        </p>

        <div className="modal-motivo-cancelamento__campo">
          <label htmlFor={campoId}>Motivo do cancelamento</label>
          <textarea
            id={campoId}
            ref={inputRef}
            rows={3}
            maxLength={500}
            value={motivo}
            disabled={confirmando}
            data-testid="input-motivo-cancelamento"
            placeholder="Descreva o motivo..."
            onChange={(evento) => {
              setMotivo(evento.target.value)
              if (erro) setErro(null)
            }}
            onKeyDown={(evento) => {
              if (evento.key === 'Enter' && (evento.ctrlKey || evento.metaKey)) {
                evento.preventDefault()
                void handleConfirmar()
              }
            }}
          />
          {erro ? (
            <p className="modal-motivo-cancelamento__erro" data-testid="erro-motivo-cancelamento">
              {erro}
            </p>
          ) : null}
        </div>

        <div className="modal-confirmacao__acoes">
          <button
            type="button"
            className="painel-mesa-pedido__acao-secundaria"
            data-testid="botao-voltar-cancelamento"
            disabled={confirmando}
            onClick={onFechar}
          >
            Voltar
          </button>
          <button
            type="button"
            className="painel-mesa-pedido__acao-cancelar-confirmar"
            data-testid="botao-confirmar-cancelamento-pedido"
            disabled={confirmando}
            onClick={() => void handleConfirmar()}
          >
            {confirmando ? 'Cancelando...' : 'Confirmar cancelamento'}
          </button>
        </div>
      </div>
    </div>
  )
}
