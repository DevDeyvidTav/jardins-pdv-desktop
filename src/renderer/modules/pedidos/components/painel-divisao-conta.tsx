import { useState } from 'react'
import {
  STATUS_DIVISAO_CONTA,
  STATUS_PARTE_DIVISAO,
  type ResumoDivisaoConta,
} from '@shared/types/divisao-conta'
import type { PagamentoInformado } from '@shared/types/pagamento-pedido'
import { formatarMoeda } from '@shared/utils/moeda'
import { FormularioPagamentoPedido } from '../../pagamentos/components/formulario-pagamento-pedido'

interface PainelDivisaoContaProps {
  resumo: ResumoDivisaoConta
  erroExterno?: string | null
  permitirTalao?: boolean
  fiscal?: {
    solicitado: boolean
    cpf: string
    onChange: (solicitado: boolean, cpf: string) => void
  }
  onRegistrarPagamentoParte: (
    parteId: string,
    pagamento: PagamentoInformado,
  ) => Promise<boolean>
  onCancelarDivisao: (motivo?: string) => Promise<boolean>
}

const ROTULO_STATUS_PARTE: Record<string, string> = {
  [STATUS_PARTE_DIVISAO.PENDENTE]: 'Pendente',
  [STATUS_PARTE_DIVISAO.PARCIALMENTE_PAGA]: 'Parcial',
  [STATUS_PARTE_DIVISAO.QUITADA]: 'Quitada',
}

const ROTULO_STATUS_DIVISAO: Record<string, string> = {
  [STATUS_DIVISAO_CONTA.ATIVA]: 'Ativa',
  [STATUS_DIVISAO_CONTA.QUITADA]: 'Quitada',
  [STATUS_DIVISAO_CONTA.CANCELADA]: 'Cancelada',
}

export function PainelDivisaoConta({
  resumo,
  erroExterno = null,
  permitirTalao = false,
  fiscal,
  onRegistrarPagamentoParte,
  onCancelarDivisao,
}: PainelDivisaoContaProps) {
  const [parteSelecionadaId, setParteSelecionadaId] = useState<string | null>(
    resumo.partes.find((p) => p.status !== STATUS_PARTE_DIVISAO.QUITADA)?.id ??
      resumo.partes[0]?.id ??
      null,
  )
  const [cancelando, setCancelando] = useState(false)

  const divisaoAtiva = resumo.divisao.status === STATUS_DIVISAO_CONTA.ATIVA
  const temPagamento = resumo.partes.some((p) => p.valorPagoCentavos > 0)
  const parteSelecionada = resumo.partes.find((p) => p.id === parteSelecionadaId) ?? null

  async function handleCancelar() {
    setCancelando(true)
    try {
      await onCancelarDivisao('Cancelamento manual da divisao')
    } finally {
      setCancelando(false)
    }
  }

  return (
    <section className="painel-divisao-conta" data-testid="painel-divisao-conta">
      <header className="painel-divisao-conta__cabecalho">
        <strong>Divisao de conta</strong>
        <span
          className={`painel-divisao-conta__status painel-divisao-conta__status--${resumo.divisao.status.toLowerCase()}`}
          data-testid="status-divisao-conta"
        >
          {ROTULO_STATUS_DIVISAO[resumo.divisao.status] ?? resumo.divisao.status}
        </span>
      </header>

      <div className="painel-divisao-conta__totais" data-testid="totais-divisao-conta">
        <div>
          <span>Total</span>
          <strong>{formatarMoeda(resumo.totais.valorPedidoCentavos)}</strong>
        </div>
        <div>
          <span>Pago</span>
          <strong>{formatarMoeda(resumo.totais.valorPagoCentavos)}</strong>
        </div>
        <div>
          <span>Restante</span>
          <strong>{formatarMoeda(resumo.totais.valorRestanteCentavos)}</strong>
        </div>
      </div>

      <ul className="painel-divisao-conta__partes" data-testid="lista-partes-divisao">
        {resumo.partes.map((parte) => (
          <li key={parte.id} data-testid={`parte-divisao-${parte.id}`}>
            <button
              type="button"
              className="painel-divisao-conta__parte"
              data-testid={`botao-selecionar-parte-${parte.id}`}
              data-selecionada={parte.id === parteSelecionadaId}
              onClick={() => setParteSelecionadaId(parte.id)}
              disabled={!divisaoAtiva}
            >
              <span className="painel-divisao-conta__parte-nome">{parte.identificacao}</span>
              <span
                className={`painel-divisao-conta__parte-status painel-divisao-conta__parte-status--${parte.status.toLowerCase()}`}
                data-testid={`status-parte-${parte.id}`}
              >
                {ROTULO_STATUS_PARTE[parte.status] ?? parte.status}
              </span>
              <span className="painel-divisao-conta__parte-valores">
                {formatarMoeda(parte.valorPagoCentavos)} /{' '}
                {formatarMoeda(parte.valorDefinidoCentavos)}
              </span>
              <span className="painel-divisao-conta__parte-restante">
                Restante: {formatarMoeda(parte.valorRestanteCentavos)}
              </span>
            </button>
            {parte.pagamentos.length > 0 ? (
              <ul
                className="painel-divisao-conta__pagamentos"
                data-testid={`pagamentos-parte-${parte.id}`}
              >
                {parte.pagamentos.map((pagamento) => (
                  <li key={pagamento.id}>
                    {pagamento.formaPagamento}: {formatarMoeda(pagamento.valorCentavos)}
                    {pagamento.trocoCentavos > 0
                      ? ` · Troco ${formatarMoeda(pagamento.trocoCentavos)}`
                      : ''}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>

      {divisaoAtiva && parteSelecionada && parteSelecionada.status !== STATUS_PARTE_DIVISAO.QUITADA ? (
        <div
          className="painel-divisao-conta__pagamento"
          data-testid="pagamento-parte-selecionada"
        >
          <p className="painel-divisao-conta__pagamento-titulo">
            Pagar parte: <strong>{parteSelecionada.identificacao}</strong>
          </p>
          <FormularioPagamentoPedido
            totalCentavos={parteSelecionada.valorRestanteCentavos}
            erroExterno={erroExterno}
            permitirTalao={permitirTalao}
            fiscal={fiscal}
            onConfirmar={(pagamento) =>
              onRegistrarPagamentoParte(parteSelecionada.id, pagamento)
            }
          />
        </div>
      ) : null}

      {divisaoAtiva && !temPagamento ? (
        <button
          type="button"
          className="painel-divisao-conta__cancelar"
          data-testid="botao-cancelar-divisao"
          onClick={() => void handleCancelar()}
          disabled={cancelando}
        >
          Cancelar divisao
        </button>
      ) : null}
    </section>
  )
}
