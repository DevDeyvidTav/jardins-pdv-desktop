import { app, BrowserWindow, dialog } from 'electron'
import { ErroInicializacaoAplicacao } from '@shared/errors/erros-aplicacao'
import { criarJanelaPrincipal } from './criar-janela'
import {
  encerrarBancoLocal,
  inicializarBancoLocal,
} from '../database/inicializar-banco'
import { ErroIntegridadeBanco } from '../database/conexao-sqlite'
import { obterBackupMaisRecente } from '../database/backup-banco'
import { registrarHandlersIpc } from '../ipc/registrar-handlers'
import { iniciarSincronizador } from '../modules/sincronizacao/services/sincronizador.service'
import {
  instalarHandlersProcesso,
  registrarErro,
  registrarInfo,
} from '../logging/logger'

export async function inicializarAplicacao(): Promise<void> {
  try {
    await inicializarBancoLocal()
    registrarHandlersIpc()
    iniciarSincronizador()
    registrarInfo('Aplicacao inicializada', { operacao: 'app.inicializar' })
  } catch (erro) {
    throw new ErroInicializacaoAplicacao(
      'Falha ao inicializar a aplicacao desktop.',
      { cause: erro },
    )
  }
}

async function exibirFalhaIntegridade(erro: ErroIntegridadeBanco): Promise<void> {
  const backup = erro.backupMaisRecente ?? obterBackupMaisRecente()
  const detalheBackup = backup
    ? `\n\nBackup mais recente:\n${backup}\n\nFeche o aplicativo e restaure este arquivo sobre pdv-local.sqlite em userData (ou use a rotina interna de restauracao).`
    : '\n\nNenhum backup automatico encontrado.'

  await dialog.showMessageBox({
    type: 'error',
    title: 'Banco de dados corrompido',
    message: 'A verificacao de integridade do banco local falhou.',
    detail:
      'O PDV nao continuara automaticamente para evitar perda de dados.' +
      detalheBackup,
    buttons: ['Fechar'],
  })
}

export function configurarCicloDeVida(): void {
  instalarHandlersProcesso()

  app.whenReady().then(async () => {
    try {
      await inicializarAplicacao()
      criarJanelaPrincipal()
    } catch (erro) {
      registrarErro('Falha ao inicializar aplicacao', { operacao: 'app.boot' }, erro)

      const causa =
        erro instanceof ErroInicializacaoAplicacao && erro.cause
          ? erro.cause
          : erro

      if (causa instanceof ErroIntegridadeBanco) {
        await exibirFalhaIntegridade(causa)
        app.quit()
        return
      }

      await dialog.showMessageBox({
        type: 'error',
        title: 'Falha na inicializacao',
        message: 'Nao foi possivel iniciar o PDV.',
        detail: causa instanceof Error ? causa.message : String(causa),
        buttons: ['Fechar'],
      })
      app.quit()
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
