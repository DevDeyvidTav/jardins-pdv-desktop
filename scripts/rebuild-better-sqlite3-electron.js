/**
 * Recompila better-sqlite3 para Electron e Node (testes).
 *
 * - electron/better_sqlite3.node → ABI do Electron (app)
 * - build/Release/better_sqlite3.node → ABI do Node (vitest)
 */
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const raiz = path.join(__dirname, '..')
const modulo = path.join(raiz, 'node_modules', 'better-sqlite3')
const electronVersion = require(path.join(raiz, 'node_modules', 'electron', 'package.json')).version
const binarioRelease = path.join(modulo, 'build', 'Release', 'better_sqlite3.node')
const binarioElectron = path.join(modulo, 'electron', 'better_sqlite3.node')

function limparEnvNpm() {
  const env = { ...process.env }
  for (const chave of Object.keys(env)) {
    if (chave.startsWith('npm_config_')) {
      delete env[chave]
    }
  }
  return env
}

function nodeGypViaNpx(args, envExtra) {
  const env = limparEnvNpm()
  Object.assign(env, envExtra)
  const resultado = spawnSync('npx', ['node-gyp', ...args], {
    cwd: modulo,
    stdio: 'inherit',
    env,
    shell: true,
  })
  if (resultado.status !== 0) {
    process.exit(resultado.status ?? 1)
  }
}

if (!fs.existsSync(modulo)) {
  console.error('better-sqlite3 nao encontrado. Rode npm install.')
  process.exit(1)
}

console.log(`[1/2] better-sqlite3 para Electron ${electronVersion}...`)
if (fs.existsSync(path.join(modulo, 'build'))) {
  fs.rmSync(path.join(modulo, 'build'), { recursive: true, force: true })
}

nodeGypViaNpx(['rebuild', '--release'], {
  npm_config_runtime: 'electron',
  npm_config_target: electronVersion,
  npm_config_disturl: 'https://electronjs.org/headers',
  npm_config_arch: process.arch,
})

if (!fs.existsSync(binarioRelease)) {
  console.error('Falha: binario Electron nao gerado.')
  process.exit(1)
}

fs.mkdirSync(path.dirname(binarioElectron), { recursive: true })
fs.copyFileSync(binarioRelease, binarioElectron)
console.log('Copiado para', binarioElectron)

console.log('[2/2] better-sqlite3 para Node (testes)...')
nodeGypViaNpx(['rebuild', '--release'], {})

if (!fs.existsSync(binarioRelease)) {
  console.error('Falha: binario Node nao gerado.')
  process.exit(1)
}

console.log('Rebuild nativo concluido.')
console.log('  Electron:', binarioElectron)
console.log('  Node:    ', binarioRelease)
