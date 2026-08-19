import { existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { ErroBancoLocal } from '@shared/errors/erros-aplicacao'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import { REGISTRO_MIGRACOES } from './migracoes/registro-migracoes'
import { DatabaseCompativel } from './adaptador-better-sqlite3'
import { criarDatabaseNativo } from './better-sqlite3-native'
import { criarBackupBanco, criarBackupBootSeNecessario, obterBackupMaisRecente } from './backup-banco'
import { registrarErro, registrarInfo } from '../logging/logger'

const CHAVE_VERSAO_MIGRACOES = 'schema_version'
import type Database from 'better-sqlite3'

export interface ConexaoSqlite {
  /** API compatível com o antigo sql.js (prepare/bind/step/run/exec). */
  instancia: DatabaseCompativel
  caminhoArquivo: string
  /** Handle nativo better-sqlite3 (transações tipadas / pragmas). */
  nativo: Database.Database
}

export class ErroIntegridadeBanco extends ErroBancoLocal {
  readonly backupMaisRecente: string | null

  constructor(mensagem: string, backupMaisRecente: string | null, cause?: unknown) {
    super(mensagem, { cause })
    this.name = 'ErroIntegridadeBanco'
    this.backupMaisRecente = backupMaisRecente
  }
}

let profundidadeTransacao = 0

function aplicarPragmas(db: Database.Database): void {
  // FK obrigatórias em toda conexão
  db.pragma('foreign_keys = ON')
  // WAL: melhor concorrência leitura/escrita em desktop single-user
  db.pragma('journal_mode = WAL')
  // Espera até 5s em locks (evita SQLITE_BUSY imediato)
  db.pragma('busy_timeout = 5000')
  // NORMAL: fsync em checkpoints críticos; equilíbrio desktop vs FULL
  db.pragma('synchronous = NORMAL')
  // Cache ~8MB
  db.pragma('cache_size = -8000')
  // Temporários em memória
  db.pragma('temp_store = MEMORY')
}

function verificarIntegridade(db: Database.Database): string {
  const resultado = db.pragma('integrity_check') as Array<{ integrity_check: string }>
  if (!Array.isArray(resultado) || resultado.length === 0) {
    return 'unknown'
  }
  return String(resultado[0]?.integrity_check ?? 'unknown')
}

export function abrirConexaoSqliteSync(
  caminhoArquivo: string,
  opcoes: { pularIntegridade?: boolean; memoria?: boolean } = {},
): ConexaoSqlite {
  try {
    if (!opcoes.memoria) {
      mkdirSync(dirname(caminhoArquivo), { recursive: true })
    }

    const nativo = criarDatabaseNativo(opcoes.memoria ? ':memory:' : caminhoArquivo)

    aplicarPragmas(nativo)

    if (!opcoes.pularIntegridade && !opcoes.memoria && existsSync(caminhoArquivo)) {
      const check = verificarIntegridade(nativo)
      if (check !== 'ok') {
        nativo.close()
        throw new ErroIntegridadeBanco(
          `Falha na verificacao de integridade do banco (${check}). Restaure o backup mais recente manualmente.`,
          obterBackupMaisRecente(),
        )
      }
    }

    const instancia = new DatabaseCompativel(nativo)
    return { instancia, caminhoArquivo, nativo }
  } catch (erro) {
    if (erro instanceof ErroIntegridadeBanco) throw erro
    const mensagem = erro instanceof Error ? erro.message : String(erro)
    if (/not a database|malformed|corrupt|file is not a database/i.test(mensagem)) {
      throw new ErroIntegridadeBanco(
        `Falha na verificacao de integridade do banco. Restaure o backup mais recente manualmente.`,
        obterBackupMaisRecente(),
        erro,
      )
    }
    throw new ErroBancoLocal('Nao foi possivel abrir o banco SQLite local.', {
      cause: erro,
    })
  }
}

/** Assinatura async mantida para compatibilidade com sql.js. */
export async function abrirConexaoSqlite(
  caminhoArquivo: string,
  opcoes?: { pularIntegridade?: boolean; memoria?: boolean },
): Promise<ConexaoSqlite> {
  return abrirConexaoSqliteSync(caminhoArquivo, opcoes)
}

export function iniciarTransacaoImediata(conexao: ConexaoSqlite): void {
  conexao.nativo.exec('BEGIN IMMEDIATE')
  profundidadeTransacao += 1
}

export function iniciarTransacao(conexao: ConexaoSqlite): void {
  conexao.nativo.exec('BEGIN')
  profundidadeTransacao += 1
}

export function confirmarTransacao(conexao: ConexaoSqlite): void {
  conexao.nativo.exec('COMMIT')
  profundidadeTransacao = Math.max(0, profundidadeTransacao - 1)
}

export function reverterTransacao(conexao: ConexaoSqlite): void {
  try {
    if (profundidadeTransacao > 0) {
      conexao.nativo.exec('ROLLBACK')
    }
  } finally {
    profundidadeTransacao = Math.max(0, profundidadeTransacao - 1)
  }
}

export function reiniciarControleTransacao(): void {
  profundidadeTransacao = 0
}

/**
 * Executa `fn` dentro de BEGIN IMMEDIATE … COMMIT.
 * Rollback automático em qualquer erro.
 */
export function executarEmTransacaoImediata<T>(
  conexao: ConexaoSqlite,
  fn: () => T,
): T {
  iniciarTransacaoImediata(conexao)
  try {
    const resultado = fn()
    confirmarTransacao(conexao)
    return resultado
  } catch (erro) {
    reverterTransacao(conexao)
    throw erro
  }
}

export function fecharConexaoSqlite(conexao: ConexaoSqlite): void {
  try {
    try {
      conexao.nativo.pragma('wal_checkpoint(TRUNCATE)')
    } catch {
      // ignore checkpoint errors on close
    }
  } finally {
    profundidadeTransacao = 0
    conexao.nativo.close()
  }
}

/**
 * Com better-sqlite3 o arquivo já é persistente.
 * Mantido como no-op compatível (exceto fora de transação: checkpoint leve).
 */
export function persistirConexaoBanco(conexao: ConexaoSqlite): void {
  if (profundidadeTransacao > 0) return
  if (conexao.caminhoArquivo === ':memory:') return
  try {
    conexao.nativo.pragma('wal_checkpoint(PASSIVE)')
  } catch {
    // ignore
  }
}

function tabelaAppMetadataExiste(conexao: ConexaoSqlite): boolean {
  const consulta = conexao.instancia.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'app_metadata'",
  )
  const existe = consulta.step()
  consulta.free()
  return existe
}

