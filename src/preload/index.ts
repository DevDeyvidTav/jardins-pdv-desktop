import { contextBridge, ipcRenderer } from 'electron'
import { CANAIS_IPC } from '@shared/types/canais-ipc'
import type { InformacoesSistema, PdvApi } from '@shared/types/informacoes-sistema'

const apiPdv: PdvApi = {
  sistema: {
    obterInformacoes: (): Promise<InformacoesSistema> =>
      ipcRenderer.invoke(CANAIS_IPC.SISTEMA_OBTER_INFORMACOES),
  },
}

contextBridge.exposeInMainWorld('pdv', apiPdv)
