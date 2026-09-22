import { BrowserWindow } from 'electron'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { configurarServicoAtualizacao } from './servico-atualizacao'

const CONFIGURACAO_SEGURANCA = {
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
} as const

export function criarJanelaPrincipal(): BrowserWindow {
  const caminhosIcone = [
    join(process.cwd(), 'resources', 'icon.ico'),
    join(__dirname, '../../resources/icon.ico'),
    join(process.cwd(), 'resources', 'logo-jardins.jpg'),
    join(__dirname, '../../resources/logo-jardins.jpg'),
  ]
  const icone = caminhosIcone.find((caminho) => existsSync(caminho))

  const janela = new BrowserWindow({
    width: 960,
    height: 640,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    ...(icone ? { icon: icone } : {}),
    webPreferences: {
      ...CONFIGURACAO_SEGURANCA,
      preload: join(__dirname, '../preload/index.js'),
    },
  })

  janela.on('ready-to-show', () => {
    janela.show()
    configurarServicoAtualizacao(janela)
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    janela.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    janela.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return janela
}

export { CONFIGURACAO_SEGURANCA }
