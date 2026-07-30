import { useState, type FormEvent } from 'react'

interface FormularioMesaProps {
  carregando: boolean
  onCriarIntervalo: (numeroInicial: number, numeroFinal: number) => Promise<boolean>
}

export function FormularioMesa({ carregando, onCriarIntervalo }: FormularioMesaProps) {
  const [numeroInicial, setNumeroInicial] = useState('1')
  const [numeroFinal, setNumeroFinal] = useState('30')
  const [erroValidacao, setErroValidacao] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErroValidacao(null)

    const inicio = Number(numeroInicial)
    const fim = Number(numeroFinal)

    if (!Number.isInteger(inicio) || inicio < 1) {
      setErroValidacao('Informe um numero inicial valido.')
      return
    }

    if (!Number.isInteger(fim) || fim < 1) {
      setErroValidacao('Informe um numero final valido.')
      return
    }

    if (fim < inicio) {
      setErroValidacao('O numero final deve ser maior ou igual ao inicial.')
      return
    }

    setEnviando(true)

    try {
      await onCriarIntervalo(inicio, fim)
    } finally {
      setEnviando(false)
    }
  }

  const inicioPreview = Number(numeroInicial)
  const fimPreview = Number(numeroFinal)
  const intervaloValido =
    Number.isInteger(inicioPreview) &&
    Number.isInteger(fimPreview) &&
    inicioPreview >= 1 &&
    fimPreview >= inicioPreview

  return (
    <form
      className="formulario-mesa"
      data-testid="formulario-mesa"
      onSubmit={(evento) => void handleSubmit(evento)}
    >
      <p className="formulario-mesa__descricao">
        Crie mesas em lote informando apenas o intervalo de numeros.
      </p>

      <div className="formulario-mesa__intervalo">
        <label className="formulario-mesa__campo" htmlFor="numero-inicial-mesa">
          De
          <input
            id="numero-inicial-mesa"
            data-testid="campo-numero-inicial-mesa"
            type="number"
            min={1}
            value={numeroInicial}
            onChange={(evento) => setNumeroInicial(evento.target.value)}
            disabled={carregando || enviando}
          />
        </label>

        <label className="formulario-mesa__campo" htmlFor="numero-final-mesa">
          ate
          <input
            id="numero-final-mesa"
            data-testid="campo-numero-final-mesa"
            type="number"
            min={1}
            value={numeroFinal}
            onChange={(evento) => setNumeroFinal(evento.target.value)}
            disabled={carregando || enviando}
          />
        </label>
      </div>

      {intervaloValido ? (
        <p className="formulario-mesa__preview" data-testid="preview-intervalo-mesas">
          Serao criadas as mesas de {inicioPreview} a {fimPreview} (
          {fimPreview - inicioPreview + 1} mesas).
        </p>
      ) : null}

      {erroValidacao ? (
        <p className="formulario-mesa__erro" role="alert">
          {erroValidacao}
        </p>
      ) : null}

      <button
        type="submit"
        data-testid="botao-criar-mesas"
        disabled={carregando || enviando}
      >
        Criar mesas
      </button>
    </form>
  )
}
