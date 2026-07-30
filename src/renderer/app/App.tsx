import { AberturaCaixaPage } from '../modules/caixa/pages/abertura-caixa.page'
import { CaixaAtualPage } from '../modules/caixa/pages/caixa-atual.page'
import { useCaixa, type UseCaixaResultado } from '../modules/caixa/hooks/use-caixa'

export function App() {
  const caixa = useCaixa()

  if (caixa.carregando) {
    return (
      <main className="app-carregando" data-testid="app-carregando">
        <p>Carregando...</p>
      </main>
    )
  }

  if (!caixa.sessaoAberta) {
    return <AberturaCaixaPage caixa={caixa} />
  }

  return <CaixaAtualPage caixa={caixa} />
}

export type { UseCaixaResultado }