export function obterVersaoSchema(conexao: ConexaoSqlite): number {
  if (!tabelaAppMetadataExiste(conexao)) {
    return 0
  }

  const valor = consultarValorMetadata(conexao, CHAVE_VERSAO_MIGRACOES)
  if (!valor) return 0
  const versao = Number.parseInt(valor, 10)
  return Number.isNaN(versao) ? 0 : versao
}

function registrarVersaoMigracao(conexao: ConexaoSqlite, versao: number): void {
  const agora = agoraEmIsoUtc()
  const valor = String(versao)

  conexao.instancia.run(
    `INSERT INTO app_metadata (chave, valor, criado_em, atualizado_em)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(chave) DO UPDATE SET
       valor = excluded.valor,
       atualizado_em = excluded.atualizado_em`,
    [CHAVE_VERSAO_MIGRACOES, valor, agora, agora],
  )
}

export function executarMigracoes(conexao: ConexaoSqlite): void {
  const versaoAtual = obterVersaoSchema(conexao)
  const migracoesPendentes = REGISTRO_MIGRACOES.filter(
    (migracao) => migracao.versao > versaoAtual,
  )

  if (migracoesPendentes.length === 0) {
    registrarInfo('Nenhuma migration pendente', {
      operacao: 'migration',
      schemaVersion: versaoAtual,
    })
    return
  }

  registrarInfo('Iniciando migrations', {
    operacao: 'migration',
    schemaVersionAntes: versaoAtual,
    pendentes: migracoesPendentes.map((m) => m.versao).join(','),
  })

  if (conexao.caminhoArquivo !== ':memory:' && existsSync(conexao.caminhoArquivo) && versaoAtual > 0) {
    try {
      criarBackupBanco(conexao.caminhoArquivo, versaoAtual, 'pre-migration', {
        nativo: conexao.nativo,
      })
    } catch (erro) {
      registrarErro(
        'Backup pre-migration falhou; abortando migrations para preservar dados',
        { operacao: 'migration.backup', schemaVersion: versaoAtual },
        erro,
      )
      throw new ErroBancoLocal(
        'Nao foi possivel criar backup antes das migrations. Banco original preservado.',
        { cause: erro },
      )
    }
  }

  conexao.nativo.exec('BEGIN')

  try {
    for (const migracao of migracoesPendentes) {
      conexao.nativo.exec(migracao.sql)
      registrarVersaoMigracao(conexao, migracao.versao)
      registrarInfo('Migration aplicada', {
        operacao: 'migration.aplicar',
        nome: migracao.nome,
        schemaVersion: migracao.versao,
      })
    }

    conexao.nativo.exec('COMMIT')

    const versaoDepois = obterVersaoSchema(conexao)
    registrarInfo('Migrations concluidas', {
      operacao: 'migration',
      schemaVersionAntes: versaoAtual,
      schemaVersion: versaoDepois,
    })
  } catch (erro) {
    try {
      conexao.nativo.exec('ROLLBACK')
    } catch {
      // ignore
    }
    registrarErro(
      'Falha ao executar migracoes; banco original preservado via rollback/backup',
      { operacao: 'migration', schemaVersionAntes: versaoAtual },
      erro,
    )
    throw new ErroBancoLocal('Falha ao executar migracoes do banco local.', {
      cause: erro,
    })
  }
}

