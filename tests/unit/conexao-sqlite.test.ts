import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  abrirConexaoSqlite,
  bancoEstaInicializado,
  consultarValorMetadata,
  executarMigracoes,
  fecharConexaoSqlite,
} from '../../src/main/database/conexao-sqlite'

describe('conexao SQLite', () => {
  let diretorioTemporario: string
  let caminhoBanco: string

  afterEach(() => {
    if (diretorioTemporario) {
      rmSync(diretorioTemporario, { recursive: true, force: true })
    }
  })

  async function criarBancoTemporario() {
    diretorioTemporario = mkdtempSync(join(tmpdir(), 'pdv-sqlite-'))
    caminhoBanco = join(diretorioTemporario, 'teste.sqlite')
    return abrirConexaoSqlite(caminhoBanco)
  }

  it('executa migracoes e marca banco como inicializado', async () => {
    const conexao = await criarBancoTemporario()

    expect(bancoEstaInicializado(conexao)).toBe(false)

    executarMigracoes(conexao)

    expect(bancoEstaInicializado(conexao)).toBe(true)
    expect(consultarValorMetadata(conexao, 'schema_version')).toBe('1')

    fecharConexaoSqlite(conexao)
  })

  it('nao reaplica migracoes ja executadas', async () => {
    const conexao = await criarBancoTemporario()

    executarMigracoes(conexao)
    executarMigracoes(conexao)

    const registros = conexao.instancia.exec(
      'SELECT COUNT(*) as total FROM app_metadata',
    )

    expect(registros[0]?.values[0]?.[0]).toBe(1)

    fecharConexaoSqlite(conexao)
  })
})
