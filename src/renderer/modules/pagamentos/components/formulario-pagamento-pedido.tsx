import { useState, type FormEvent } from 'react'
import {
  FORMA_PAGAMENTO,
  type PagamentoInformado,
} from '@shared/types/pagamento-pedido'
import { formatarMoeda } from '@shared/utils/moeda'

interface Props {
  totalCentavos: number
  onConfirmar: (pagamento: PagamentoInformado) => Promise<boolean>
}

export function FormularioPagamentoPedido({ totalCentavos, onConfirmar }: Props) {
  const [formaPagamento, setFormaPagamento] = useState<PagamentoInformado['formaPagamento']>(
    FORMA_PAGAMENTO.DINHEIRO,
  )
  const [valor, setValor] = useState('')
  const [motivoCortesia, setMotivoCortesia] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  const restante = totalCentavos

  async function confirmar(evento: FormEvent) {
    evento.preventDefault()
    const valorCentavos = Math.round(Number(valor.replace(',', '.')) * 100)
    if (!Number.isInteger(valorCentavos) || valorCentavos <= 0) {
      setErro('Informe um valor maior que zero.')
      return
    }

    setErro(null)

    await onConfirmar({
      formaPagamento,
      valorCentavos,
      motivoCortesia:
        formaPagamento === FORMA_PAGAMENTO.CORTESIA ? motivoCortesia.trim() : undefined,
    })
  }

  return (
    <form className="formulario-pagamento" data-testid="formulario-pagamento" onSubmit={(evento) => void confirmar(evento)}>
      <strong>Pagamento</strong>
      <div className="formulario-pagamento__campos">
        <select data-testid="campo-forma-pagamento" value={formaPagamento} onChange={(evento) => setFormaPagamento(evento.target.value as PagamentoInformado['formaPagamento'])}>
          <option value={FORMA_PAGAMENTO.DINHEIRO}>Dinheiro</option>
          <option value={FORMA_PAGAMENTO.CARTAO_CREDITO}>Cartão crédito</option>
          <option value={FORMA_PAGAMENTO.CARTAO_DEBITO}>Cartão débito</option>
          <option value={FORMA_PAGAMENTO.PIX}>Pix</option>
          <option value={FORMA_PAGAMENTO.CORTESIA}>Cortesia</option>
        </select>
        <input data-testid="campo-valor-pagamento" value={valor} onChange={(evento) => setValor(evento.target.value)} placeholder="0,00" inputMode="decimal" />
        {formaPagamento === FORMA_PAGAMENTO.CORTESIA ? (
          <input
            data-testid="campo-motivo-cortesia"
            value={motivoCortesia}
            onChange={(evento) => setMotivoCortesia(evento.target.value)}
            placeholder="Motivo da cortesia"
          />
        ) : null}
      </div>
      <p>Total a pagar: {formatarMoeda(restante)}</p>
      {erro ? <p role="alert">{erro}</p> : null}
      <button type="submit" data-testid="botao-confirmar-pagamento">Confirmar pagamento</button>
    </form>
  )
}