export function bancoEstaInicializado(conexao: ConexaoSqlite): boolean {
  if (!tabelaAppMetadataExiste(conexao)) {
    return false
  }
  return obterVersaoSchema(conexao) > 0
}

export function consultarValorMetadata(
  conexao: ConexaoSqlite,
  chave: string,
): string | null {
  if (!tabelaAppMetadataExiste(conexao)) {
    return null
  }

  const consulta = conexao.instancia.prepare(
    'SELECT valor FROM app_metadata WHERE chave = ?',
  )
  consulta.bind([chave])

  if (!consulta.step()) {
    consulta.free()
    return null
  }

  const linha = consulta.getAsObject() as { valor?: string }
  consulta.free()
  return linha.valor ?? null
}

export function definirValorMetadata(
  conexao: ConexaoSqlite,
  chave: string,
  valor: string,
): void {
  const agora = agoraEmIsoUtc()
  conexao.instancia.run(
    `INSERT INTO app_metadata (chave, valor, criado_em, atualizado_em)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(chave) DO UPDATE SET
       valor = excluded.valor,
       atualizado_em = excluded.atualizado_em`,
    [chave, valor, agora, agora],
  )
  persistirConexaoBanco(conexao)
}

export function prepararBootBanco(conexao: ConexaoSqlite): void {
  const versao = obterVersaoSchema(conexao)
  if (conexao.caminhoArquivo !== ':memory:') {
    try {
      criarBackupBootSeNecessario(conexao.caminhoArquivo, versao, {
        nativo: conexao.nativo,
      })
    } catch (erro) {
      registrarErro(
        'Falha no backup automatico de boot (banco permanece utilizavel)',
        { operacao: 'backup.boot', schemaVersion: versao },
        erro,
      )
    }
  }
}
