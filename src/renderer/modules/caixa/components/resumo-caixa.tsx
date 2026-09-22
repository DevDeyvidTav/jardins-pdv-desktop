import { formatarMoeda } from '@shared/utils/moeda'
import type { ResumoCaixaAtual } from '@shared/types/movimento-caixa'

interface ResumoCaixaProps {
  resumo: ResumoCaixaAtual
  compacto?: boolean
}

export function ResumoCaixa({ resumo, compacto = false }: ResumoCaixaProps) {
  return (
    <section
      className={compacto ? 'resumo-caixa resumo-caixa--cupom' : 'resumo-caixa'}
      data-testid="resumo-caixa"
    >
      {!compacto ? <p className="resumo-caixa__status">Caixa aberto</p> : null}

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
          <dt>Suprimentos</dt>
          <dd data-testid="caixa-total-suprimentos">
            {formatarMoeda(resumo.totalSuprimentosCentavos)}
          </dd>
        </div>
        <div>
          <dt>Retiradas</dt>
          <dd data-testid="caixa-total-retiradas">
            {formatarMoeda(resumo.totalRetiradasCentavos)}
          </dd>
        </div>
        <div>
          <dt>Vendas dinheiro</dt>
          <dd data-testid="caixa-vendas-dinheiro">
            {formatarMoeda(resumo.totalVendasDinheiroCentavos)}
          </dd>
        </div>
        <div>
          <dt>Vendas credito</dt>
          <dd data-testid="caixa-vendas-credito">
            {formatarMoeda(resumo.totalVendasCartaoCreditoCentavos)}
          </dd>
        </div>
        <div>
          <dt>Vendas debito</dt>
          <dd data-testid="caixa-vendas-debito">
            {formatarMoeda(resumo.totalVendasCartaoDebitoCentavos)}
          </dd>
        </div>
        <div>
          <dt>Vendas Pix (maquineta)</dt>
          <dd data-testid="caixa-vendas-pix-maquineta">
            {formatarMoeda(resumo.totalVendasPixMaquinetaCentavos)}
          </dd>
        </div>
        <div>
          <dt>Vendas Pix (CNPJ)</dt>
          <dd data-testid="caixa-vendas-pix-cnpj">
            {formatarMoeda(resumo.totalVendasPixCnpjCentavos)}
          </dd>
        </div>
        <div>
          <dt>Vendas talão</dt>
          <dd data-testid="caixa-vendas-talao">
            {formatarMoeda(resumo.totalVendasTalaoCentavos)}
          </dd>
        </div>
        <div>
          <dt>Recebimento talão</dt>
          <dd data-testid="caixa-recebimento-talao">
            {formatarMoeda(resumo.totalRecebimentoTalaoCentavos)}
          </dd>
        </div>
        <div className="resumo-caixa__linha--destaque">
          <dt>Total vendas</dt>
          <dd data-testid="caixa-total-vendas">
            {formatarMoeda(resumo.totalVendasCentavos)}
          </dd>
        </div>
        <div className="resumo-caixa__linha--saldo">
          <dt>Saldo esperado</dt>
          <dd data-testid="caixa-saldo-atual">
            {formatarMoeda(resumo.saldoAtualEsperadoCentavos)}
          </dd>
        </div>
      </dl>
    </section>
  )
}
