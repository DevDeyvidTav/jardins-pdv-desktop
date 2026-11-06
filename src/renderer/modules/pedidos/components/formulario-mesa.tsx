import { useState, type FormEvent } from 'react'
import { TIPO_USO_MESA, type TipoUsoMesa } from '@shared/types/mesa'

interface FormularioMesaProps {
  carregando: boolean
  onCriarIntervalo: (
    numeroInicial: number,
    numeroFinal: number,
    tipoUso: TipoUsoMesa,
  ) => Promise<boolean>
}

export function FormularioMesa({ carregando, onCriarIntervalo }: FormularioMesaProps) {
  const [numeroInicial, setNumeroInicial] = useState('1')
  const [numeroFinal, setNumeroFinal] = useState('30')
  const [tipoUso, setTipoUso] = useState<TipoUsoMesa>(TIPO_USO_MESA.COMUM)
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
      await onCriarIntervalo(inicio, fim, tipoUso)
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

  const rotuloTipo =
    tipoUso === TIPO_USO_MESA.BALCAO
      ? 'balcao'
      : tipoUso === TIPO_USO_MESA.DELIVERY
        ? 'delivery'
        : 'mesa comum'

  return (
    <form
      className="formulario-mesa"
      data-testid="formulario-mesa"
      onSubmit={(evento) => void handleSubmit(evento)}
    >
      <p className="formulario-mesa__descricao">
        Crie mesas em lote pelo intervalo de numeros e escolha se a sequencia e mesa comum,
        balcao ou delivery.
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

      <fieldset className="formulario-mesa__tipo" data-testid="campo-tipo-uso-mesa">
        <legend>Tipo da sequencia</legend>
        <label>
          <input
            type="radio"
            name="tipo-uso-mesa"
            value={TIPO_USO_MESA.COMUM}
            checked={tipoUso === TIPO_USO_MESA.COMUM}
            onChange={() => setTipoUso(TIPO_USO_MESA.COMUM)}
            disabled={carregando || enviando}
          />
          Mesa comum
        </label>
        <label>
          <input
            type="radio"
            name="tipo-uso-mesa"
            value={TIPO_USO_MESA.BALCAO}
            checked={tipoUso === TIPO_USO_MESA.BALCAO}
            onChange={() => setTipoUso(TIPO_USO_MESA.BALCAO)}
            disabled={carregando || enviando}
          />
          Balcao
        </label>
        <label>
          <input
            type="radio"
            name="tipo-uso-mesa"
            value={TIPO_USO_MESA.DELIVERY}
            checked={tipoUso === TIPO_USO_MESA.DELIVERY}
            onChange={() => setTipoUso(TIPO_USO_MESA.DELIVERY)}
            disabled={carregando || enviando}
          />
          Delivery
        </label>
      </fieldset>

      {intervaloValido ? (
        <p className="formulario-mesa__preview" data-testid="preview-intervalo-mesas">
          Serao criadas as posicoes de {inicioPreview} a {fimPreview} (
          {fimPreview - inicioPreview + 1}) como {rotuloTipo}.
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
