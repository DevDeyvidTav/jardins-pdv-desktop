import type { ConfiguracaoSincronizacao } from '../../config/sincronizacao'
import type { EventoSyncOutbox } from '../repositories/sync-outbox.repository'

export interface RespostaSyncApi {
  confirmados: string[]
  comErro: Array<{ eventoId: string; motivo: string }>
}

export async function enviarEventosSyncApi(
  config: ConfiguracaoSincronizacao,
  eventos: EventoSyncOutbox[],
): Promise<RespostaSyncApi> {
  if (!config.apiUrl || !config.dispositivoId || !config.dispositivoSegredo) {
    throw new Error('Sincronizacao nao configurada.')
  }

  const url = `${config.apiUrl.replace(/\/$/, '')}/sync/events`
  const authorization = `Device ${config.dispositivoId}:${config.dispositivoSegredo}`

  const corpo = {
    eventos: eventos.map((evento) => ({
      eventoId: evento.id,
      dispositivoId: config.dispositivoId,
      entidade: evento.entidade,
      operacao: evento.operacao,
      payload: evento.payload,
    })),
  }

  const resposta = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: authorization,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(corpo),
  })

  if (!resposta.ok) {
    const texto = await resposta.text().catch(() => '')
    throw new Error(
      `Sync HTTP ${resposta.status}${texto ? `: ${texto.slice(0, 200)}` : ''}`,
    )
  }

  return (await resposta.json()) as RespostaSyncApi
}
