import { AberturaCaixaPage } from '../modules/caixa/pages/abertura-caixa.page'
import { CaixaAtualPage } from '../modules/caixa/pages/caixa-atual.page'
import { FechamentoCaixaPage } from '../modules/caixa/pages/fechamento-caixa.page'
import { PosFechamentoCaixaPage } from '../modules/caixa/pages/pos-fechamento-caixa.page'
import { useCaixa } from '../modules/caixa/hooks/use-caixa'
import { STATUS_SESSAO_CAIXA } from '@shared/types/sessao-caixa'

export function App() {
  const caixa = useCaixa()

  if (caixa.carregando) {
    return (
      <main className="app-carregando" data-testid="app-carregando">
        <p>Carregando...</p>
      </main>
    )
  }

  if (
    !caixa.sessaoAberta &&
    caixa.paginaAtiva === 'pos-fechamento' &&
    caixa.ultimaSessao?.status === STATUS_SESSAO_CAIXA.FECHADO
  ) {
    return <PosFechamentoCaixaPage caixa={caixa} />
  }

  if (!caixa.sessaoAberta) {
    return <AberturaCaixaPage caixa={caixa} />
  }

  if (caixa.paginaAtiva === 'fechamento') {
    return <FechamentoCaixaPage caixa={caixa} />
  }

  return <CaixaAtualPage caixa={caixa} />
}
