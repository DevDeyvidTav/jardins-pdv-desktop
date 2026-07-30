import { useState, type FormEvent } from 'react'
import {
  FORMA_PAGAMENTO,
  type PagamentoInformado,
} from '@shared/types/pagamento-pedido'
import { formatarMoeda } from '@shared/utils/moeda'

interface Props {
  totalCentavos: number
  onConfirmar: (pagamentos: PagamentoInformado[]) => Promise<boolean>
}

export function FormularioPagamentoPedido({ totalCentavos, onConfirmar }: Props) {
  const [pagamentos, setPagamentos] = useState<PagamentoInformado[]>([])
  const [formaPagamento, setFormaPagamento] = useState<PagamentoInformado['formaPagamento']>(
    FORMA_PAGAMENTO.DINHEIRO,
  )
  const [valor, setValor] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const totalPago = pagamentos.reduce((total, pagamento) => total + pagamento.valorCentavos, 0)
  const restante = totalCentavos - totalPago

  function adicionar() {
    const valorCentavos = Math.round(Number(valor.replace(',', '.')) * 100)
    if (!Number.isInteger(valorCentavos) || valorCentavos <= 0) {
      setErro('Informe um valor maior que zero.')
      return
    }
    setErro(null)
    setPagamentos((atual) => [...atual, { formaPagamento, valorCentavos }])
    setValor('')
  }

  async function confirmar(evento: FormEvent) {
    evento.preventDefault()
    if (restante !== 0) {
      setErro('A soma dos pagamentos deve ser igual ao total do pedido.')
      return
    }
    await onConfirmar(pagamentos)
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
        </select>
        <input data-testid="campo-valor-pagamento" value={valor} onChange={(evento) => setValor(evento.target.value)} placeholder="0,00" inputMode="decimal" />
        <button type="button" data-testid="botao-adicionar-pagamento" onClick={adicionar}>Adicionar</button>
      </div>
      <ul data-testid="lista-pagamentos-informados">
        {pagamentos.map((pagamento, indice) => <li key={`${pagamento.formaPagamento}-${indice}`}>{pagamento.formaPagamento}: {formatarMoeda(pagamento.valorCentavos)}</li>)}
      </ul>
      <p>Total pago: {formatarMoeda(totalPago)} · Restante: {formatarMoeda(restante)}</p>
      {erro ? <p role="alert">{erro}</p> : null}
      <button type="submit" data-testid="botao-confirmar-pagamento">Confirmar pagamento</button>
    </form>
  )
}
