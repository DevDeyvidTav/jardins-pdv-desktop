import { useEffect, useState } from 'react'
import type { DocumentoFiscalLocal } from '@shared/types/documento-fiscal'

const INTERVALO_POLL_MS = 2_500

const ETAPAS = [
  'Enviando para a nuvem',
  'Na fila de emissão',
  'Processando na SEFAZ',
  'Autorizada',
] as const

const STATUS_FINAIS = new Set(['AUTORIZADO', 'REJEITADO', 'CANCELADO'])

function etapaAtual(documento: DocumentoFiscalLocal | null): number {
  if (!documento) return 0
  switch (documento.status) {
    case 'PENDENTE':
      return 1
    case 'PROCESSANDO':
      return 2
    case 'AUTORIZADO':
      return 3
    default:
      return 2
  }
}

function formatarChaveGrupos(chave: string): string {
  const limpa = chave.replace(/\D/g, '')
  const grupos: string[] = []
  for (let indice = 0; indice < limpa.length; indice += 4) {
    grupos.push(limpa.slice(indice, indice + 4))
  }
  return grupos.join(' ')
}

interface Props {
  pedidoId: string
  onFechar: () => void
}

export function ModalEmissaoNfce({ pedidoId, onFechar }: Props) {
  const [documento, setDocumento] = useState<DocumentoFiscalLocal | null>(null)
  const [imprimindo, setImprimindo] = useState(false)
  const [erroImpressao, setErroImpressao] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true

    const carregar = async () => {
      try {
        const atual = await window.pdv.fiscal.obterDocumento({ pedidoId })
        if (ativo) {
          setDocumento(atual)
        }
      } catch {
        // Documento ainda nao replicado — mantem etapa "Enviando"
      }
    }

    void carregar()
    const intervalo = setInterval(() => {
      void carregar()
    }, INTERVALO_POLL_MS)

    return () => {
      ativo = false
      clearInterval(intervalo)
    }
  }, [pedidoId])

  const status = documento?.status ?? null
  const finalizado = status !== null && STATUS_FINAIS.has(status)

  async function reimprimir() {
    setImprimindo(true)
    setErroImpressao(null)
    try {
      await window.pdv.fiscal.imprimirDanfe({ pedidoId })
    } catch (causa) {
      setErroImpressao(causa instanceof Error ? causa.message : 'Falha ao imprimir DANFE.')
    } finally {
      setImprimindo(false)
    }
  }

  return (
    <div className="modal-pagamento" data-testid="modal-emissao-nfce">
      <div className="modal-pagamento__backdrop" onClick={onFechar} />
      <div className="modal-pagamento__conteudo" role="dialog" aria-modal="true">
        <header className="modal-pagamento__cabecalho">
          <div>
            <h2>Emissão de NFC-e</h2>
            <p className="modal-pagamento__total">
              {status === 'AUTORIZADO'
                ? 'Nota autorizada'
                : status === 'REJEITADO'
                  ? 'Nota rejeitada'
                  : 'Acompanhe a emissão'}
            </p>
          </div>
          <button type="button" className="modal-pagamento__fechar" onClick={onFechar}>
            Fechar
          </button>
        </header>

        {status === 'AUTORIZADO' ? (
          <div className="modal-emissao-nfce__painel modal-emissao-nfce__painel--sucesso" data-testid="nfce-autorizada">
            <p className="modal-emissao-nfce__titulo-painel">NFC-e autorizada pela SEFAZ</p>
            <dl className="modal-emissao-nfce__detalhes">
              {documento?.numero != null ? (
                <div>
                  <dt>Número</dt>
                  <dd>
                    {documento.numero}
                    {documento.serie != null ? ` · Série ${documento.serie}` : ''}
                  </dd>
                </div>
              ) : null}
              {documento?.protocoloAutorizacao ? (
                <div>
                  <dt>Protocolo</dt>
                  <dd>{documento.protocoloAutorizacao}</dd>
                </div>
              ) : null}
              {documento?.chaveAcesso ? (
                <div>
                  <dt>Chave de acesso</dt>
                  <dd className="modal-emissao-nfce__chave">
                    {formatarChaveGrupos(documento.chaveAcesso)}
                  </dd>
                </div>
              ) : null}
            </dl>
            <p className="modal-emissao-nfce__nota">
              O DANFE foi enviado para a impressora automaticamente.
            </p>
            {erroImpressao ? (
              <p role="alert" className="modal-emissao-nfce__erro-impressao">
                {erroImpressao}
              </p>
            ) : null}
            <div className="modal-confirmacao__acoes">
              <button
                type="button"
                className="painel-mesa-pedido__acao-secundaria"
                data-testid="botao-reimprimir-danfe-modal"
                disabled={imprimindo}
                onClick={() => void reimprimir()}
              >
                {imprimindo ? 'Imprimindo...' : 'Reimprimir DANFE'}
              </button>
              <button
                type="button"
                className="modal-emissao-nfce__botao-primario"
                data-testid="botao-concluir-emissao"
                onClick={onFechar}
              >
                Concluir
              </button>
            </div>
          </div>
        ) : status === 'REJEITADO' ? (
          <div className="modal-emissao-nfce__painel modal-emissao-nfce__painel--erro" data-testid="nfce-rejeitada">
            <p className="modal-emissao-nfce__titulo-painel">NFC-e rejeitada</p>
            <p className="modal-emissao-nfce__mensagem-rejeicao">
              {documento?.codigoRejeicao ? `[${documento.codigoRejeicao}] ` : ''}
              {documento?.mensagemRejeicao ?? 'A SEFAZ rejeitou a nota.'}
            </p>
            <p className="modal-emissao-nfce__nota">
              O pedido foi finalizado normalmente. Corrija o problema e reprocesse a nota
              pelo painel fiscal.
            </p>
            <div className="modal-confirmacao__acoes">
              <button
                type="button"
                className="painel-mesa-pedido__acao-secundaria"
                data-testid="botao-fechar-emissao"
                onClick={onFechar}
              >
                Entendi
              </button>
            </div>
          </div>
        ) : status === 'CONTINGENCIA' ? (
          <div className="modal-emissao-nfce__painel modal-emissao-nfce__painel--aviso" data-testid="nfce-contingencia">
            <p className="modal-emissao-nfce__titulo-painel">Emitida em contingência</p>
            <p className="modal-emissao-nfce__nota">
              A SEFAZ está indisponível. A nota será transmitida automaticamente quando o
              serviço voltar.
            </p>
            <div className="modal-confirmacao__acoes">
              <button
                type="button"
                className="painel-mesa-pedido__acao-secundaria"
                data-testid="botao-fechar-emissao"
                onClick={onFechar}
              >
                Entendi
              </button>
            </div>
          </div>
        ) : (
          <>
            <ol className="modal-emissao-nfce__etapas" data-testid="etapas-emissao">
              {ETAPAS.map((etapa, indice) => {
                const atual = etapaAtual(documento)
                return (
                  <li
                    key={etapa}
                    className="modal-emissao-nfce__etapa"
                    data-ativa={indice === atual}
                    data-concluida={indice < atual}
                  >
                    <span className="modal-emissao-nfce__marcador">
                      {indice < atual ? '✓' : indice === atual ? '●' : '○'}
                    </span>
                    {etapa}
                  </li>
                )
              })}
            </ol>
            <p className="modal-emissao-nfce__nota">
              Você pode fechar esta janela — a emissão continua e o DANFE imprime
              automaticamente quando a nota autorizar.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
