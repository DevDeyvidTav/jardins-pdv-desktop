import { BrowserWindow } from 'electron'
import { CANAIS_IPC } from '@shared/types/canais-ipc'

export function notificarCatalogoAtualizado(): void {
  for (const janela of BrowserWindow.getAllWindows()) {
    if (!janela.isDestroyed()) {
      janela.webContents.send(CANAIS_IPC.SYNC_CATALOGO_ATUALIZADO)
    }
  }
}
