import { formatarMoeda } from '@shared/utils/moeda'
import type { MovimentoCaixa } from '@shared/types/movimento-caixa'

interface ListaMovimentosCaixaProps {
  movimentos: MovimentoCaixa[]
  compacto?: boolean
}

const ROTULOS_TIPO: Record<MovimentoCaixa['tipo'], string> = {
  SUPRIMENTO: 'Suprimento',
  RETIRADA: 'Retirada',
}

export function ListaMovimentosCaixa({
  movimentos,
  compacto = false,
}: ListaMovimentosCaixaProps) {
  if (movimentos.length === 0) {
    return (
      <section
        className={
          compacto
            ? 'lista-movimentos-caixa lista-movimentos-caixa--compacta'
            : 'lista-movimentos-caixa'
        }
        data-testid="lista-movimentos-caixa"
      >
        {!compacto ? <h2>Movimentos</h2> : null}
        <p className="lista-movimentos-caixa__vazio">Nenhum movimento registrado.</p>
      </section>
    )
  }

  return (
    <section
      className={
        compacto
          ? 'lista-movimentos-caixa lista-movimentos-caixa--compacta'
          : 'lista-movimentos-caixa'
      }
      data-testid="lista-movimentos-caixa"
    >
      {!compacto ? <h2>Movimentos</h2> : null}

      {compacto ? (
        <div className="lista-movimentos-caixa__cabecalho" aria-hidden>
          <span>Tipo</span>
          <span>Descricao</span>
          <span>Valor</span>
          <span>Quando</span>
        </div>
      ) : null}

      <ul className="lista-movimentos-caixa__itens">
        {movimentos.map((movimento) => (
          <li
            key={movimento.id}
            className={`lista-movimentos-caixa__item lista-movimentos-caixa__item--${movimento.tipo.toLowerCase()}`}
            data-testid="item-movimento-caixa"
            data-tipo={movimento.tipo}
          >
            <strong className="lista-movimentos-caixa__tipo">
              {ROTULOS_TIPO[movimento.tipo]}
            </strong>
            <span className="lista-movimentos-caixa__descricao">
              {movimento.descricao || '—'}
            </span>
            <span className="lista-movimentos-caixa__valor">
              {formatarMoeda(movimento.valorCentavos)}
            </span>
            <time dateTime={movimento.criadoEm}>
              {new Date(movimento.criadoEm).toLocaleString('pt-BR')}
            </time>
          </li>
        ))}
      </ul>
    </section>
  )
}
