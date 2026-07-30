import { FormularioAberturaCaixa } from '../components/formulario-abertura-caixa'
import type { UseCaixaResultado } from '../hooks/use-caixa'
import './abertura-caixa.css'

interface AberturaCaixaPageProps {
  caixa: UseCaixaResultado
}

export function AberturaCaixaPage({ caixa }: AberturaCaixaPageProps) {
  return (
    <main className="abertura-caixa" data-testid="pagina-abertura-caixa">
      <section className="abertura-caixa__cartao">
        <h1>Abertura de Caixa</h1>
        <p className="abertura-caixa__descricao">
          Informe o saldo inicial para abrir a sessao de caixa local.
        </p>
        <FormularioAberturaCaixa
          carregando={caixa.carregando}
          erroExterno={caixa.erro}
          onAbrirCaixa={caixa.abrirSessao}
        />
      </section>
    </main>
  )
}
