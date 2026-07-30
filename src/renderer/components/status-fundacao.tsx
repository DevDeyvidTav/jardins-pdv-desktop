import type { InformacoesSistema } from '@shared/types/informacoes-sistema'

interface StatusFundacaoProps {
  informacoes: InformacoesSistema
}

function formatarStatus(ativo: boolean): string {
  return ativo ? 'Inicializado' : 'Pendente'
}

export function StatusFundacao({ informacoes }: StatusFundacaoProps) {
  return (
    <dl className="status-fundacao">
      <div className="status-fundacao__item">
        <dt>Versao</dt>
        <dd>{informacoes.versao}</dd>
      </div>
      <div className="status-fundacao__item">
        <dt>Banco local (SQLite)</dt>
        <dd data-testid="status-banco-local">
          {formatarStatus(informacoes.bancoLocalInicializado)}
        </dd>
      </div>
      <div className="status-fundacao__item">
        <dt>Electron</dt>
        <dd data-testid="status-electron">
          {formatarStatus(informacoes.electronAtivo)}
        </dd>
      </div>
    </dl>
  )
}
