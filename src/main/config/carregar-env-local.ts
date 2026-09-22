import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

/** Nao sobrescreve variaveis ja definidas no process.env. */
export function aplicarArquivoEnv(
  caminho: string,
  env: NodeJS.ProcessEnv = process.env,
): number {
  if (!existsSync(caminho)) {
    return 0
  }

  let aplicadas = 0
  const conteudo = readFileSync(caminho, 'utf8')
  for (const linha of conteudo.split(/\r?\n/)) {
    const texto = linha.trim()
    if (!texto || texto.startsWith('#')) {
      continue
    }

    const separador = texto.indexOf('=')
    if (separador <= 0) {
      continue
    }

    const chave = texto.slice(0, separador).trim()
    const valor = texto.slice(separador + 1).trim()
    if (env[chave] === undefined) {
      env[chave] = valor
      aplicadas += 1
    }
  }

  return aplicadas
}

export function aplicativoEmpacotado(): boolean {
  return Boolean(process.versions.electron) && process.defaultApp !== true
}

export function listarCaminhosEnv(opcoes: {
  cwd?: string
  execPath?: string
  resourcesPath?: string | null
  empacotado?: boolean
}): string[] {
  const caminhos: string[] = []

  if (opcoes.cwd) {
    caminhos.push(resolve(opcoes.cwd, '.env'))
  }

  if (opcoes.execPath) {
    caminhos.push(join(dirname(opcoes.execPath), '.env'))
  }

  if (opcoes.empacotado && opcoes.resourcesPath) {
    caminhos.push(join(opcoes.resourcesPath, 'resources', 'sync.env'))
    caminhos.push(join(opcoes.resourcesPath, 'sync.env'))
  }

  return caminhos
}

/** Carrega `.env` de dev e, no instalador, `sync.env` empacotado (nao sobrescreve o que ja existe). */
export function carregarEnvLocal(env: NodeJS.ProcessEnv = process.env): void {
  const caminhos = listarCaminhosEnv({
    cwd: process.cwd(),
    execPath: process.execPath,
    resourcesPath: process.resourcesPath ?? null,
    empacotado: aplicativoEmpacotado(),
  })

  for (const caminho of caminhos) {
    aplicarArquivoEnv(caminho, env)
  }
}
