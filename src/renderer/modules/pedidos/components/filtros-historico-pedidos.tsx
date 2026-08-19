import type { FiltroStatusHistoricoPedido } from '@shared/types/pedido'
import { FILTRO_STATUS_HISTORICO_PEDIDO } from '@shared/types/pedido'
import { FORMA_PAGAMENTO, type FormaPagamento } from '@shared/types/pagamento-pedido'

interface FiltrosHistoricoPedidosProps {
  status: FiltroStatusHistoricoPedido
  formaPagamento: FormaPagamento | ''
  onAlterarStatus: (status: FiltroStatusHistoricoPedido) => void
  onAlterarFormaPagamento: (forma: FormaPagamento | '') => void
}

const OPCOES_STATUS: { valor: FiltroStatusHistoricoPedido; rotulo: string }[] = [
  { valor: FILTRO_STATUS_HISTORICO_PEDIDO.TODOS, rotulo: 'Todos' },
  { valor: FILTRO_STATUS_HISTORICO_PEDIDO.FINALIZADO, rotulo: 'Finalizados' },
  { valor: FILTRO_STATUS_HISTORICO_PEDIDO.CANCELADO, rotulo: 'Cancelados' },
]

const OPCOES_FORMA: { valor: FormaPagamento | ''; rotulo: string }[] = [
  { valor: '', rotulo: 'Todas as formas' },
  { valor: FORMA_PAGAMENTO.DINHEIRO, rotulo: 'Dinheiro' },
  { valor: FORMA_PAGAMENTO.CARTAO_CREDITO, rotulo: 'Crédito' },
  { valor: FORMA_PAGAMENTO.CARTAO_DEBITO, rotulo: 'Débito' },
  { valor: FORMA_PAGAMENTO.PIX_MAQUINETA, rotulo: 'Pix (maquineta)' },
  { valor: FORMA_PAGAMENTO.PIX_CNPJ, rotulo: 'Pix (CNPJ)' },
  { valor: FORMA_PAGAMENTO.TALAO, rotulo: 'Talão' },
  { valor: FORMA_PAGAMENTO.CORTESIA, rotulo: 'Cortesia' },
]

export function FiltrosHistoricoPedidos({
  status,
  formaPagamento,
  onAlterarStatus,
  onAlterarFormaPagamento,
}: FiltrosHistoricoPedidosProps) {
  return (
    <div className="filtros-historico-pedidos" data-testid="filtros-historico-pedidos">
      <div className="filtros-historico-pedidos__chips">
        {OPCOES_STATUS.map((opcao) => (
          <button
            key={opcao.valor}
            type="button"
            className="filtros-historico-pedidos__chip"
            data-ativo={status === opcao.valor}
            data-testid={`filtro-historico-status-${opcao.valor.toLowerCase()}`}
            onClick={() => onAlterarStatus(opcao.valor)}
          >
            {opcao.rotulo}
          </button>
        ))}
      </div>

      <label className="filtros-historico-pedidos__forma">
        Forma
        <select
          data-testid="filtro-historico-forma-pagamento"
          value={formaPagamento}
          onChange={(evento) =>
            onAlterarFormaPagamento(evento.target.value as FormaPagamento | '')
          }
        >
          {OPCOES_FORMA.map((opcao) => (
            <option key={opcao.valor || 'todas'} value={opcao.valor}>
              {opcao.rotulo}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
