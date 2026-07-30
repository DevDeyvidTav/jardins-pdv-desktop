import { copyFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

const require = createRequire(import.meta.url)
const diretorioWasmSqlJs = dirname(
  require.resolve('sql.js/dist/sql-wasm.wasm'),
)

function copiarWasmSqlJs(pastaDestino: string): Plugin {
  return {
    name: 'copiar-wasm-sqljs',
    closeBundle() {
      mkdirSync(pastaDestino, { recursive: true })
      copyFileSync(
        join(diretorioWasmSqlJs, 'sql-wasm.wasm'),
        join(pastaDestino, 'sql-wasm.wasm'),
      )
    },
  }
}

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin(),
      copiarWasmSqlJs(resolve(dirname(fileURLToPath(import.meta.url)), 'out/main')),
    ],
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
      },
    },
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer'),
        '@shared': resolve('src/shared'),
      },
    },
    plugins: [react()],
  },
})
