import { FormularioMovimentoCaixa } from '../components/formulario-movimento-caixa'
import { ListaMovimentosCaixa } from '../components/lista-movimentos-caixa'
import { ResumoCaixa } from '../components/resumo-caixa'
import type { UseCaixaResultado } from '../hooks/use-caixa'
import './caixa-atual.css'

interface CaixaAtualPageProps {
  caixa: UseCaixaResultado
}

export function CaixaAtualPage({ caixa }: CaixaAtualPageProps) {
  if (!caixa.resumo) {
    return (
      <main className="caixa-atual" data-testid="pagina-caixa-atual">
        <section className="caixa-atual__cartao">
          <p className="caixa-atual__erro" role="alert" data-testid="erro-sem-caixa">
            Nao existe sessao de caixa aberta.
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="caixa-atual" data-testid="pagina-caixa-atual">
      <section className="caixa-atual__cartao">
        <h1>Movimentos de Caixa</h1>

        <ResumoCaixa resumo={caixa.resumo} />

        {caixa.sucesso ? (
          <p className="caixa-atual__sucesso" role="status" data-testid="feedback-sucesso">
            {caixa.sucesso}
          </p>
        ) : null}

        <FormularioMovimentoCaixa
          carregando={caixa.carregando}
          erroExterno={caixa.erro}
          onRegistrar={caixa.registrarMovimento}
          onLimparFeedback={caixa.limparFeedback}
        />

        <ListaMovimentosCaixa movimentos={caixa.movimentos} />
      </section>
    </main>
  )
}
