import { ResumoFechamentoCaixa } from '../components/resumo-fechamento-caixa'
import type { UseCaixaResultado } from '../hooks/use-caixa'
import './fechamento-caixa.css'

interface PosFechamentoCaixaPageProps {
  caixa: UseCaixaResultado
}

export function PosFechamentoCaixaPage({ caixa }: PosFechamentoCaixaPageProps) {
  if (!caixa.ultimaSessao) {
    return (
      <main className="fechamento-caixa" data-testid="pagina-pos-fechamento">
        <section className="fechamento-caixa__cartao">
          <p>Nenhuma sessao de caixa encontrada.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="fechamento-caixa" data-testid="pagina-pos-fechamento">
      <section className="fechamento-caixa__cartao">
        <h1>Caixa encerrado</h1>

        {caixa.sucesso ? (
          <p className="fechamento-caixa__sucesso" role="status" data-testid="feedback-sucesso">
            {caixa.sucesso}
          </p>
        ) : null}

        <ResumoFechamentoCaixa sessao={caixa.ultimaSessao} />

        <button
          type="button"
          className="fechamento-caixa__botao-principal"
          data-testid="botao-abrir-novo-caixa"
          onClick={caixa.iniciarNovaAbertura}
        >
          Abrir novo caixa
        </button>
      </section>
    </main>
  )
}
