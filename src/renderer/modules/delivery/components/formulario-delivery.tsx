import { useState, type FormEvent } from 'react'
import type { Cliente } from '@shared/types/cliente'
import type { CriarPedidoDeliveryEntrada } from '@shared/types/pedido'
import { converterReaisParaCentavos, formatarMoeda } from '@shared/utils/moeda'

function formatarCentavosParaInput(centavos: number): string {
  return (centavos / 100).toFixed(2).replace('.', ',')
}

interface FormularioDeliveryProps {
  carregando: boolean
  taxaPadraoCentavos: number
  clientes?: Cliente[]
  onCriar: (entrada: CriarPedidoDeliveryEntrada) => Promise<unknown>
  onCancelar: () => void
}

export function FormularioDelivery({
  carregando,
  taxaPadraoCentavos,
  clientes = [],
  onCriar,
  onCancelar,
}: FormularioDeliveryProps) {
  const [clienteId, setClienteId] = useState('')
  const [clienteNome, setClienteNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [endereco, setEndereco] = useState('')
  const [observacao, setObservacao] = useState('')
  const [taxaReaisStr, setTaxaReaisStr] = useState(
    formatarCentavosParaInput(taxaPadraoCentavos),
  )
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)

    if (clienteNome.trim().length === 1) {
      setErro('Nome do cliente deve ter no minimo 2 caracteres quando informado.')
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
        clienteNome: clienteNome.trim() || undefined,
        telefone: telefone.trim() || undefined,
        endereco: endereco.trim() || undefined,
        observacao: observacao.trim() || undefined,
        clienteId: clienteId || undefined,
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
        <label htmlFor="delivery-cliente-cadastrado">Cliente cadastrado</label>
        <select
          id="delivery-cliente-cadastrado"
          data-testid="delivery-cliente-id"
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          disabled={carregando || enviando}
        >
          <option value="">Nenhum</option>
          {clientes
            .filter((cliente) => cliente.ativo)
            .map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome}
                {cliente.liberaTalao ? ' · talão' : ''}
              </option>
            ))}
        </select>
      </div>

      <div className="formulario-delivery__campo">
        <label htmlFor="delivery-nome">Nome do cliente</label>
        <input
          id="delivery-nome"
          data-testid="delivery-cliente-nome"
          type="text"
          value={clienteNome}
          onChange={(e) => setClienteNome(e.target.value)}
          disabled={carregando || enviando}
          autoComplete="off"
          placeholder="Opcional"
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
        <label htmlFor="delivery-endereco">Endereco</label>
        <input
          id="delivery-endereco"
          data-testid="delivery-endereco"
          type="text"
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
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
