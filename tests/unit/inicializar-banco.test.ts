import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  bancoLocalEstaPronto,
  encerrarBancoLocal,
  inicializarBancoLocal,
} from '../../src/main/database/inicializar-banco'

describe('inicializar banco local', () => {
  let diretorioTemporario: string
  let caminhoBanco: string

  afterEach(() => {
    encerrarBancoLocal()

    if (diretorioTemporario) {
      rmSync(diretorioTemporario, { recursive: true, force: true })
    }
  })

  it('inicializa o SQLite e deixa o banco pronto para uso', async () => {
    diretorioTemporario = mkdtempSync(join(tmpdir(), 'pdv-init-'))
    caminhoBanco = join(diretorioTemporario, 'pdv-local.sqlite')

    await inicializarBancoLocal(caminhoBanco)

    expect(bancoLocalEstaPronto()).toBe(true)
  })
})
