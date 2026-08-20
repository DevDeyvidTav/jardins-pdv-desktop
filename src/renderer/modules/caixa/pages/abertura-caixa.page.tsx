import { FormularioAberturaCaixa } from '../components/formulario-abertura-caixa'
import { LogoMarca } from '../../../componentes/logo-marca'
import type { UseCaixaResultado } from '../hooks/use-caixa'
import '../../../componentes/logo-marca.css'
import './abertura-caixa.css'

interface AberturaCaixaPageProps {
  caixa: UseCaixaResultado
}

export function AberturaCaixaPage({ caixa }: AberturaCaixaPageProps) {
  return (
    <main className="abertura-caixa" data-testid="pagina-abertura-caixa">
      <section className="abertura-caixa__cartao">
        <LogoMarca tamanho="destaque" className="abertura-caixa__logo" />
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
