import { useEffect, useState, type FormEvent } from 'react'
import {
  FORMA_PAGAMENTO,
  ROTULOS_FORMA_PAGAMENTO,
  type PagamentoInformado,
} from '@shared/types/pagamento-pedido'
import { converterReaisParaCentavos, formatarMoeda } from '@shared/utils/moeda'
import { MENSAGEM_VALOR_RECEBIDO_INSUFICIENTE } from '@shared/utils/troco-dinheiro'
import { CamposTrocoDinheiro } from './campos-troco-dinheiro'

interface Props {
  totalCentavos: number
  erroExterno?: string | null
  permitirTalao?: boolean
  onConfirmar: (pagamento: PagamentoInformado) => Promise<boolean>
}

function formatarCentavosParaInput(centavos: number): string {
  return (centavos / 100).toFixed(2).replace('.', ',')
}

const FORMAS_BASE: PagamentoInformado['formaPagamento'][] = [
  FORMA_PAGAMENTO.DINHEIRO,
  FORMA_PAGAMENTO.CARTAO_CREDITO,
  FORMA_PAGAMENTO.CARTAO_DEBITO,
  FORMA_PAGAMENTO.PIX_MAQUINETA,
  FORMA_PAGAMENTO.PIX_CNPJ,
  FORMA_PAGAMENTO.CORTESIA,
]

export function FormularioPagamentoPedido({
  totalCentavos,
  erroExterno = null,
  permitirTalao = false,
  onConfirmar,
}: Props) {
  const [formaPagamento, setFormaPagamento] = useState<PagamentoInformado['formaPagamento']>(
    FORMA_PAGAMENTO.DINHEIRO,
  )
  const [valor, setValor] = useState(formatarCentavosParaInput(totalCentavos))
  const [valorRecebido, setValorRecebido] = useState('')
  const [motivoCortesia, setMotivoCortesia] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const formas = permitirTalao
    ? [...FORMAS_BASE.slice(0, 5), FORMA_PAGAMENTO.TALAO, FORMA_PAGAMENTO.CORTESIA]
    : FORMAS_BASE
  const ehDinheiro = formaPagamento === FORMA_PAGAMENTO.DINHEIRO

  useEffect(() => {
    setValor(formatarCentavosParaInput(totalCentavos))
    setValorRecebido('')
  }, [totalCentavos])

  useEffect(() => {
    if (!permitirTalao && formaPagamento === FORMA_PAGAMENTO.TALAO) {
      setFormaPagamento(FORMA_PAGAMENTO.DINHEIRO)
    }
  }, [permitirTalao, formaPagamento])

  useEffect(() => {
    if (!ehDinheiro) {
      setValorRecebido('')
    }
  }, [ehDinheiro])

  async function confirmar(evento: FormEvent) {
    evento.preventDefault()
    const valorCentavos = converterReaisParaCentavos(valor)

    if (valorCentavos === null || valorCentavos <= 0) {
      setErro('Informe um valor maior que zero.')
      return
    }

    if (valorCentavos > totalCentavos) {
      setErro('Pagamento nao pode ser maior que o valor restante.')
      return
    }

    if (
      formaPagamento === FORMA_PAGAMENTO.CORTESIA &&
      motivoCortesia.trim().length === 0
    ) {
      setErro('Informe o motivo da cortesia.')
      return
    }

    let valorRecebidoCentavos: number | undefined
    if (ehDinheiro && valorRecebido.trim() !== '') {
      const recebido = converterReaisParaCentavos(valorRecebido)
      if (recebido === null) {
        setErro('Informe um valor recebido valido.')
        return
      }
      if (recebido < valorCentavos) {
        setErro(MENSAGEM_VALOR_RECEBIDO_INSUFICIENTE)
        return
      }
      valorRecebidoCentavos = recebido
    }

    setErro(null)
    setEnviando(true)

    try {
      const ok = await onConfirmar({
        formaPagamento,
        valorCentavos,
        valorRecebidoCentavos,
        motivoCortesia:
          formaPagamento === FORMA_PAGAMENTO.CORTESIA
            ? motivoCortesia.trim()
            : undefined,
      })

      if (!ok && !erroExterno) {
        setErro('Nao foi possivel registrar o pagamento.')
      }
    } finally {
      setEnviando(false)
    }
  }

  const mensagemErro = erro ?? erroExterno

  return (
    <form
      className="formulario-pagamento"
      data-testid="formulario-pagamento"
      onSubmit={(evento) => void confirmar(evento)}
    >
      <strong>Pagamento</strong>
      <div className="formulario-pagamento__campos">
        <select
          data-testid="campo-forma-pagamento"
          value={formaPagamento}
          onChange={(evento) =>
            setFormaPagamento(evento.target.value as PagamentoInformado['formaPagamento'])
          }
          disabled={enviando}
        >
          {formas.map((forma) => (
            <option key={forma} value={forma}>
              {ROTULOS_FORMA_PAGAMENTO[forma]}
            </option>
          ))}
        </select>
        <input
          data-testid="campo-valor-pagamento"
          value={valor}
          onChange={(evento) => setValor(evento.target.value)}
          placeholder="0,00"
          inputMode="decimal"
          disabled={enviando}
          aria-label="Valor do pagamento"
        />
        {formaPagamento === FORMA_PAGAMENTO.CORTESIA ? (
          <input
            data-testid="campo-motivo-cortesia"
            value={motivoCortesia}
            onChange={(evento) => setMotivoCortesia(evento.target.value)}
            placeholder="Motivo da cortesia"
            disabled={enviando}
          />
        ) : null}
        {ehDinheiro ? (
          <CamposTrocoDinheiro
            valorAplicadoCentavos={converterReaisParaCentavos(valor)}
            valorRecebido={valorRecebido}
            onValorRecebidoChange={setValorRecebido}
            disabled={enviando}
          />
        ) : null}
      </div>
      <p>Total a pagar: {formatarMoeda(totalCentavos)}</p>
      {mensagemErro ? (
        <p role="alert" data-testid="erro-pagamento">
          {mensagemErro}
        </p>
      ) : null}
      <button
        type="submit"
        data-testid="botao-confirmar-pagamento"
        disabled={enviando || totalCentavos <= 0}
      >
        Confirmar pagamento
      </button>
    </form>
  )
}
