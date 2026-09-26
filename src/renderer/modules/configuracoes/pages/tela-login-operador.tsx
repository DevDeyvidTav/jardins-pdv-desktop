import { useState, type FormEvent } from 'react'
import { LogoMarca } from '../../../componentes/logo-marca'
import { TAMANHO_PIN_OPERADOR } from '@shared/types/operador'
import type { UseOperadorResultado } from '../hooks/use-operador'
import './tela-login-operador.css'

interface TelaLoginOperadorProps {
  operador: UseOperadorResultado
}

export function TelaLoginOperador({ operador }: TelaLoginOperadorProps) {
  const [operadorNome, setOperadorNome] = useState('')
  const [pin, setPin] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(evento: FormEvent) {
    evento.preventDefault()
    setEnviando(true)
    const sucesso = await operador.autenticar(operadorNome.trim(), pin.trim())
    setEnviando(false)
    if (sucesso) {
      setPin('')
    }
  }

  if (operador.carregando) {
    return (
      <main className="tela-login" data-testid="tela-login-carregando">
        <p>Carregando...</p>
      </main>
    )
  }

  return (
    <main className="tela-login" data-testid="tela-login-operador">
      <section className="tela-login__marca">
        <LogoMarca tamanho="destaque" />
        <p className="tela-login__selo">Jardins PDV</p>
        <h1>Entrar no caixa</h1>
        <p className="tela-login__texto">
          Informe o usuário e o PIN de {TAMANHO_PIN_OPERADOR} dígitos para abrir o ponto
          de venda.
        </p>
      </section>

      <section className="tela-login__formulario">
        <form onSubmit={(evento) => void handleSubmit(evento)} data-testid="modal-operador">
          <h2>Identificação</h2>
          <label className="tela-login__campo">
            Usuário
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

          <label className="tela-login__campo">
            PIN ({TAMANHO_PIN_OPERADOR} dígitos)
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              pattern={`\\d{${TAMANHO_PIN_OPERADOR}}`}
              maxLength={TAMANHO_PIN_OPERADOR}
              value={pin}
              onChange={(evento) =>
                setPin(evento.target.value.replace(/\D/g, '').slice(0, TAMANHO_PIN_OPERADOR))
              }
              minLength={TAMANHO_PIN_OPERADOR}
              required
              data-testid="campo-pin-operador"
            />
          </label>

          {operador.erro ? (
            <p className="tela-login__erro" role="alert">
              {operador.erro}
            </p>
          ) : null}

          <button type="submit" disabled={enviando} data-testid="botao-entrar-operador">
            {enviando ? 'Aguarde...' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  )
}
