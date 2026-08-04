import { useState } from 'react'

interface ModalConfirmarExclusaoProps {
  titulo: string
  descricao: string
  testId?: string
  excluindo?: boolean
  onConfirmar: () => void | Promise<void>
  onFechar: () => void
}

export function ModalConfirmarExclusao({
  titulo,
  descricao,
  testId = 'modal-confirmar-exclusao',
  excluindo = false,
  onConfirmar,
  onFechar,
}: ModalConfirmarExclusaoProps) {
  const [enviando, setEnviando] = useState(false)
  const ocupado = excluindo || enviando

  return (
    <div className="modal-produtos" data-testid={testId}>
      <div
        className="modal-produtos__backdrop"
        onClick={() => {
          if (!ocupado) onFechar()
        }}
      />
      <div className="modal-produtos__conteudo" role="dialog" aria-modal="true">
        <header className="modal-produtos__cabecalho">
          <div>
            <h2>{titulo}</h2>
            <p className="modal-produtos__alerta">
              Se o item estiver em uso, ele sera inativado e podera ser reativado depois.
            </p>
          </div>
          <button
            type="button"
            className="produtos__botao-secundario"
            disabled={ocupado}
            onClick={onFechar}
          >
            Fechar
          </button>
        </header>

        <p className="modal-produtos__descricao">{descricao}</p>

        <div className="modal-produtos__acoes">
          <button
            type="button"
            className="produtos__botao-secundario"
            data-testid="botao-voltar-exclusao"
            disabled={ocupado}
            onClick={onFechar}
          >
            Voltar
          </button>
          <button
            type="button"
            className="modal-produtos__botao-excluir"
            data-testid="botao-confirmar-exclusao"
            disabled={ocupado}
            onClick={() => {
              void (async () => {
                setEnviando(true)
                try {
                  await onConfirmar()
                } finally {
                  setEnviando(false)
                }
              })()
            }}
          >
            {ocupado ? 'Removendo...' : 'Confirmar remocao'}
          </button>
        </div>
      </div>
    </div>
  )
}
