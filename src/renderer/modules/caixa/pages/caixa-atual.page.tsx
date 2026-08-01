import { useMemo, useState } from 'react'
import { FormularioMovimentoCaixa } from '../components/formulario-movimento-caixa'
import { ListaMovimentosCaixa } from '../components/lista-movimentos-caixa'
import { ResumoCaixa } from '../components/resumo-caixa'
import type { UseCaixaResultado } from '../hooks/use-caixa'
import type { TipoMovimentoCaixa } from '@shared/types/movimento-caixa'
import './caixa-atual.css'

interface CaixaAtualPageProps {
  caixa: UseCaixaResultado
}

type FiltroMovimento = 'TODOS' | TipoMovimentoCaixa

export function CaixaAtualPage({ caixa }: CaixaAtualPageProps) {
  const [exibirFormMovimento, setExibirFormMovimento] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState<FiltroMovimento>('TODOS')

  const movimentosFiltrados = useMemo(() => {
    if (filtroTipo === 'TODOS') return caixa.movimentos
    return caixa.movimentos.filter((movimento) => movimento.tipo === filtroTipo)
  }, [caixa.movimentos, filtroTipo])

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
    <main className="caixa-atual caixa-atual--operacao" data-testid="pagina-caixa-atual">
      <div className="caixa-operacao">
        <aside className="caixa-operacao__painel" data-testid="painel-resumo-caixa">
          <header className="caixa-operacao__painel-cabecalho">
            <div>
              <h1>Caixa</h1>
              <p className="caixa-operacao__meta">Sessao aberta</p>
            </div>
            <button
              type="button"
              className="caixa-atual__botao-secundario"
              data-testid="botao-ir-fechamento"
              onClick={caixa.irParaFechamento}
            >
              Fechar caixa
            </button>
          </header>

          <ResumoCaixa resumo={caixa.resumo} compacto />

          {caixa.sucesso ? (
            <p className="caixa-atual__sucesso" role="status" data-testid="feedback-sucesso">
              {caixa.sucesso}
            </p>
          ) : null}

          <div className="caixa-operacao__acoes">
            <button
              type="button"
              className="caixa-operacao__botao-principal"
              data-testid="botao-toggle-movimento"
              onClick={() => setExibirFormMovimento((atual) => !atual)}
            >
              {exibirFormMovimento ? 'Fechar formulario' : 'Novo movimento'}
            </button>
          </div>

          {exibirFormMovimento ? (
            <div className="caixa-operacao__form-painel">
              <FormularioMovimentoCaixa
                carregando={caixa.carregando}
                erroExterno={caixa.erro}
                onRegistrar={async (entrada) => {
                  const ok = await caixa.registrarMovimento(entrada)
                  if (ok) setExibirFormMovimento(false)
                  return ok
                }}
                onLimparFeedback={caixa.limparFeedback}
                compacto
              />
            </div>
          ) : null}
        </aside>

        <section className="caixa-operacao__movimentos">
          <header className="caixa-operacao__toolbar">
            <div>
              <h1>Movimentos</h1>
              <p className="caixa-operacao__meta">
                {movimentosFiltrados.length} registro
                {movimentosFiltrados.length === 1 ? '' : 's'}
              </p>
            </div>
          </header>

          <div className="caixa-operacao__filtros" data-testid="filtros-tipo-movimento">
            {(
              [
                ['TODOS', 'Todos'],
                ['SUPRIMENTO', 'Suprimentos'],
                ['SANGRIA', 'Sangrias'],
                ['RETIRADA', 'Retiradas'],
              ] as const
            ).map(([valor, rotulo]) => (
              <button
                key={valor}
                type="button"
                className="caixa-operacao__chip"
                data-ativo={filtroTipo === valor}
                data-testid={`filtro-movimento-${valor.toLowerCase()}`}
                onClick={() => setFiltroTipo(valor)}
              >
                {rotulo}
              </button>
            ))}
          </div>

          <div className="caixa-operacao__lista-scroll">
            <ListaMovimentosCaixa movimentos={movimentosFiltrados} compacto />
          </div>
        </section>
      </div>
    </main>
  )
}
