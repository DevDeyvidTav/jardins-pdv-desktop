import { formatarMoeda } from '@shared/utils/moeda'
import type { SessaoCaixa } from '@shared/types/sessao-caixa'

interface ResumoCaixaAbertoProps {
  sessao: SessaoCaixa
}

export function ResumoCaixaAberto({ sessao }: ResumoCaixaAbertoProps) {
  return (
    <section
      className="resumo-caixa-aberto"
      data-testid="resumo-caixa-aberto"
    >
      <p className="resumo-caixa-aberto__status">Caixa aberto</p>
      <dl className="resumo-caixa-aberto__lista">
        <div>
          <dt>Operador</dt>
          <dd data-testid="caixa-operador">{sessao.operadorNome}</dd>
        </div>
        <div>
          <dt>Saldo inicial</dt>
          <dd data-testid="caixa-saldo-inicial">
            {formatarMoeda(sessao.saldoInicialCentavos)}
          </dd>
        </div>
        <div>
          <dt>Aberto em</dt>
          <dd>{new Date(sessao.abertoEm).toLocaleString('pt-BR')}</dd>
        </div>
      </dl>
    </section>
  )
}
