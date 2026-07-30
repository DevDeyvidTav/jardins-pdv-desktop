import { app, BrowserWindow } from 'electron'
import { ErroInicializacaoAplicacao } from '@shared/errors/erros-aplicacao'
import { criarJanelaPrincipal } from './criar-janela'
import {
  encerrarBancoLocal,
  inicializarBancoLocal,
} from '../database/inicializar-banco'
import { registrarHandlersIpc } from '../ipc/registrar-handlers'

export async function inicializarAplicacao(): Promise<void> {
  try {
    await inicializarBancoLocal()
    registrarHandlersIpc()
  } catch (erro) {
    throw new ErroInicializacaoAplicacao(
      'Falha ao inicializar a aplicacao desktop.',
      { cause: erro },
    )
  }
}

export function configurarCicloDeVida(): void {
  app.whenReady().then(async () => {
    try {
      await inicializarAplicacao()
      criarJanelaPrincipal()
    } catch (erro) {
      console.error('[main] Falha ao inicializar aplicacao:', erro)
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        criarJanelaPrincipal()
      }
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('before-quit', () => {
    encerrarBancoLocal()
  })
}
