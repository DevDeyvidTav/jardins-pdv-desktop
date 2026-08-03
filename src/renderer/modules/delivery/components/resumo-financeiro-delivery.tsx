import type { Pedido } from '@shared/types/pedido'
import { formatarCentavosParaReais } from '@shared/utils/moeda'

interface ResumoFinanceiroDeliveryProps {
  pedido: Pedido
  taxaEditavel?: boolean
  onAtualizarTaxa?: (taxaCentavos: number) => Promise<void>
}

export function ResumoFinanceiroDelivery({
  pedido,
  taxaEditavel = false,
  onAtualizarTaxa,
}: ResumoFinanceiroDeliveryProps) {
  function handleAtualizarTaxa() {
    if (!onAtualizarTaxa) return
    const input = window.prompt(
      'Nova taxa de entrega (R$):',
      (pedido.taxaEntregaCentavos / 100).toFixed(2).replace('.', ','),
    )
    if (input === null) return
    const normalizado = input.replace(/\./g, '').replace(',', '.')
    const valor = parseFloat(normalizado)
    if (isNaN(valor) || valor < 0) {
      alert('Valor invalido para taxa de entrega.')
      return
    }
    void onAtualizarTaxa(Math.round(valor * 100))
  }

  return (
    <div className="resumo-financeiro-delivery" data-testid="resumo-financeiro-delivery">
      <div className="resumo-financeiro-delivery__linha">
        <span>Subtotal itens</span>
        <span data-testid="delivery-subtotal">
          {formatarCentavosParaReais(pedido.subtotalCentavos)}
        </span>
      </div>
      {pedido.descontoItensCentavos > 0 && (
        <div className="resumo-financeiro-delivery__linha resumo-financeiro-delivery__linha--desconto">
          <span>Desconto nos itens</span>
          <span data-testid="delivery-desconto-itens">
            − {formatarCentavosParaReais(pedido.descontoItensCentavos)}
          </span>
        </div>
      )}
      {pedido.descontoPedidoCentavos > 0 && (
        <div className="resumo-financeiro-delivery__linha resumo-financeiro-delivery__linha--desconto">
          <span>Desconto geral</span>
          <span data-testid="delivery-desconto-pedido">
            − {formatarCentavosParaReais(pedido.descontoPedidoCentavos)}
          </span>
        </div>
      )}
      <div className="resumo-financeiro-delivery__linha">
        <span>Taxa de entrega</span>
        <span data-testid="delivery-taxa-entrega">
          {formatarCentavosParaReais(pedido.taxaEntregaCentavos)}
          {taxaEditavel && (
            <button
              type="button"
              className="resumo-financeiro-delivery__editar-taxa"
              data-testid="delivery-editar-taxa"
              onClick={handleAtualizarTaxa}
              title="Alterar taxa de entrega"
            >
              Editar
            </button>
          )}
        </span>
      </div>
      <div className="resumo-financeiro-delivery__linha resumo-financeiro-delivery__linha--total">
        <span>Total</span>
        <span data-testid="delivery-total">
          {formatarCentavosParaReais(pedido.totalCentavos)}
        </span>
      </div>
      {pedido.valorPagoCentavos > 0 && (
        <div className="resumo-financeiro-delivery__linha">
          <span>Pago</span>
          <span data-testid="delivery-valor-pago">
            {formatarCentavosParaReais(pedido.valorPagoCentavos)}
          </span>
        </div>
      )}
      {pedido.valorCortesiaCentavos > 0 && (
        <div className="resumo-financeiro-delivery__linha">
          <span>Cortesia</span>
          <span data-testid="delivery-cortesia">
            {formatarCentavosParaReais(pedido.valorCortesiaCentavos)}
          </span>
        </div>
      )}
      <div className="resumo-financeiro-delivery__linha resumo-financeiro-delivery__linha--restante">
        <span>Restante</span>
        <span data-testid="delivery-restante">
          {formatarCentavosParaReais(pedido.valorRestanteCentavos)}
        </span>
      </div>
    </div>
  )
}
