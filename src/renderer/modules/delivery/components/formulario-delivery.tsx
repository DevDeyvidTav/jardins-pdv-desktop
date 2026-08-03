import { useState, type FormEvent } from 'react'
import type { CriarPedidoDeliveryEntrada } from '@shared/types/pedido'
import { converterReaisParaCentavos, formatarMoeda } from '@shared/utils/moeda'

function formatarCentavosParaInput(centavos: number): string {
  return (centavos / 100).toFixed(2).replace('.', ',')
}

interface FormularioDeliveryProps {
  carregando: boolean
  taxaPadraoCentavos: number
  onCriar: (entrada: CriarPedidoDeliveryEntrada) => Promise<unknown>
  onCancelar: () => void
}

export function FormularioDelivery({
  carregando,
  taxaPadraoCentavos,
  onCriar,
  onCancelar,
}: FormularioDeliveryProps) {
  const [clienteNome, setClienteNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [observacao, setObservacao] = useState('')
  const [taxaReaisStr, setTaxaReaisStr] = useState(
    formatarCentavosParaInput(taxaPadraoCentavos),
  )
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)

    if (clienteNome.trim().length < 2) {
      setErro('Informe o nome do cliente.')
      return
    }

    const taxaCentavos = converterReaisParaCentavos(taxaReaisStr)
    if (taxaCentavos === null) {
      setErro('Informe uma taxa de entrega valida.')
      return
    }

    setEnviando(true)
    try {
      await onCriar({
        clienteNome: clienteNome.trim(),
        telefone: telefone.trim() || undefined,
        observacao: observacao.trim() || undefined,
        taxaEntregaCentavos: taxaCentavos,
      })
    } finally {
      setEnviando(false)
    }
  }

  const taxaPreview = converterReaisParaCentavos(taxaReaisStr)

  return (
    <form
      className="formulario-delivery"
      data-testid="formulario-delivery"
      onSubmit={(evento) => void handleSubmit(evento)}
    >
      <h2 className="formulario-delivery__titulo">Novo Delivery</h2>

      <div className="formulario-delivery__campo">
        <label htmlFor="delivery-nome">Nome do cliente *</label>
        <input
          id="delivery-nome"
          data-testid="delivery-cliente-nome"
          type="text"
          value={clienteNome}
          onChange={(e) => setClienteNome(e.target.value)}
          disabled={carregando || enviando}
          autoComplete="off"
        />
      </div>

      <div className="formulario-delivery__campo">
        <label htmlFor="delivery-telefone">Telefone</label>
        <input
          id="delivery-telefone"
          data-testid="delivery-telefone"
          type="tel"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          disabled={carregando || enviando}
          placeholder="Opcional"
        />
      </div>

      <div className="formulario-delivery__campo">
        <label htmlFor="delivery-observacao">Observacao</label>
        <textarea
          id="delivery-observacao"
          data-testid="delivery-observacao"
          rows={2}
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          disabled={carregando || enviando}
          placeholder="Opcional"
        />
      </div>

      <div className="formulario-delivery__campo">
        <label htmlFor="delivery-taxa">Taxa de entrega (R$)</label>
        <input
          id="delivery-taxa"
          data-testid="delivery-taxa-entrega"
          type="text"
          inputMode="decimal"
          value={taxaReaisStr}
          onChange={(e) => setTaxaReaisStr(e.target.value)}
          disabled={carregando || enviando}
        />
        {taxaPreview !== null ? (
          <span className="formulario-delivery__dica">{formatarMoeda(taxaPreview)}</span>
        ) : null}
      </div>

      {erro ? (
        <p className="formulario-delivery__erro" role="alert">
          {erro}
        </p>
      ) : null}

      <div className="formulario-delivery__acoes">
        <button
          type="button"
          className="formulario-delivery__botao-cancelar"
          data-testid="delivery-cancelar"
          disabled={carregando || enviando}
          onClick={onCancelar}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="formulario-delivery__botao-confirmar"
          data-testid="delivery-confirmar"
          disabled={carregando || enviando}
        >
          Criar Delivery
        </button>
      </div>
    </form>
  )
}
