import { ipcMain } from 'electron'
import { CANAIS_IPC } from '@shared/types/canais-ipc'
import { obterInformacoesSistema } from '../app/servico-informacoes-sistema'
import {
  instalarAtualizacaoBaixada,
  obterEstadoAtualizacao,
  verificarAtualizacao,
} from '../app/servico-atualizacao'

export function registrarHandlersSistema(): void {
  ipcMain.handle(CANAIS_IPC.SISTEMA_OBTER_INFORMACOES, () => {
    return obterInformacoesSistema()
  })

  ipcMain.handle(CANAIS_IPC.SISTEMA_OBTER_ESTADO_ATUALIZACAO, () => {
    return obterEstadoAtualizacao()
  })

  ipcMain.handle(CANAIS_IPC.SISTEMA_VERIFICAR_ATUALIZACAO, () => {
    return verificarAtualizacao()
  })

  ipcMain.handle(CANAIS_IPC.SISTEMA_INSTALAR_ATUALIZACAO, () => {
    return instalarAtualizacaoBaixada()
  })
}
