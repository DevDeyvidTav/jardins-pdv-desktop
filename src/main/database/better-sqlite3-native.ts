import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import Database from 'better-sqlite3'

/**
 * Playwright carrega estes arquivos como CommonJS e recusa `import.meta`.
 * Em CJS usamos o `module` local; em ESM (Vitest) caímos no package.json do cwd.
 */
function obterRequireNativo(): NodeJS.Require {
  const moduleCjs = typeof module !== 'undefined' ? module : undefined
  if (moduleCjs?.filename) {
    return createRequire(moduleCjs.filename)
  }

  return createRequire(join(process.cwd(), 'package.json'))
}

const requireNativo = obterRequireNativo()

let caminhoBinarioElectronCache: string | null | undefined

/** Binário compilado com `npm run rebuild:native` para o ABI do Electron. */
export function obterCaminhoBinarioElectron(): string | null {
  if (!process.versions.electron) {
    return null
  }
  if (caminhoBinarioElectronCache !== undefined) {
    return caminhoBinarioElectronCache
  }

  try {
    const pacote = dirname(requireNativo.resolve('better-sqlite3/package.json'))
    const candidatos = [
      join(pacote, 'electron', 'better_sqlite3.node'),
      join(pacote, 'build', 'Release', 'better_sqlite3.node'),
    ]
    caminhoBinarioElectronCache =
      candidatos.find((caminho) => existsSync(caminho)) ?? null
  } catch {
    caminhoBinarioElectronCache = null
  }

  return caminhoBinarioElectronCache
}

export function criarDatabaseNativo(
  caminho: string,
  opcoesExtra: Database.Options = {},
): Database.Database {
  const binarioElectron = obterCaminhoBinarioElectron()
  const opcoes: Database.Options = { timeout: 5000, ...opcoesExtra }
  if (binarioElectron) {
    opcoes.nativeBinding = binarioElectron
  }
  return new Database(caminho, opcoes)
}
