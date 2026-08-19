import type { ItemHistoricoPedido } from '@shared/types/pedido'
import { formatarMoeda } from '@shared/utils/moeda'
import { ROTULOS_FORMA_PAGAMENTO } from '@shared/types/pagamento-pedido'

interface HistoricoPedidosListaProps {
  itens: ItemHistoricoPedido[]
  pedidoSelecionadoId: string | null
  onSelecionar: (item: ItemHistoricoPedido) => void
}

function formatarQuando(item: ItemHistoricoPedido): string {
  const dataIso =
    item.pedido.finalizadoEm ?? item.pedido.canceladoEm ?? item.pedido.atualizadoEm
  return new Date(dataIso).toLocaleString('pt-BR')
}

export function HistoricoPedidosLista({
  itens,
  pedidoSelecionadoId,
  onSelecionar,
}: HistoricoPedidosListaProps) {
  if (itens.length === 0) {
    return (
      <p className="historico-pedidos__vazio" data-testid="historico-pedidos-vazio">
        Nenhum pedido encontrado no historico.
      </p>
    )
  }

  return (
    <section className="historico-pedidos" data-testid="historico-pedidos">
      <div className="historico-pedidos__cabecalho" aria-hidden>
        <span>Quando</span>
        <span>Origem</span>
        <span>Status</span>
        <span>Pagamento</span>
        <span>Total</span>
      </div>

      <ul className="historico-pedidos__itens">
        {itens.map((item) => {
          const selecionado = pedidoSelecionadoId === item.pedido.id
          const origem =
            item.pedido.tipo === 'BALCAO'
              ? 'Balcao'
              : item.pedido.tipo === 'DELIVERY'
                ? 'Delivery'
                : item.mesaNumero != null
                  ? `Mesa ${item.mesaNumero}`
                  : 'Mesa'
          const origemComRef =
            item.pedido.referencia > 0 ? `#${item.pedido.referencia} · ${origem}` : origem

          return (
            <li key={item.pedido.id}>
              <button
                type="button"
                className={[
                  'historico-pedidos__item',
                  selecionado ? 'historico-pedidos__item--selecionado' : '',
                  item.pedido.status === 'CANCELADO'
                    ? 'historico-pedidos__item--cancelado'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                data-testid="item-historico-pedido"
                data-status={item.pedido.status}
                data-referencia={item.pedido.referencia}
                onClick={() => onSelecionar(item)}
              >
                <span className="historico-pedidos__quando">{formatarQuando(item)}</span>
                <span className="historico-pedidos__origem">{origemComRef}</span>
                <span
                  className={`historico-pedidos__status historico-pedidos__status--${item.pedido.status.toLowerCase()}`}
                >
                  {item.pedido.status === 'FINALIZADO' ? 'Finalizado' : 'Cancelado'}
                </span>
                <span className="historico-pedidos__formas">
                  {item.formasPagamento.length > 0
                    ? item.formasPagamento
                        .map((forma) => ROTULOS_FORMA_PAGAMENTO[forma] ?? forma)
                        .join(', ')
                    : '—'}
                </span>
                <span className="historico-pedidos__total">
                  {formatarMoeda(item.pedido.totalCentavos)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
