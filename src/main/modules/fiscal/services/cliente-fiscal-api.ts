import type { ConfiguracaoSincronizacao } from '../../../config/sincronizacao'
import type { DocumentoFiscalInbox } from '@shared/types/documento-fiscal'
import type { EmitenteDanfeNfce } from '../../impressao/templates/montar-danfe-nfce'

export interface InboxFiscalApi {
  documentos: DocumentoFiscalInbox[]
  emitente?: EmitenteDanfeNfce | null
}

export async function buscarInboxFiscalApi(
  config: ConfiguracaoSincronizacao,
  atualizadoDesde?: string | null,
): Promise<InboxFiscalApi> {
  if (!config.apiUrl || !config.dispositivoId || !config.dispositivoSegredo) {
    throw new Error('Sincronizacao nao configurada.')
  }

  const url = new URL(`${config.apiUrl.replace(/\/$/, '')}/fiscal/inbox`)
  if (atualizadoDesde) {
    url.searchParams.set('atualizadoDesde', atualizadoDesde)
  }

  const resposta = await fetch(url, {
    headers: {
      Authorization: `Device ${config.dispositivoId}:${config.dispositivoSegredo}`,
      Accept: 'application/json',
    },
  })

  if (!resposta.ok) {
    const texto = await resposta.text().catch(() => '')
    throw new Error(
      `Fiscal inbox HTTP ${resposta.status}${texto ? `: ${texto.slice(0, 200)}` : ''}`,
    )
  }

  const corpo = (await resposta.json()) as InboxFiscalApi
  return {
    documentos: corpo.documentos ?? [],
    emitente: corpo.emitente ?? null,
  }
}
