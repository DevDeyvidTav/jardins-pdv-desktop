import { appendFileSync, mkdirSync, readdirSync, renameSync, statSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

export type NivelLog = 'info' | 'warn' | 'error'

export interface ContextoLog {
  operacao?: string
  pedidoId?: string
  divisaoId?: string
  pagamentoId?: string
  codigoErro?: string
  schemaVersion?: number | string
  [chave: string]: unknown
}

const RETENCAO_LOGS_DIAS = 14
let diretorioLogsOverride: string | null = null

function tentarAppElectron(): typeof import('electron').app | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const electron = require('electron') as typeof import('electron')
    return electron.app ?? null
  } catch {
    return null
  }
}

export function definirDiretorioLogsParaTestes(caminho: string | null): void {
  diretorioLogsOverride = caminho
}

export function obterDiretorioLogs(): string {
  if (diretorioLogsOverride) {
    mkdirSync(diretorioLogsOverride, { recursive: true })
    return diretorioLogsOverride
  }

  const electronApp = tentarAppElectron()
  let base = join(tmpdir(), 'pdv-logs')
  try {
    if (electronApp?.getPath) {
      base = electronApp.getPath('userData')
    }
  } catch {
    // ambiente de teste sem app pronto
  }

  const diretorio = join(base, 'logs')
  mkdirSync(diretorio, { recursive: true })
  return diretorio
}

function obterVersaoApp(): string {
  try {
    const electronApp = tentarAppElectron()
    if (electronApp?.getVersion) return electronApp.getVersion()
  } catch {
    // ignore
  }
  return process.env.npm_package_version ?? '0.0.0'
}

function caminhoArquivoLogDoDia(agora = new Date()): string {
  const yyyy = agora.getUTCFullYear()
  const mm = String(agora.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(agora.getUTCDate()).padStart(2, '0')
  return join(obterDiretorioLogs(), `pdv-${yyyy}-${mm}-${dd}.log`)
}

function serializarErro(erro: unknown): Record<string, unknown> | undefined {
  if (erro == null) return undefined
  if (erro instanceof Error) {
    const comCodigo = erro as Error & { codigo?: unknown }
    return {
      name: erro.name,
      message: erro.message,
      stack: erro.stack,
      ...(typeof comCodigo.codigo === 'string' ? { codigo: comCodigo.codigo } : {}),
    }
  }
  return { valor: String(erro) }
}

export function registrarLog(
  nivel: NivelLog,
  mensagem: string,
  contexto: ContextoLog = {},
  erro?: unknown,
): void {
  const entrada = {
    em: new Date().toISOString(),
    nivel,
    mensagem,
    versaoApp: obterVersaoApp(),
    ...contexto,
    erro: serializarErro(erro),
  }

  const linha = `${JSON.stringify(entrada)}\n`
  try {
    appendFileSync(caminhoArquivoLogDoDia(), linha, 'utf8')
  } catch {
    // Evita loop de falha de logging
    console.error('[log]', mensagem, erro)
  }

  if (nivel === 'error') {
    console.error(`[pdv:${contexto.operacao ?? 'geral'}]`, mensagem, erro ?? '')
  }
}

export function registrarErro(
  mensagem: string,
  contexto: ContextoLog = {},
  erro?: unknown,
): void {
  registrarLog('error', mensagem, contexto, erro)
}

export function registrarInfo(
  mensagem: string,
  contexto: ContextoLog = {},
): void {
  registrarLog('info', mensagem, contexto)
}

export function registrarAviso(
  mensagem: string,
  contexto: ContextoLog = {},
  erro?: unknown,
): void {
  registrarLog('warn', mensagem, contexto, erro)
}

export function rotacionarLogsAntigos(retencaoDias = RETENCAO_LOGS_DIAS): void {
  const diretorio = obterDiretorioLogs()
  const limiteMs = Date.now() - retencaoDias * 24 * 60 * 60 * 1000

  for (const nome of readdirSync(diretorio)) {
    if (!nome.startsWith('pdv-') || !nome.endsWith('.log')) continue
    const caminho = join(diretorio, nome)
    try {
      if (statSync(caminho).mtimeMs < limiteMs) {
        unlinkSync(caminho)
      }
    } catch {
      // ignora
    }
  }
}

export function instalarHandlersProcesso(): void {
  process.on('uncaughtException', (erro) => {
    registrarErro('Excecao nao tratada no processo main', { operacao: 'uncaughtException' }, erro)
  })

  process.on('unhandledRejection', (razao) => {
    registrarErro(
      'Promise rejeitada sem tratamento no processo main',
      { operacao: 'unhandledRejection' },
      razao,
    )
  })
}

/** Utilitário de teste: renomeia arquivo de log ativo (sem uso em produção). */
export function renomearLogAtivoParaTeste(destino: string): void {
  try {
    renameSync(caminhoArquivoLogDoDia(), destino)
  } catch {
    // ignore
  }
}
