import { randomUUID } from 'node:crypto'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  unlinkSync,
} from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { registrarErro, registrarInfo, registrarAviso } from '../logging/logger'

export interface OpcoesBackup {
  /** Intervalo mínimo entre backups automáticos de boot (ms). Default: 12h. */
  intervaloMinimoMs?: number
  /** Quantidade máxima de arquivos de backup. Default: 14. */
  retencao?: number
  diretorioOverride?: string
}

const INTERVALO_PADRAO_MS = 12 * 60 * 60 * 1000
const RETENCAO_PADRAO = 14

let diretorioBackupOverride: string | null = null
let ultimoBackupBootEm = 0

function obterUserDataSeguro(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { app } = require('electron') as typeof import('electron')
    if (app?.getPath) return app.getPath('userData')
  } catch {
    // ignore
  }
  return join(tmpdir(), 'pdv-userdata')
}

export function definirDiretorioBackupParaTestes(caminho: string | null): void {
  diretorioBackupOverride = caminho
  ultimoBackupBootEm = 0
}

export function obterDiretorioBackups(): string {
  if (diretorioBackupOverride) {
    mkdirSync(diretorioBackupOverride, { recursive: true })
    return diretorioBackupOverride
  }

  const diretorio = join(obterUserDataSeguro(), 'backups')
  mkdirSync(diretorio, { recursive: true })
  return diretorio
}

function formatarCarimbo(agora = new Date()): string {
  const yyyy = agora.getUTCFullYear()
  const mm = String(agora.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(agora.getUTCDate()).padStart(2, '0')
  const hh = String(agora.getUTCHours()).padStart(2, '0')
  const mi = String(agora.getUTCMinutes()).padStart(2, '0')
  const ss = String(agora.getUTCSeconds()).padStart(2, '0')
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`
}

export function listarBackups(diretorio = obterDiretorioBackups()): string[] {
  if (!existsSync(diretorio)) return []
  return readdirSync(diretorio)
    .filter((nome) => nome.startsWith('pdv-backup-') && nome.endsWith('.sqlite'))
    .map((nome) => join(diretorio, nome))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)
}

export function aplicarRetencaoBackups(
  retencao = RETENCAO_PADRAO,
  diretorio = obterDiretorioBackups(),
): void {
  const backups = listarBackups(diretorio)
  for (const caminho of backups.slice(retencao)) {
    try {
      unlinkSync(caminho)
    } catch (erro) {
      registrarAviso('Falha ao remover backup antigo', {
        operacao: 'backup.retencao',
        arquivo: basename(caminho),
      }, erro)
    }
  }
}

/**
 * Cria cópia do banco atual. Nunca altera/exclui o arquivo de origem.
 * Preferir `nativo` (VACUUM INTO) quando a conexão estiver aberta — evita EBUSY no Windows.
 * Retorna o caminho do backup ou null se a origem não existir.
 */
export function criarBackupBanco(
  caminhoBanco: string,
  schemaVersion: number | string,
  motivo: string,
  opcoes: OpcoesBackup & { nativo?: import('better-sqlite3').Database } = {},
): string | null {
  if (!opcoes.nativo && !existsSync(caminhoBanco)) {
    return null
  }

  const diretorio = opcoes.diretorioOverride ?? obterDiretorioBackups()
  mkdirSync(diretorio, { recursive: true })

  const destino = join(
    diretorio,
    `pdv-backup-v${schemaVersion}-${formatarCarimbo()}-${motivo}-${randomUUID().slice(0, 8)}.sqlite`,
  )

  try {
    if (opcoes.nativo) {
      const destinoSql = destino.replace(/'/g, "''")
      opcoes.nativo.exec(`VACUUM INTO '${destinoSql}'`)
    } else {
      copyFileSync(caminhoBanco, destino)
    }
    aplicarRetencaoBackups(opcoes.retencao ?? RETENCAO_PADRAO, diretorio)
    registrarInfo('Backup do banco criado', {
      operacao: 'backup.criar',
      motivo,
      schemaVersion,
      destino: basename(destino),
    })
    return destino
  } catch (erro) {
    registrarErro(
      'Falha ao criar backup do banco (banco atual preservado)',
      { operacao: 'backup.criar', motivo, schemaVersion },
      erro,
    )
    throw erro
  }
}

export function criarBackupBootSeNecessario(
  caminhoBanco: string,
  schemaVersion: number | string,
  opcoes: OpcoesBackup & { nativo?: import('better-sqlite3').Database } = {},
): string | null {
  const intervalo = opcoes.intervaloMinimoMs ?? INTERVALO_PADRAO_MS
  const agora = Date.now()
  if (agora - ultimoBackupBootEm < intervalo) {
    return null
  }

  const destino = criarBackupBanco(caminhoBanco, schemaVersion, 'boot', opcoes)
  ultimoBackupBootEm = agora
  return destino
}

/**
 * Restaura backup para o caminho do banco. O banco atual é movido para
 * `*.pre-restore` antes da cópia. Não abre conexão — caller deve reinicializar.
 */
export function restaurarBackup(
  caminhoBackup: string,
  caminhoBanco: string,
): void {
  if (!existsSync(caminhoBackup)) {
    throw new Error(`Backup nao encontrado: ${caminhoBackup}`)
  }

  const diretorio = dirname(caminhoBanco)
  mkdirSync(diretorio, { recursive: true })

  if (existsSync(caminhoBanco)) {
    const preservado = `${caminhoBanco}.pre-restore-${formatarCarimbo()}`
    copyFileSync(caminhoBanco, preservado)
  }

  copyFileSync(caminhoBackup, caminhoBanco)
  registrarInfo('Backup restaurado', {
    operacao: 'backup.restaurar',
    backup: basename(caminhoBackup),
  })
}

export function obterBackupMaisRecente(): string | null {
  return listarBackups()[0] ?? null
}
