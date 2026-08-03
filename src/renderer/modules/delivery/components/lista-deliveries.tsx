import type { ItemDeliveryAberto } from '@shared/types/pedido'
import { formatarCentavosParaReais } from '@shared/utils/moeda'

interface ListaDeliveriesProps {
  itens: ItemDeliveryAberto[]
  pedidoSelecionadoId: string | null
  onSelecionar: (pedidoId: string) => void
}

const COR_STATUS: Record<string, string> = {
  AGUARDANDO_PREPARO: '#e3f2fd',
  EM_PREPARO: '#fff8e1',
  SAIU_PARA_ENTREGA: '#e8f5e9',
  ENTREGUE: '#f3e5f5',
  CANCELADA: '#ffebee',
}

const ROTULO_STATUS: Record<string, string> = {
  AGUARDANDO_PREPARO: 'Aguardando',
  EM_PREPARO: 'Preparando',
  SAIU_PARA_ENTREGA: 'A caminho',
  ENTREGUE: 'Entregue',
  CANCELADA: 'Cancelada',
}

export function ListaDeliveries({
  itens,
  pedidoSelecionadoId,
  onSelecionar,
}: ListaDeliveriesProps) {
  if (itens.length === 0) {
    return (
      <p
        className="lista-deliveries__vazio"
        data-testid="estado-vazio-deliveries"
      >
        Nenhum delivery em aberto.
      </p>
    )
  }

  return (
    <ul className="lista-deliveries" data-testid="lista-deliveries">
      {itens.map(({ pedido, entrega }) => {
        const selecionado = pedido.id === pedidoSelecionadoId
        return (
          <li
            key={pedido.id}
            className={`lista-deliveries__item${selecionado ? ' lista-deliveries__item--selecionado' : ''}`}
            style={{ borderLeftColor: COR_STATUS[entrega.status] ?? '#eee' }}
            data-testid="item-delivery"
            data-pedido-id={pedido.id}
          >
            <button
              type="button"
              className="lista-deliveries__botao"
              onClick={() => onSelecionar(pedido.id)}
              aria-pressed={selecionado}
            >
              <span className="lista-deliveries__cliente" data-testid="delivery-item-cliente">
                {entrega.clienteNome}
              </span>
              <span className="lista-deliveries__telefone">
                {entrega.telefone ?? '—'}
              </span>
              {entrega.observacao ? (
                <span className="lista-deliveries__observacao">{entrega.observacao}</span>
              ) : null}
              <span
                className="lista-deliveries__status"
                data-testid="delivery-item-status"
              >
                {ROTULO_STATUS[entrega.status] ?? entrega.status}
              </span>
              <span className="lista-deliveries__total" data-testid="delivery-item-total">
                {formatarCentavosParaReais(pedido.totalCentavos)}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
