import type { UseSyncEstadoResultado } from '../hooks/use-sync-estado'

interface PainelSyncStatusProps {
  sync: UseSyncEstadoResultado
  apiUrl: string | null
  apiConfigurada: boolean
}

function formatarData(iso: string | null): string {
  if (!iso) {
    return '—'
  }

  return new Date(iso).toLocaleString('pt-BR')
}

export function PainelSyncStatus({
  sync,
  apiUrl,
  apiConfigurada,
}: PainelSyncStatusProps) {
  const estado = sync.estado

  return (
    <section className="config-sync" data-testid="painel-sync-status">
      <h2>Sincronização</h2>

      <dl className="config-sync__lista">
        <div>
          <dt>URL da API</dt>
          <dd>{apiUrl ?? '(não configurada — variável PDV_SYNC_API_URL)'}</dd>
        </div>
        <div>
          <dt>API configurada</dt>
          <dd>{apiConfigurada ? 'Sim' : 'Não'}</dd>
        </div>
        <div>
          <dt>Último sucesso</dt>
          <dd>{formatarData(estado?.ultimoSucessoEm ?? null)}</dd>
        </div>
        <div>
          <dt>Última tentativa</dt>
          <dd>{formatarData(estado?.ultimaTentativaEm ?? null)}</dd>
        </div>
        <div>
          <dt>Pendências</dt>
          <dd>{estado?.pendente ?? (sync.carregando ? '…' : 0)}</dd>
        </div>
        <div>
          <dt>Sincronizados</dt>
          <dd>{estado?.sincronizado ?? 0}</dd>
        </div>
        {estado?.ultimoErro ? (
          <div className="config-sync__erro">
            <dt>Último erro</dt>
            <dd>{estado.ultimoErro}</dd>
          </div>
        ) : null}
      </dl>

      {sync.erro ? <p className="config-erro">{sync.erro}</p> : null}

      <button type="button" onClick={() => void sync.recarregar()}>
        Atualizar status
      </button>
    </section>
  )
}
