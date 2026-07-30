import { useMemo, useState, type FormEvent } from 'react'
import { ResumoCaixa } from '../components/resumo-caixa'
import type { UseCaixaResultado } from '../hooks/use-caixa'
import {
  calcularDiferencaCentavos,
  converterReaisParaCentavos,
  formatarMoeda,
} from '@shared/utils/moeda'
import './fechamento-caixa.css'

interface FormularioFechamentoCaixaProps {
  resumo: NonNullable<UseCaixaResultado['resumo']>
  carregando: boolean
  erroExterno: string | null
  onFechar: (saldoFinalInformadoCentavos: number, observacao?: string) => Promise<boolean>
  onLimparFeedback: () => void
}

function FormularioFechamentoCaixa({
  resumo,
  carregando,
  erroExterno,
  onFechar,
  onLimparFeedback,
}: FormularioFechamentoCaixaProps) {
  const [valorContado, setValorContado] = useState(
    (resumo.saldoAtualEsperadoCentavos / 100).toFixed(2).replace('.', ','),
  )
  const [observacao, setObservacao] = useState('')
  const [erroValidacao, setErroValidacao] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const saldoInformadoCentavos = converterReaisParaCentavos(valorContado)
  const diferencaCentavos = useMemo(() => {
    if (saldoInformadoCentavos === null) {
      return null
    }

    return calcularDiferencaCentavos(
      saldoInformadoCentavos,
      resumo.saldoAtualEsperadoCentavos,
    )
  }, [saldoInformadoCentavos, resumo.saldoAtualEsperadoCentavos])

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    onLimparFeedback()
    setErroValidacao(null)

    if (saldoInformadoCentavos === null) {
      setErroValidacao('Informe um valor contado valido e nao negativo.')
      return
    }

    setEnviando(true)

    try {
      await onFechar(
        saldoInformadoCentavos,
        observacao.trim() || undefined,
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form
      className="formulario-fechamento-caixa"
      data-testid="formulario-fechamento-caixa"
      onSubmit={(evento) => void handleSubmit(evento)}
    >
      <label className="formulario-fechamento-caixa__campo" htmlFor="valor-contado">
        Valor contado
        <input
          id="valor-contado"
          data-testid="campo-valor-contado"
          type="text"
          inputMode="decimal"
          value={valorContado}
          onChange={(evento) => setValorContado(evento.target.value)}
          disabled={carregando || enviando}
        />
      </label>

      <label className="formulario-fechamento-caixa__campo" htmlFor="observacao-fechamento">
        Observacao
        <input
          id="observacao-fechamento"
          data-testid="campo-observacao-fechamento"
          type="text"
          value={observacao}
          onChange={(evento) => setObservacao(evento.target.value)}
          disabled={carregando || enviando}
          placeholder="Opcional"
        />
      </label>

      {diferencaCentavos !== null ? (
        <p className="formulario-fechamento-caixa__preview" data-testid="preview-diferenca">
          Diferenca prevista: {formatarMoeda(diferencaCentavos)}
        </p>
      ) : null}

      {erroValidacao ? (
        <p className="formulario-fechamento-caixa__erro" role="alert">
          {erroValidacao}
        </p>
      ) : null}

      {erroExterno ? (
        <p
          className="formulario-fechamento-caixa__erro"
          role="alert"
          data-testid="erro-caixa"
        >
          {erroExterno}
        </p>
      ) : null}

      <button
        type="submit"
        data-testid="botao-fechar-caixa"
        disabled={carregando || enviando}
      >
        Fechar caixa
      </button>
    </form>
  )
}

interface FechamentoCaixaPageProps {
  caixa: UseCaixaResultado
}

export function FechamentoCaixaPage({ caixa }: FechamentoCaixaPageProps) {
  if (!caixa.resumo) {
    return (
      <main className="fechamento-caixa" data-testid="pagina-fechamento-caixa">
        <section className="fechamento-caixa__cartao">
          <p className="fechamento-caixa__erro" role="alert" data-testid="erro-sem-caixa">
            Nao existe sessao de caixa aberta.
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="fechamento-caixa" data-testid="pagina-fechamento-caixa">
      <section className="fechamento-caixa__cartao">
        <div className="fechamento-caixa__cabecalho">
          <h1>Fechamento de Caixa</h1>
          <button
            type="button"
            className="fechamento-caixa__botao-secundario"
            data-testid="botao-voltar-movimentos"
            onClick={caixa.irParaMovimentos}
          >
            Voltar
          </button>
        </div>

        <ResumoCaixa resumo={caixa.resumo} />
        <ListaMovimentosResumo movimentos={caixa.movimentos.length} />

        <FormularioFechamentoCaixa
          resumo={caixa.resumo}
          carregando={caixa.carregando}
          erroExterno={caixa.erro}
          onFechar={async (saldoFinalInformadoCentavos, observacaoFechamento) =>
            caixa.fecharSessao({
              saldoFinalInformadoCentavos,
              observacaoFechamento,
            })
          }
          onLimparFeedback={caixa.limparFeedback}
        />
      </section>
    </main>
  )
}

function ListaMovimentosResumo({ movimentos }: { movimentos: number }) {
  return (
    <p className="fechamento-caixa__movimentos" data-testid="total-movimentos-fechamento">
      Movimentos registrados: {movimentos}
    </p>
  )
}
