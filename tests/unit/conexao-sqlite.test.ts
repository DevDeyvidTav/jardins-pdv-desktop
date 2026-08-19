import { mkdtempSync, rmSync, existsSync, writeFileSync, readFileSync, copyFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  abrirConexaoSqlite,
  bancoEstaInicializado,
  consultarValorMetadata,
  executarMigracoes,
  fecharConexaoSqlite,
  obterVersaoSchema,
  ErroIntegridadeBanco,
} from '../../src/main/database/conexao-sqlite'
import {
  criarBackupBanco,
  aplicarRetencaoBackups,
  listarBackups,
  restaurarBackup,
  definirDiretorioBackupParaTestes,
} from '../../src/main/database/backup-banco'
import { definirDiretorioLogsParaTestes } from '../../src/main/logging/logger'
import { REGISTRO_MIGRACOES } from '../../src/main/database/migracoes/registro-migracoes'

describe('conexao SQLite (better-sqlite3)', () => {
  let diretorioTemporario: string
  let caminhoBanco: string

  afterEach(() => {
    definirDiretorioBackupParaTestes(null)
    definirDiretorioLogsParaTestes(null)
    if (diretorioTemporario) {
      try {
        rmSync(diretorioTemporario, { recursive: true, force: true })
      } catch {
        // Windows pode manter lock momentaneo apos falha de abertura
      }
    }
  })

  async function criarBancoTemporario(opcoes?: { pularIntegridade?: boolean }) {
    diretorioTemporario = mkdtempSync(join(tmpdir(), 'pdv-sqlite-'))
    caminhoBanco = join(diretorioTemporario, 'teste.sqlite')
    definirDiretorioBackupParaTestes(join(diretorioTemporario, 'backups'))
    definirDiretorioLogsParaTestes(join(diretorioTemporario, 'logs'))
    return abrirConexaoSqlite(caminhoBanco, opcoes)
  }

  it('abre banco novo, aplica migrations e marca como inicializado', async () => {
    const conexao = await criarBancoTemporario()

    expect(bancoEstaInicializado(conexao)).toBe(false)

    executarMigracoes(conexao)

    expect(bancoEstaInicializado(conexao)).toBe(true)
    expect(consultarValorMetadata(conexao, 'schema_version')).toBe(
      String(REGISTRO_MIGRACOES.at(-1)!.versao),
    )
    expect(conexao.nativo.pragma('foreign_keys', { simple: true })).toBe(1)

    const check = conexao.nativo.pragma('integrity_check') as Array<{
      integrity_check: string
    }>
    expect(check[0]?.integrity_check).toBe('ok')

    fecharConexaoSqlite(conexao)
  })

  it('nao reaplica migracoes ja executadas e preserva dados', async () => {
    const conexao = await criarBancoTemporario()

    executarMigracoes(conexao)
    const versao = obterVersaoSchema(conexao)
    conexao.instancia.run(
      `INSERT INTO app_metadata (chave, valor, criado_em, atualizado_em)
       VALUES ('marcador_teste', '1', datetime('now'), datetime('now'))`,
    )

    executarMigracoes(conexao)

    expect(consultarValorMetadata(conexao, 'schema_version')).toBe(String(versao))
    expect(consultarValorMetadata(conexao, 'marcador_teste')).toBe('1')
    expect(consultarValorMetadata(conexao, 'taxa_entrega_padrao_centavos')).toBe('0')

    const registros = conexao.instancia.exec(
      'SELECT COUNT(*) as total FROM app_metadata',
    )
    expect(Number(registros[0]?.values[0]?.[0])).toBeGreaterThanOrEqual(3)

    fecharConexaoSqlite(conexao)
  })

  it('reabre banco existente mantendo schema', async () => {
    const conexao = await criarBancoTemporario()
    executarMigracoes(conexao)
    const versao = obterVersaoSchema(conexao)
    fecharConexaoSqlite(conexao)

    const reaberta = await abrirConexaoSqlite(caminhoBanco)
    expect(obterVersaoSchema(reaberta)).toBe(versao)
    fecharConexaoSqlite(reaberta)
  })

  it('migration 17 cria FK de pagamento para parte da divisao', async () => {
    const conexao = await criarBancoTemporario()
    executarMigracoes(conexao)

    const fks = conexao.nativo.pragma(
      'foreign_key_list(pagamento_pedido)',
    ) as Array<{ table: string; from: string }>

    expect(
      fks.some(
        (fk) =>
          fk.table === 'pedido_divisao_parte' &&
          fk.from === 'pedido_divisao_parte_id',
      ),
    ).toBe(true)

    fecharConexaoSqlite(conexao)
  })

  it('cria backup, respeita retencao e restaura sem apagar origem', async () => {
    const conexao = await criarBancoTemporario()
    executarMigracoes(conexao)
    fecharConexaoSqlite(conexao)

    const backupDir = join(diretorioTemporario, 'backups')
    for (let i = 0; i < 16; i++) {
      criarBackupBanco(caminhoBanco, 17, `t${i}`, {
        retencao: 14,
        diretorioOverride: backupDir,
      })
    }

    expect(listarBackups(backupDir).length).toBe(14)
    aplicarRetencaoBackups(5, backupDir)
    expect(listarBackups(backupDir).length).toBe(5)

    const destinoRestore = join(diretorioTemporario, 'restaurado.sqlite')
    const backup = listarBackups(backupDir)[0]!
    restaurarBackup(backup, destinoRestore)
    expect(existsSync(destinoRestore)).toBe(true)
    expect(existsSync(caminhoBanco)).toBe(true)
  })

  it('detecta falha de integridade simulada', async () => {
    diretorioTemporario = mkdtempSync(join(tmpdir(), 'pdv-corrupt-'))
    caminhoBanco = join(diretorioTemporario, 'quebrado.sqlite')
    definirDiretorioBackupParaTestes(join(diretorioTemporario, 'backups'))

    writeFileSync(caminhoBanco, Buffer.from('isto-nao-e-sqlite'))

    await expect(abrirConexaoSqlite(caminhoBanco)).rejects.toBeInstanceOf(
      ErroIntegridadeBanco,
    )
  })
})
