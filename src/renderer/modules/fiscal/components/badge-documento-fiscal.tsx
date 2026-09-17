import { useEffect, useState } from 'react'
import type { DocumentoFiscalLocal } from '@shared/types/documento-fiscal'
import { ROTULO_STATUS_DOCUMENTO_FISCAL } from '@shared/types/documento-fiscal'

interface Props {
  pedidoId: string
  fiscalSolicitado: boolean
}

export function BadgeDocumentoFiscal({ pedidoId, fiscalSolicitado }: Props) {
  const [documento, setDocumento] = useState<DocumentoFiscalLocal | null>(null)
  const [imprimindo, setImprimindo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    setDocumento(null)
    setErro(null)

    if (!fiscalSolicitado) {
      return
    }

    const carregar = async () => {
      try {
        const atual = await window.pdv.fiscal.obterDocumento({ pedidoId })
        if (ativo) {
          setDocumento(atual)
        }
      } catch {
        if (ativo) {
          setDocumento(null)
        }
      }
    }

    void carregar()
    const intervalo = setInterval(() => {
      void carregar()
    }, 8_000)

    return () => {
      ativo = false
      clearInterval(intervalo)
    }
  }, [pedidoId, fiscalSolicitado])

  if (!fiscalSolicitado) {
    return null
  }

  const status = documento?.status ?? 'PENDENTE'
  const rotulo = ROTULO_STATUS_DOCUMENTO_FISCAL[status] ?? 'Aguardando'

  async function reimprimir() {
    setImprimindo(true)
    setErro(null)
    try {
      await window.pdv.fiscal.imprimirDanfe({ pedidoId })
    } catch (causa) {
      setErro(causa instanceof Error ? causa.message : 'Falha ao imprimir DANFE.')
    } finally {
      setImprimindo(false)
    }
  }

  return (
    <div className="badge-documento-fiscal" data-testid="badge-documento-fiscal">
      <span data-testid="status-documento-fiscal" data-status={status}>
        NFC-e {rotulo}
      </span>
      {documento?.mensagemRejeicao ? (
        <small data-testid="mensagem-rejeicao-fiscal">{documento.mensagemRejeicao}</small>
      ) : null}
      {status === 'AUTORIZADO' ? (
        <button
          type="button"
          data-testid="botao-reimprimir-danfe"
          disabled={imprimindo}
          onClick={() => void reimprimir()}
        >
          {imprimindo ? 'Imprimindo...' : 'Reimprimir NFC-e'}
        </button>
      ) : null}
      {erro ? <small role="alert">{erro}</small> : null}
    </div>
  )
}
