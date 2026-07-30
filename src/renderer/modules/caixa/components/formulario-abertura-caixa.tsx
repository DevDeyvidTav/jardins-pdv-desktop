import { useState, type FormEvent } from 'react'
import { converterReaisParaCentavos, formatarMoeda } from '@shared/utils/moeda'

interface FormularioAberturaCaixaProps {
  carregando: boolean
  erroExterno: string | null
  onAbrirCaixa: (saldoInicialCentavos: number) => Promise<boolean>
}

export function FormularioAberturaCaixa({
  carregando,
  erroExterno,
  onAbrirCaixa,
}: FormularioAberturaCaixaProps) {
  const [saldoInicial, setSaldoInicial] = useState('300,00')
  const [erroValidacao, setErroValidacao] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErroValidacao(null)

    const saldoInicialCentavos = converterReaisParaCentavos(saldoInicial)

    if (saldoInicialCentavos === null) {
      setErroValidacao('Informe um saldo inicial valido e nao negativo.')
      return
    }

    setEnviando(true)

    try {
      await onAbrirCaixa(saldoInicialCentavos)
    } finally {
      setEnviando(false)
    }
  }

  const saldoPreview = converterReaisParaCentavos(saldoInicial)

  return (
    <form
      className="formulario-abertura-caixa"
      data-testid="formulario-abertura-caixa"
      onSubmit={(evento) => void handleSubmit(evento)}
    >
      <label className="formulario-abertura-caixa__campo" htmlFor="saldo-inicial">
        Saldo inicial
        <input
          id="saldo-inicial"
          data-testid="campo-saldo-inicial"
          type="text"
          inputMode="decimal"
          placeholder="0,00"
          value={saldoInicial}
          onChange={(evento) => setSaldoInicial(evento.target.value)}
          disabled={carregando || enviando}
        />
      </label>

      {saldoPreview !== null ? (
        <p className="formulario-abertura-caixa__preview">
          Valor informado: {formatarMoeda(saldoPreview)}
        </p>
      ) : null}

      {erroValidacao ? (
        <p className="formulario-abertura-caixa__erro" role="alert">
          {erroValidacao}
        </p>
      ) : null}

      {erroExterno ? (
        <p
          className="formulario-abertura-caixa__erro"
          role="alert"
          data-testid="erro-caixa"
        >
          {erroExterno}
        </p>
      ) : null}

      <button
        type="submit"
        data-testid="botao-abrir-caixa"
        disabled={carregando || enviando}
      >
        Abrir caixa
      </button>
    </form>
  )
}
