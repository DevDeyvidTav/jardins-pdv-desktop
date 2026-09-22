import { useState, type FormEvent } from 'react'

import { TAMANHO_PIN_OPERADOR } from '@shared/types/operador'

import type { UseOperadorResultado } from '../hooks/use-operador'

interface ModalOperadorProps {
  operador: UseOperadorResultado
  onAutenticado: () => void
}

export function ModalOperador({ operador, onAutenticado }: ModalOperadorProps) {
  const [operadorNome, setOperadorNome] = useState('')
  const [pin, setPin] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(evento: FormEvent) {
    evento.preventDefault()
    setEnviando(true)

    const sucesso = await operador.autenticar(operadorNome.trim(), pin.trim())
    setEnviando(false)

    if (sucesso) {
      onAutenticado()
    }
  }

  if (operador.carregando || operador.autenticado) {
    return null
  }

  return (
    <div className="modal-operador" data-testid="modal-operador">
      <div className="modal-operador__conteudo">
        <h2>Identificação</h2>
        <p>
          Informe seu usuario e o PIN de {TAMANHO_PIN_OPERADOR} digitos para entrar no PDV.
        </p>

        <form onSubmit={(evento) => void handleSubmit(evento)}>
          <label className="modal-operador__campo">
            Usuario
            <input
              type="text"
              autoComplete="username"
              value={operadorNome}
              onChange={(evento) => setOperadorNome(evento.target.value)}
              required
              autoFocus
              data-testid="campo-usuario-operador"
            />
          </label>

          <label className="modal-operador__campo">
            PIN ({TAMANHO_PIN_OPERADOR} digitos)
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              pattern={`\\d{${TAMANHO_PIN_OPERADOR}}`}
              maxLength={TAMANHO_PIN_OPERADOR}
              value={pin}
              onChange={(evento) =>
                setPin(
                  evento.target.value.replace(/\D/g, '').slice(0, TAMANHO_PIN_OPERADOR),
                )
              }
              minLength={TAMANHO_PIN_OPERADOR}
              required
              data-testid="campo-pin-operador"
            />
          </label>

          {operador.erro ? (
            <p className="modal-operador__erro" role="alert">
              {operador.erro}
            </p>
          ) : null}

          <button type="submit" disabled={enviando} data-testid="botao-entrar-operador">
            {enviando ? 'Aguarde...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
