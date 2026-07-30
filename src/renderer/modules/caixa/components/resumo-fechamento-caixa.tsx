import { formatarMoeda } from '@shared/utils/moeda'
import type { SessaoCaixa } from '@shared/types/sessao-caixa'

interface ResumoFechamentoCaixaProps {
  sessao: SessaoCaixa
}

export function ResumoFechamentoCaixa({ sessao }: ResumoFechamentoCaixaProps) {
  return (
    <section className="resumo-fechamento-caixa" data-testid="resumo-fechamento-caixa">
      <p className="resumo-fechamento-caixa__status">Caixa fechado</p>
      <dl className="resumo-fechamento-caixa__lista">
        <div>
          <dt>Operador</dt>
          <dd>{sessao.operadorNome}</dd>
        </div>
        <div>
          <dt>Saldo inicial</dt>
          <dd data-testid="fechamento-saldo-inicial">
            {formatarMoeda(sessao.saldoInicialCentavos)}
          </dd>
        </div>
        <div>
          <dt>Saldo esperado</dt>
          <dd data-testid="fechamento-saldo-esperado">
            {formatarMoeda(sessao.saldoFinalEsperadoCentavos ?? 0)}
          </dd>
        </div>
        <div>
          <dt>Valor contado</dt>
          <dd data-testid="fechamento-valor-contado">
            {formatarMoeda(sessao.saldoFinalInformadoCentavos ?? 0)}
          </dd>
        </div>
        <div>
          <dt>Diferenca</dt>
          <dd data-testid="fechamento-diferenca">
            {formatarMoeda(sessao.diferencaCentavos ?? 0)}
          </dd>
        </div>
        {sessao.observacaoFechamento ? (
          <div>
            <dt>Observacao</dt>
            <dd data-testid="fechamento-observacao">{sessao.observacaoFechamento}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  )
}
