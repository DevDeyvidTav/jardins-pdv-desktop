import type { ItemDeliveryAberto } from '@shared/types/pedido'

interface ListaDeliveriesProps {
  itens: ItemDeliveryAberto[]
  pedidoSelecionadoId: string | null
  onSelecionar: (pedidoId: string) => void
  variant?: 'lista' | 'grade'
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
  variant = 'grade',
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

  if (variant === 'grade') {
    return (
      <div className="grade-deliveries" data-testid="lista-deliveries">
        {itens.map(({ pedido, entrega }) => {
          const selecionado = pedido.id === pedidoSelecionadoId
          const nome = entrega.clienteNome.trim() || 'Delivery'
          return (
            <button
              key={pedido.id}
              type="button"
              className={`grade-deliveries__celula${
                selecionado ? ' grade-deliveries__celula--selecionada' : ''
              }`}
              data-testid="item-delivery"
              data-pedido-id={pedido.id}
              data-status={entrega.status}
              aria-pressed={selecionado}
              aria-label={`Delivery ${nome}`}
              title={`${nome} · ${ROTULO_STATUS[entrega.status] ?? entrega.status}`}
              onClick={() => onSelecionar(pedido.id)}
            >
              <span className="grade-deliveries__nome" data-testid="delivery-item-cliente">
                {nome}
              </span>
              <span className="visually-hidden" data-testid="delivery-item-status">
                {ROTULO_STATUS[entrega.status] ?? entrega.status}
              </span>
            </button>
          )
        })}
      </div>
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
              <span
                className="lista-deliveries__status"
                data-testid="delivery-item-status"
              >
                {ROTULO_STATUS[entrega.status] ?? entrega.status}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
