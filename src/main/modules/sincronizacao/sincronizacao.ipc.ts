import { ipcMain } from 'electron'
import { CANAIS_IPC } from '@shared/types/canais-ipc'
import { obterEstadoSincronizacao } from './services/sincronizador.service'

export function registrarHandlersSincronizacao(): void {
  ipcMain.handle(CANAIS_IPC.SYNC_OBTER_ESTADO, () => obterEstadoSincronizacao())
}
