import { contextBridge, ipcRenderer } from 'electron'
import { CANAIS_IPC } from '@shared/types/canais-ipc'
import type { PdvApi } from '@shared/types/pdv-api'

const apiPdv: PdvApi = {
  sistema: {
    obterInformacoes: () =>
      ipcRenderer.invoke(CANAIS_IPC.SISTEMA_OBTER_INFORMACOES),
  },
  caixa: {
    abrirSessaoCaixa: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.CAIXA_ABRIR_SESSAO, entrada),
    obterSessaoCaixaAberta: () =>
      ipcRenderer.invoke(CANAIS_IPC.CAIXA_OBTER_SESSAO_ABERTA),
  },
}

contextBridge.exposeInMainWorld('pdv', apiPdv)
