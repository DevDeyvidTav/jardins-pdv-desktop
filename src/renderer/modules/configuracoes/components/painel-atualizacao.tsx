import type { EstadoAtualizacao } from '@shared/types/atualizacao'

type Props = {
  estado: EstadoAtualizacao | null
  carregando: boolean
  erro: string | null
  onVerificar: () => void
  onInstalar: () => void
}

export function PainelAtualizacao({
  estado,
  carregando,
  erro,
  onVerificar,
  onInstalar,
}: Props) {
  return (
    <section className="config-atualizacao" data-testid="painel-atualizacao">
      <h2>Versão e atualizações</h2>
      <p className="config-atualizacao__intro">
        O PDV verifica sozinho se existe versão nova na internet. Quando encontra,
        baixa em segundo plano e avisa aqui. Seus pedidos e dados do caixa continuam
        no computador — a atualização só troca o programa.
      </p>

      <dl className="config-atualizacao__resumo">
        <div>
          <dt>Versão instalada</dt>
          <dd>{estado?.versaoAtual ?? '—'}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{estado?.mensagem ?? (carregando ? 'Carregando...' : '—')}</dd>
        </div>
        {estado?.versaoDisponivel ? (
          <div>
            <dt>Nova versão</dt>
            <dd>{estado.versaoDisponivel}</dd>
          </div>
        ) : null}
        {estado?.progressoPercentual != null && estado.baixando ? (
          <div>
            <dt>Download</dt>
            <dd>{estado.progressoPercentual}%</dd>
          </div>
        ) : null}
      </dl>

      {estado?.baixando && estado.progressoPercentual != null ? (
        <div
          className="config-atualizacao__barra"
          role="progressbar"
          aria-valuenow={estado.progressoPercentual}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span style={{ width: `${estado.progressoPercentual}%` }} />
        </div>
      ) : null}

      {erro ? (
        <p className="config-erro" role="alert">
          {erro}
        </p>
      ) : null}
      {estado?.erro ? (
        <p className="config-erro" role="alert">
          {estado.erro}
        </p>
      ) : null}

      <div className="config-atualizacao__acoes">
        <button type="button" disabled={carregando} onClick={onVerificar}>
          Verificar agora
        </button>
        {estado?.baixada ? (
          <button type="button" className="config-atualizacao__instalar" onClick={onInstalar}>
            Reiniciar e instalar
          </button>
        ) : null}
      </div>

      {!estado?.ativo ? (
        <p className="config-atualizacao__aviso">
          Atualização automática funciona no instalador oficial (.exe). No modo
          desenvolvimento ela fica desligada.
        </p>
      ) : null}
    </section>
  )
}
