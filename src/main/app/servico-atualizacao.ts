import { app, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import { CANAIS_IPC } from '@shared/types/canais-ipc'
import type { EstadoAtualizacao } from '@shared/types/atualizacao'
import { registrarErro, registrarInfo } from '../logging/logger'

const INTERVALO_VERIFICACAO_MS = 6 * 60 * 60 * 1000

let janelaPrincipal: BrowserWindow | null = null
let intervaloVerificacao: NodeJS.Timeout | null = null

let estado: EstadoAtualizacao = {
  ativo: false,
  verificando: false,
  baixando: false,
  baixada: false,
  versaoAtual: app.getVersion(),
  versaoDisponivel: null,
  progressoPercentual: null,
  mensagem: 'Verificacao de atualizacao ainda nao iniciada.',
  erro: null,
}

function atualizacaoHabilitada(): boolean {
  return app.isPackaged && process.env.PDV_DESATIVAR_ATUALIZACAO !== '1'
}

function notificarRenderer(): void {
  const snapshot = obterEstadoAtualizacao()
  janelaPrincipal?.webContents.send(CANAIS_IPC.SISTEMA_ATUALIZACAO_EVENTO, snapshot)
}

function definirEstado(parcial: Partial<EstadoAtualizacao>): void {
  estado = {
    ...estado,
    versaoAtual: app.getVersion(),
    ...parcial,
  }
  notificarRenderer()
}

export function obterEstadoAtualizacao(): EstadoAtualizacao {
  return { ...estado, versaoAtual: app.getVersion() }
}

export async function verificarAtualizacao(): Promise<EstadoAtualizacao> {
  if (!atualizacaoHabilitada()) {
    definirEstado({
      ativo: false,
      mensagem:
        process.env.PDV_DESATIVAR_ATUALIZACAO === '1'
          ? 'Atualizacao automatica desativada por configuracao.'
          : 'Atualizacao automatica disponivel apenas no instalador (nao no modo dev).',
    })
    return obterEstadoAtualizacao()
  }

  definirEstado({
    ativo: true,
    verificando: true,
    erro: null,
    mensagem: 'Verificando se existe versao nova...',
  })

  try {
    await autoUpdater.checkForUpdates()
  } catch (erro) {
    registrarErro('Falha ao verificar atualizacao', { operacao: 'app.atualizacao' }, erro)
    definirEstado({
      verificando: false,
      erro: erro instanceof Error ? erro.message : String(erro),
      mensagem: 'Nao foi possivel verificar atualizacao.',
    })
  }

  return obterEstadoAtualizacao()
}

export function instalarAtualizacaoBaixada(): EstadoAtualizacao {
  if (!estado.baixada) {
    definirEstado({
      erro: 'Nenhuma atualizacao baixada para instalar.',
      mensagem: 'Baixe uma versao nova antes de instalar.',
    })
    return obterEstadoAtualizacao()
  }

  registrarInfo('Reiniciando para instalar atualizacao', {
    operacao: 'app.atualizacao.instalar',
    versao: estado.versaoDisponivel ?? undefined,
  })
  autoUpdater.quitAndInstall(false, true)
  return obterEstadoAtualizacao()
}

export function configurarServicoAtualizacao(janela: BrowserWindow): void {
  janelaPrincipal = janela

  if (!atualizacaoHabilitada()) {
    definirEstado({
      ativo: false,
      mensagem:
        process.env.PDV_DESATIVAR_ATUALIZACAO === '1'
          ? 'Atualizacao automatica desativada por configuracao.'
          : 'Modo desenvolvimento: atualizacao automatica desligada.',
    })
    return
  }

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    definirEstado({
      ativo: true,
      verificando: true,
      erro: null,
      mensagem: 'Consultando servidor de atualizacao...',
    })
  })

  autoUpdater.on('update-available', (info) => {
    registrarInfo('Atualizacao disponivel', {
      operacao: 'app.atualizacao',
      versao: info.version,
    })
    definirEstado({
      ativo: true,
      verificando: false,
      baixando: true,
      baixada: false,
      versaoDisponivel: info.version,
      progressoPercentual: 0,
      mensagem: `Versao ${info.version} encontrada. Baixando...`,
    })
  })

  autoUpdater.on('update-not-available', (info) => {
    definirEstado({
      ativo: true,
      verificando: false,
      baixando: false,
      baixada: false,
      versaoDisponivel: null,
      progressoPercentual: null,
      erro: null,
      mensagem: `Voce ja esta na versao mais recente (${info.version}).`,
    })
  })

  autoUpdater.on('download-progress', (progresso) => {
    definirEstado({
      ativo: true,
      baixando: true,
      progressoPercentual: Math.round(progresso.percent),
      mensagem: `Baixando atualizacao... ${Math.round(progresso.percent)}%`,
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    registrarInfo('Atualizacao baixada', {
      operacao: 'app.atualizacao',
      versao: info.version,
    })
    definirEstado({
      ativo: true,
      verificando: false,
      baixando: false,
      baixada: true,
      versaoDisponivel: info.version,
      progressoPercentual: 100,
      erro: null,
      mensagem: `Versao ${info.version} pronta. Reinicie o PDV para aplicar.`,
    })
  })

  autoUpdater.on('error', (erro) => {
    registrarErro('Erro no auto-updater', { operacao: 'app.atualizacao' }, erro)
    definirEstado({
      verificando: false,
      baixando: false,
      erro: erro.message,
      mensagem: 'Erro ao verificar ou baixar atualizacao.',
    })
  })

  setTimeout(() => {
    void verificarAtualizacao()
  }, 15_000)

  intervaloVerificacao = setInterval(() => {
    void verificarAtualizacao()
  }, INTERVALO_VERIFICACAO_MS)
}

export function encerrarServicoAtualizacao(): void {
  if (intervaloVerificacao) {
    clearInterval(intervaloVerificacao)
    intervaloVerificacao = null
  }
}
