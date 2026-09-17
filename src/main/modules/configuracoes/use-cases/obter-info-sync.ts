import { obterConfiguracaoSincronizacao } from '../../../config/sincronizacao'

export interface InfoSyncConfig {
  apiUrl: string | null
  dispositivoId: string | null
  apiConfigurada: boolean
}

export function obterInfoSyncConfig(): InfoSyncConfig {
  const config = obterConfiguracaoSincronizacao()

  return {
    apiUrl: config.apiUrl,
    dispositivoId: config.dispositivoId,
    apiConfigurada: Boolean(
      config.apiUrl && config.dispositivoId && config.dispositivoSegredo,
    ),
  }
}
