import type { ConfiguracaoSincronizacao } from '../../../config/sincronizacao'
import type { EventoSyncOutbox } from '../repositories/sync-outbox.repository'

export interface RespostaSyncApi {
  confirmados: string[]
  comErro: Array<{ eventoId: string; motivo: string }>
}

export type MudancaCatalogoApi = {
  id: number
  entidade: string
  entidadeId: string
  operacao: string
  payload: Record<string, unknown>
  atualizadoEm: string
  origem: string
}

export type LoteMudancasCatalogoApi = {
  cursor: number
  mudancas: MudancaCatalogoApi[]
}

export async function buscarMudancasCatalogoApi(
  config: ConfiguracaoSincronizacao,
  depoisDe: number,
): Promise<LoteMudancasCatalogoApi> {
  if (!config.apiUrl || !config.dispositivoId || !config.dispositivoSegredo) {
    throw new Error('Sincronizacao nao configurada.')
  }

  const base = config.apiUrl.replace(/\/$/, '')
  const url = `${base}/sync/changes?depoisDe=${encodeURIComponent(String(depoisDe))}`
  const authorization = `Device ${config.dispositivoId}:${config.dispositivoSegredo}`

  const resposta = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: authorization,
      Accept: 'application/json',
    },
  })

  if (!resposta.ok) {
    const texto = await resposta.text().catch(() => '')
    throw new Error(
      `Sync changes HTTP ${resposta.status} em ${url}${texto ? `: ${texto.slice(0, 200)}` : ''}`,
    )
  }

  return (await resposta.json()) as LoteMudancasCatalogoApi
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
