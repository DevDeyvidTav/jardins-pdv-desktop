import { ipcMain } from 'electron'
import { CANAIS_IPC } from '@shared/types/canais-ipc'
import { obterInformacoesSistema } from '../app/servico-informacoes-sistema'

export function registrarHandlersSistema(): void {
  ipcMain.handle(CANAIS_IPC.SISTEMA_OBTER_INFORMACOES, () => {
    return obterInformacoesSistema()
  })
}
