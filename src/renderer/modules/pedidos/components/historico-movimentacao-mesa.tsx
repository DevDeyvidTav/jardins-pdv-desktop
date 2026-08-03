import type { PedidoMesaMovimentacao } from '@shared/types/mesa'
import { TIPO_MOVIMENTACAO_MESA } from '@shared/types/mesa'

interface HistoricoMovimentacaoMesaProps {
  itens: PedidoMesaMovimentacao[]
}

const ROTULOS: Record<string, string> = {
  [TIPO_MOVIMENTACAO_MESA.PEDIDO_ABERTO_NA_MESA]: 'Pedido aberto',
  [TIPO_MOVIMENTACAO_MESA.PEDIDO_TRANSFERIDO]: 'Transferencia',
  [TIPO_MOVIMENTACAO_MESA.MESAS_AGRUPADAS]: 'Agrupamento',
  [TIPO_MOVIMENTACAO_MESA.AGRUPAMENTO_ENCERRADO]: 'Agrupamento encerrado',
  [TIPO_MOVIMENTACAO_MESA.PEDIDO_FINALIZADO]: 'Pedido finalizado',
  [TIPO_MOVIMENTACAO_MESA.PEDIDO_CANCELADO]: 'Pedido cancelado',
}

export function HistoricoMovimentacaoMesa({ itens }: HistoricoMovimentacaoMesaProps) {
  if (itens.length === 0) {
    return (
      <div className="historico-movimentacao" data-testid="historico-movimentacao-vazio">
        <p>Sem movimentacoes registradas.</p>
      </div>
    )
  }

  return (
    <div className="historico-movimentacao" data-testid="historico-movimentacao-pedido">
      <h3>Historico do pedido</h3>
      <ol className="historico-movimentacao__lista">
        {itens.map((item) => (
          <li key={item.id} data-testid="item-historico-movimentacao">
            <strong>{ROTULOS[item.tipo] ?? item.tipo}</strong>
            <span>{new Date(item.criadoEm).toLocaleString('pt-BR')}</span>
            {item.motivo ? <span>Motivo: {item.motivo}</span> : null}
          </li>
        ))}
      </ol>
    </div>
  )
}
