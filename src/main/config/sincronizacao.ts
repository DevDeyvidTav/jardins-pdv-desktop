export interface ConfiguracaoSincronizacao {
  apiUrl: string | null
  dispositivoId: string | null
  dispositivoSegredo: string | null
  intervaloMs: number
  loteMaximo: number
}

export function obterConfiguracaoSincronizacao(): ConfiguracaoSincronizacao {
  const apiUrl = process.env.PDV_SYNC_API_URL?.trim() || null
  const dispositivoId = process.env.PDV_DISPOSITIVO_ID?.trim() || null
  const dispositivoSegredo = process.env.PDV_DISPOSITIVO_SEGREDO?.trim() || null
  const intervaloMs = Number(process.env.PDV_SYNC_INTERVALO_MS ?? 10_000)
  const loteMaximo = Number(process.env.PDV_SYNC_LOTE_MAX ?? 20)

  return {
    apiUrl,
    dispositivoId,
    dispositivoSegredo,
    intervaloMs: Number.isFinite(intervaloMs) && intervaloMs > 0 ? intervaloMs : 10_000,
    loteMaximo: Number.isFinite(loteMaximo) && loteMaximo > 0 ? loteMaximo : 20,
  }
}

export function sincronizacaoEstaConfigurada(
  config: ConfiguracaoSincronizacao = obterConfiguracaoSincronizacao(),
): boolean {
  return Boolean(config.apiUrl && config.dispositivoId && config.dispositivoSegredo)
}
