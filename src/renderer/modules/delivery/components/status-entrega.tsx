import type { PedidoEntrega, StatusEntrega } from '@shared/types/pedido'
import { STATUS_ENTREGA } from '@shared/types/pedido'

interface StatusEntregaProps {
  entrega: PedidoEntrega
  pedidoFinalizado: boolean
  onAvancar: (novoStatus: StatusEntrega) => Promise<void>
  carregando?: boolean
}

const PROXIMO_STATUS: Partial<Record<StatusEntrega, StatusEntrega>> = {
  [STATUS_ENTREGA.AGUARDANDO_PREPARO]: STATUS_ENTREGA.EM_PREPARO,
  [STATUS_ENTREGA.EM_PREPARO]: STATUS_ENTREGA.SAIU_PARA_ENTREGA,
  [STATUS_ENTREGA.SAIU_PARA_ENTREGA]: STATUS_ENTREGA.ENTREGUE,
}

const ROTULO_BOTAO: Partial<Record<StatusEntrega, string>> = {
  [STATUS_ENTREGA.AGUARDANDO_PREPARO]: 'Iniciar preparo',
  [STATUS_ENTREGA.EM_PREPARO]: 'Marcar como saiu para entrega',
  [STATUS_ENTREGA.SAIU_PARA_ENTREGA]: 'Marcar como entregue',
}

const PASSOS: StatusEntrega[] = [
  STATUS_ENTREGA.AGUARDANDO_PREPARO,
  STATUS_ENTREGA.EM_PREPARO,
  STATUS_ENTREGA.SAIU_PARA_ENTREGA,
  STATUS_ENTREGA.ENTREGUE,
]

const ROTULO_PASSO: Record<StatusEntrega, string> = {
  [STATUS_ENTREGA.AGUARDANDO_PREPARO]: 'Aguardando',
  [STATUS_ENTREGA.EM_PREPARO]: 'Preparando',
  [STATUS_ENTREGA.SAIU_PARA_ENTREGA]: 'A caminho',
  [STATUS_ENTREGA.ENTREGUE]: 'Entregue',
  [STATUS_ENTREGA.CANCELADA]: 'Cancelada',
}

export function StatusEntregaPanel({
  entrega,
  pedidoFinalizado,
  onAvancar,
  carregando = false,
}: StatusEntregaProps) {
  const proximoStatus = PROXIMO_STATUS[entrega.status]
  const podeMudar =
    proximoStatus !== undefined &&
    entrega.status !== STATUS_ENTREGA.CANCELADA

  const indiceAtual = PASSOS.indexOf(entrega.status)

  return (
    <div className="status-entrega" data-testid="status-entrega">
      <div className="status-entrega__passos" aria-label="Progresso da entrega">
        {PASSOS.map((passo, i) => (
          <div
            key={passo}
            className={`status-entrega__passo ${
              i < indiceAtual
                ? 'status-entrega__passo--concluido'
                : i === indiceAtual
                  ? 'status-entrega__passo--ativo'
                  : 'status-entrega__passo--pendente'
            }`}
            data-testid={`entrega-passo-${passo.toLowerCase()}`}
          >
            <span className="status-entrega__passo-rotulo">
              {ROTULO_PASSO[passo]}
            </span>
          </div>
        ))}
      </div>

      {entrega.status === STATUS_ENTREGA.CANCELADA && (
        <p className="status-entrega__cancelado" role="alert">
          Entrega cancelada
          {entrega.motivoCancelamento ? `: ${entrega.motivoCancelamento}` : '.'}
        </p>
      )}

      {podeMudar && !pedidoFinalizado && (
        <button
          type="button"
          className="status-entrega__botao-avancar"
          data-testid="delivery-avancar-status"
          onClick={() => void onAvancar(proximoStatus!)}
          disabled={carregando}
        >
          {carregando ? 'Aguarde...' : ROTULO_BOTAO[entrega.status]}
        </button>
      )}

      {pedidoFinalizado && proximoStatus !== undefined && (
        <button
          type="button"
          className="status-entrega__botao-avancar"
          data-testid="delivery-avancar-status"
          onClick={() => void onAvancar(proximoStatus)}
          disabled={carregando}
        >
          {carregando ? 'Aguarde...' : ROTULO_BOTAO[entrega.status]}
        </button>
      )}
    </div>
  )
}
