import { useMemo, useState } from 'react'
import { converterReaisParaCentavos, formatarMoeda } from '@shared/utils/moeda'
import type { CriarParteDivisaoEntrada } from '@shared/types/divisao-conta'

interface ParteFormulario {
  identificacao: string
  valorReais: string
}

interface ModalDividirContaProps {
  totalCentavos: number
  carregando?: boolean
  erroExterno?: string | null
  onConfirmar: (partes: CriarParteDivisaoEntrada[]) => Promise<boolean>
  onFechar: () => void
}

function parteVazia(): ParteFormulario {
  return { identificacao: '', valorReais: '' }
}

export function ModalDividirConta({
  totalCentavos,
  carregando = false,
  erroExterno = null,
  onConfirmar,
  onFechar,
}: ModalDividirContaProps) {
  const [partes, setPartes] = useState<ParteFormulario[]>([parteVazia(), parteVazia()])
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [confirmarCriacao, setConfirmarCriacao] = useState(false)

  const somaCentavos = useMemo(() => {
    return partes.reduce((acc, parte) => {
      const centavos = converterReaisParaCentavos(parte.valorReais)
      return acc + (centavos ?? 0)
    }, 0)
  }, [partes])

  const diferencaCentavos = totalCentavos - somaCentavos
  const somaFecha = diferencaCentavos === 0

  function atualizarParte(indice: number, campo: keyof ParteFormulario, valor: string) {
    setPartes((atual) =>
      atual.map((parte, i) => (i === indice ? { ...parte, [campo]: valor } : parte)),
    )
    setConfirmarCriacao(false)
  }

  function adicionarParte() {
    setPartes((atual) => [...atual, parteVazia()])
    setConfirmarCriacao(false)
  }

  function removerParte(indice: number) {
    if (partes.length <= 2) return
    setPartes((atual) => atual.filter((_, i) => i !== indice))
    setConfirmarCriacao(false)
  }

  async function handleConfirmar() {
    setErro(null)
    const partesEntrada: CriarParteDivisaoEntrada[] = []

    for (const parte of partes) {
      const valorCentavos = converterReaisParaCentavos(parte.valorReais)
      if (!parte.identificacao.trim()) {
        setErro('Informe a identificacao de cada parte.')
        return
      }
      if (valorCentavos === null || valorCentavos <= 0) {
        setErro('Cada parte precisa de valor maior que zero.')
        return
      }
      partesEntrada.push({
        identificacao: parte.identificacao.trim(),
        valorDefinidoCentavos: valorCentavos,
      })
    }

    if (partesEntrada.length < 2) {
      setErro('Divisao precisa de duas ou mais partes.')
      return
    }

    if (!somaFecha) {
      setErro('A soma das partes deve ser igual ao total do pedido.')
      return
    }

    if (!confirmarCriacao) {
      setConfirmarCriacao(true)
      return
    }

    setEnviando(true)
    try {
      const ok = await onConfirmar(partesEntrada)
      if (ok) onFechar()
    } finally {
      setEnviando(false)
    }
  }

  const mensagemErro = erro ?? erroExterno

  return (
    <div className="modal-pagamento" data-testid="modal-dividir-conta">
      <div className="modal-pagamento__backdrop" onClick={onFechar} />
      <div className="modal-pagamento__conteudo" role="dialog" aria-modal="true">
        <header className="modal-pagamento__cabecalho">
          <div>
            <h2>Dividir conta</h2>
            <p className="modal-pagamento__total">
              Total do pedido: {formatarMoeda(totalCentavos)}
            </p>
          </div>
          <button type="button" className="modal-pagamento__fechar" onClick={onFechar}>
            Fechar
          </button>
        </header>

        <div data-testid="formulario-dividir-conta" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {partes.map((parte, indice) => (
            <div
              key={indice}
              data-testid={`linha-parte-divisao-${indice}`}
              style={{ display: 'grid', gridTemplateColumns: '1fr 120px auto', gap: 8 }}
            >
              <input
                data-testid={`campo-identificacao-parte-${indice}`}
                placeholder={`Parte ${indice + 1}`}
                value={parte.identificacao}
                onChange={(e) => atualizarParte(indice, 'identificacao', e.target.value)}
                disabled={enviando || carregando}
              />
              <input
                data-testid={`campo-valor-parte-${indice}`}
                placeholder="0,00"
                value={parte.valorReais}
                onChange={(e) => atualizarParte(indice, 'valorReais', e.target.value)}
                disabled={enviando || carregando}
              />
              <button
                type="button"
                data-testid={`botao-remover-parte-${indice}`}
                onClick={() => removerParte(indice)}
                disabled={partes.length <= 2 || enviando || carregando}
              >
                Remover
              </button>
            </div>
          ))}

          <button
            type="button"
            data-testid="botao-adicionar-parte"
            onClick={adicionarParte}
            disabled={enviando || carregando}
          >
            Adicionar parte
          </button>

          <div data-testid="resumo-distribuicao-divisao">
            <p>Soma das partes: {formatarMoeda(somaCentavos)}</p>
            <p data-testid="diferenca-distribuicao-divisao">
              Diferenca: {formatarMoeda(diferencaCentavos)}
            </p>
          </div>

          {mensagemErro ? (
            <p role="alert" data-testid="erro-dividir-conta">
              {mensagemErro}
            </p>
          ) : null}

          {confirmarCriacao ? (
            <p data-testid="confirmacao-criar-divisao">
              Confirme novamente para criar a divisao com essas partes.
            </p>
          ) : null}

          <button
            type="button"
            className="painel-mesa-pedido__acao-principal"
            data-testid="botao-confirmar-divisao"
            onClick={() => void handleConfirmar()}
            disabled={enviando || carregando || !somaFecha}
          >
            {confirmarCriacao ? 'Confirmar divisao' : 'Criar divisao'}
          </button>
        </div>
      </div>
    </div>
  )
}
