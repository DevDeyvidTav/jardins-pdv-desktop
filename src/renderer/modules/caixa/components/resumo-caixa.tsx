import { formatarMoeda } from '@shared/utils/moeda'
import type { ResumoCaixaAtual } from '@shared/types/movimento-caixa'

interface ResumoCaixaProps {
  resumo: ResumoCaixaAtual
}

export function ResumoCaixa({ resumo }: ResumoCaixaProps) {
  return (
    <section className="resumo-caixa" data-testid="resumo-caixa">
      <p className="resumo-caixa__status">Caixa aberto</p>
      <dl className="resumo-caixa__lista">
        <div>
          <dt>Operador</dt>
          <dd data-testid="caixa-operador">{resumo.sessao.operadorNome}</dd>
        </div>
        <div>
          <dt>Saldo inicial</dt>
          <dd data-testid="caixa-saldo-inicial">
            {formatarMoeda(resumo.saldoInicialCentavos)}
          </dd>
        </div>
        <div>
          <dt>Total suprimentos</dt>
          <dd data-testid="caixa-total-suprimentos">
            {formatarMoeda(resumo.totalSuprimentosCentavos)}
          </dd>
        </div>
        <div>
          <dt>Total sangrias</dt>
          <dd data-testid="caixa-total-sangrias">
            {formatarMoeda(resumo.totalSangriasCentavos)}
          </dd>
        </div>
        <div>
          <dt>Total retiradas</dt>
          <dd data-testid="caixa-total-retiradas">
            {formatarMoeda(resumo.totalRetiradasCentavos)}
          </dd>
        </div>
        <div>
          <dt>Saldo esperado</dt>
          <dd data-testid="caixa-saldo-atual">
            {formatarMoeda(resumo.saldoAtualEsperadoCentavos)}
          </dd>
        </div>
      </dl>
    </section>
  )
}
