import { useState, type FormEvent } from 'react'
import {
  TIPO_MOVIMENTO_CAIXA,
  type RegistrarMovimentoCaixaEntrada,
  type TipoMovimentoCaixa,
} from '@shared/types/movimento-caixa'
import { converterReaisParaCentavos, formatarMoeda } from '@shared/utils/moeda'

interface FormularioMovimentoCaixaProps {
  carregando: boolean
  erroExterno: string | null
  onRegistrar: (entrada: RegistrarMovimentoCaixaEntrada) => Promise<boolean>
  onLimparFeedback: () => void
  compacto?: boolean
}

const TIPOS_MOVIMENTO: { valor: TipoMovimentoCaixa; rotulo: string }[] = [
  { valor: TIPO_MOVIMENTO_CAIXA.SUPRIMENTO, rotulo: 'Suprimento' },
  { valor: TIPO_MOVIMENTO_CAIXA.SANGRIA, rotulo: 'Sangria' },
  { valor: TIPO_MOVIMENTO_CAIXA.RETIRADA, rotulo: 'Retirada' },
]

export function FormularioMovimentoCaixa({
  carregando,
  erroExterno,
  onRegistrar,
  onLimparFeedback,
  compacto = false,
}: FormularioMovimentoCaixaProps) {
  const [tipo, setTipo] = useState<TipoMovimentoCaixa>(
    TIPO_MOVIMENTO_CAIXA.SUPRIMENTO,
  )
  const [valor, setValor] = useState('50,00')
  const [descricao, setDescricao] = useState('')
  const [erroValidacao, setErroValidacao] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    onLimparFeedback()
    setErroValidacao(null)

    const valorCentavos = converterReaisParaCentavos(valor)

    if (valorCentavos === null || valorCentavos <= 0) {
      setErroValidacao('Informe um valor valido maior que zero.')
      return
    }

    const descricaoNormalizada = descricao.trim()
    const exigeDescricao =
      tipo === TIPO_MOVIMENTO_CAIXA.SANGRIA ||
      tipo === TIPO_MOVIMENTO_CAIXA.RETIRADA

    if (exigeDescricao && !descricaoNormalizada) {
      setErroValidacao('Descricao e obrigatoria para sangria e retirada.')
      return
    }

    setEnviando(true)

    try {
      const sucesso = await onRegistrar({
        tipo,
        valorCentavos,
        descricao: descricaoNormalizada || undefined,
      })

      if (sucesso) {
        setValor('50,00')
        setDescricao('')
        setTipo(TIPO_MOVIMENTO_CAIXA.SUPRIMENTO)
      }
    } finally {
      setEnviando(false)
    }
  }

  const valorPreview = converterReaisParaCentavos(valor)

  return (
    <form
      className={
        compacto
          ? 'formulario-movimento-caixa formulario-movimento-caixa--compacto'
          : 'formulario-movimento-caixa'
      }
      data-testid="formulario-movimento-caixa"
      onSubmit={(evento) => void handleSubmit(evento)}
    >
      {!compacto ? <h2>Registrar movimento</h2> : null}

      <label className="formulario-movimento-caixa__campo" htmlFor="tipo-movimento">
        Tipo
        <select
          id="tipo-movimento"
          data-testid="campo-tipo-movimento"
          value={tipo}
          onChange={(evento) =>
            setTipo(evento.target.value as TipoMovimentoCaixa)
          }
          disabled={carregando || enviando}
        >
          {TIPOS_MOVIMENTO.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>
              {opcao.rotulo}
            </option>
          ))}
        </select>
      </label>

      <label className="formulario-movimento-caixa__campo" htmlFor="valor-movimento">
        Valor
        <input
          id="valor-movimento"
          data-testid="campo-valor-movimento"
          type="text"
          inputMode="decimal"
          value={valor}
          onChange={(evento) => setValor(evento.target.value)}
          disabled={carregando || enviando}
        />
      </label>

      {valorPreview !== null ? (
        <p className="formulario-movimento-caixa__preview">
          Valor informado: {formatarMoeda(valorPreview)}
        </p>
      ) : null}

      <label
        className="formulario-movimento-caixa__campo"
        htmlFor="descricao-movimento"
      >
        Descricao
        <input
          id="descricao-movimento"
          data-testid="campo-descricao-movimento"
          type="text"
          value={descricao}
          onChange={(evento) => setDescricao(evento.target.value)}
          disabled={carregando || enviando}
          placeholder={
            tipo === TIPO_MOVIMENTO_CAIXA.SUPRIMENTO
              ? 'Opcional'
              : 'Obrigatoria'
          }
        />
      </label>

      {erroValidacao ? (
        <p className="formulario-movimento-caixa__erro" role="alert">
          {erroValidacao}
        </p>
      ) : null}

      {erroExterno ? (
        <p
          className="formulario-movimento-caixa__erro"
          role="alert"
          data-testid="erro-caixa"
        >
          {erroExterno}
        </p>
      ) : null}

      <button
        type="submit"
        data-testid="botao-registrar-movimento"
        disabled={carregando || enviando}
      >
        Registrar movimento
      </button>
    </form>
  )
}
