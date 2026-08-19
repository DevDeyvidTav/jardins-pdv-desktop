import type { PedidoEntrega } from '@shared/types/pedido'

interface DadosEntregaProps {
  entrega: PedidoEntrega
}

const ROTULO_STATUS: Record<string, string> = {
  AGUARDANDO_PREPARO: 'Aguardando preparo',
  EM_PREPARO: 'Em preparo',
  SAIU_PARA_ENTREGA: 'Saiu para entrega',
  ENTREGUE: 'Entregue',
  CANCELADA: 'Cancelada',
}

export function DadosEntrega({ entrega }: DadosEntregaProps) {
  return (
    <div className="dados-entrega" data-testid="dados-entrega">
      <div className="dados-entrega__linha">
        <span className="dados-entrega__label">Cliente</span>
        <span className="dados-entrega__valor" data-testid="entrega-cliente-nome">
          {entrega.clienteNome.trim() || 'Não informado'}
        </span>
      </div>
      {entrega.telefone ? (
        <div className="dados-entrega__linha">
          <span className="dados-entrega__label">Telefone</span>
          <span className="dados-entrega__valor" data-testid="entrega-telefone">
            {entrega.telefone}
          </span>
        </div>
      ) : null}
      {entrega.endereco ? (
        <div className="dados-entrega__linha">
          <span className="dados-entrega__label">Endereco</span>
          <span className="dados-entrega__valor" data-testid="entrega-endereco">
            {entrega.endereco}
          </span>
        </div>
      ) : null}
      {entrega.observacao ? (
        <div className="dados-entrega__linha">
          <span className="dados-entrega__label">Observacao</span>
          <span className="dados-entrega__valor" data-testid="entrega-observacao">
            {entrega.observacao}
          </span>
        </div>
      ) : null}
      <div className="dados-entrega__linha">
        <span className="dados-entrega__label">Status</span>
        <span
          className={`dados-entrega__status dados-entrega__status--${entrega.status.toLowerCase()}`}
          data-testid="entrega-status"
        >
          {ROTULO_STATUS[entrega.status] ?? entrega.status}
        </span>
      </div>
    </div>
  )
}
