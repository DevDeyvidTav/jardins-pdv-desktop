import { formatarMoeda } from '@shared/utils/moeda'
import type { MovimentoCaixa } from '@shared/types/movimento-caixa'

interface ListaMovimentosCaixaProps {
  movimentos: MovimentoCaixa[]
}

const ROTULOS_TIPO: Record<MovimentoCaixa['tipo'], string> = {
  SUPRIMENTO: 'Suprimento',
  SANGRIA: 'Sangria',
  RETIRADA: 'Retirada',
}

export function ListaMovimentosCaixa({ movimentos }: ListaMovimentosCaixaProps) {
  if (movimentos.length === 0) {
    return (
      <section className="lista-movimentos-caixa" data-testid="lista-movimentos-caixa">
        <h2>Movimentos</h2>
        <p className="lista-movimentos-caixa__vazio">Nenhum movimento registrado.</p>
      </section>
    )
  }

  return (
    <section className="lista-movimentos-caixa" data-testid="lista-movimentos-caixa">
      <h2>Movimentos</h2>
      <ul className="lista-movimentos-caixa__itens">
        {movimentos.map((movimento) => (
          <li
            key={movimento.id}
            data-testid="item-movimento-caixa"
            data-tipo={movimento.tipo}
          >
            <div>
              <strong>{ROTULOS_TIPO[movimento.tipo]}</strong>
              <span>{formatarMoeda(movimento.valorCentavos)}</span>
            </div>
            {movimento.descricao ? <p>{movimento.descricao}</p> : null}
            <time dateTime={movimento.criadoEm}>
              {new Date(movimento.criadoEm).toLocaleString('pt-BR')}
            </time>
          </li>
        ))}
      </ul>
    </section>
  )
}
