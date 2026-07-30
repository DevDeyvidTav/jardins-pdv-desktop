import { FormularioAberturaCaixa } from '../components/formulario-abertura-caixa'
import { ResumoCaixaAberto } from '../components/resumo-caixa-aberto'
import { useCaixa } from '../hooks/use-caixa'
import './abertura-caixa.css'

export function AberturaCaixaPage() {
  const { sessaoAberta, carregando, erro, abrirSessao } = useCaixa()

  return (
    <main className="abertura-caixa" data-testid="pagina-abertura-caixa">
      <section className="abertura-caixa__cartao">
        <h1>Abertura de Caixa</h1>

        {carregando ? (
          <p className="abertura-caixa__carregando">Verificando caixa...</p>
        ) : null}

        {!carregando && sessaoAberta ? (
          <ResumoCaixaAberto sessao={sessaoAberta} />
        ) : null}

        {!carregando && !sessaoAberta ? (
          <>
            <p className="abertura-caixa__descricao">
              Informe o saldo inicial para abrir a sessao de caixa local.
            </p>
            <FormularioAberturaCaixa
              carregando={carregando}
              erroExterno={erro}
              onAbrirCaixa={abrirSessao}
            />
          </>
        ) : null}
      </section>
    </main>
  )
}
