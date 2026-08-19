import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/** Carrega `.env` do diretorio de trabalho (nao sobrescreve variaveis ja definidas). */
export function carregarEnvLocal(): void {
  const caminho = resolve(process.cwd(), '.env')
  if (!existsSync(caminho)) {
    return
  }

  const conteudo = readFileSync(caminho, 'utf8')
  for (const linha of conteudo.split('\n')) {
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
    if (process.env[chave] === undefined) {
      process.env[chave] = valor
    }
  }
}
