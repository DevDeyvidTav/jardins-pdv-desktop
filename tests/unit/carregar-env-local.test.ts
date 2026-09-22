import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  aplicarArquivoEnv,
  listarCaminhosEnv,
} from '../../src/main/config/carregar-env-local'

describe('carregar env local', () => {
  const pastas: string[] = []

  afterEach(() => {
    for (const pasta of pastas.splice(0)) {
      rmSync(pasta, { recursive: true, force: true })
    }
  })

  it('aplica chaves novas e preserva as ja definidas', () => {
    const pasta = mkdtempSync(join(tmpdir(), 'pdv-env-'))
    pastas.push(pasta)
    const arquivo = join(pasta, 'sync.env')
    writeFileSync(
      arquivo,
      'PDV_SYNC_API_URL=https://api.exemplo.com\nPDV_DISPOSITIVO_ID=abc\n',
      'utf8',
    )

    const env: NodeJS.ProcessEnv = { PDV_DISPOSITIVO_ID: 'ja-tinha' }
    expect(aplicarArquivoEnv(arquivo, env)).toBe(1)
    expect(env.PDV_SYNC_API_URL).toBe('https://api.exemplo.com')
    expect(env.PDV_DISPOSITIVO_ID).toBe('ja-tinha')
  })

  it('no instalador inclui sync.env dos extraResources', () => {
    const caminhos = listarCaminhosEnv({
      cwd: 'C:\\dev',
      execPath: 'C:\\Program Files\\Jardins PDV\\Jardins PDV.exe',
      resourcesPath: 'C:\\Program Files\\Jardins PDV\\resources',
      empacotado: true,
    })

    expect(caminhos).toContain('C:\\Program Files\\Jardins PDV\\resources\\resources\\sync.env')
    expect(caminhos).toContain('C:\\Program Files\\Jardins PDV\\.env')
  })
})
