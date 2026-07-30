import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { ErroBancoLocal } from '@shared/errors/erros-aplicacao'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import { REGISTRO_MIGRACOES } from './migracoes/registro-migracoes'

const CHAVE_VERSAO_MIGRACOES = 'schema_version'

let motorSql: SqlJsStatic | null = null

export interface ConexaoSqlite {
  instancia: Database
  caminhoArquivo: string
}

function obterCaminhoWasm(): string {
  const caminhoEmpacotado = join(__dirname, 'sql-wasm.wasm')

  if (existsSync(caminhoEmpacotado)) {
    return caminhoEmpacotado
  }

  const require = createRequire(import.meta.url)
  return join(
    dirname(require.resolve('sql.js/dist/sql-wasm.wasm')),
    'sql-wasm.wasm',
  )
}

async function obterMotorSql(): Promise<SqlJsStatic> {
  if (!motorSql) {
    motorSql = await initSqlJs({
      locateFile: () => obterCaminhoWasm(),
    })
  }

  return motorSql
}

function persistirBanco(conexao: ConexaoSqlite): void {
  const diretorio = dirname(conexao.caminhoArquivo)
  mkdirSync(diretorio, { recursive: true })
  const conteudo = conexao.instancia.export()
  writeFileSync(conexao.caminhoArquivo, Buffer.from(conteudo))
}

export async function abrirConexaoSqlite(
  caminhoArquivo: string,
): Promise<ConexaoSqlite> {
  try {
    const sql = await obterMotorSql()
    const diretorio = dirname(caminhoArquivo)
    mkdirSync(diretorio, { recursive: true })

    const instancia = existsSync(caminhoArquivo)
      ? new sql.Database(readFileSync(caminhoArquivo))
      : new sql.Database()

    instancia.run('PRAGMA foreign_keys = ON')

    return { instancia, caminhoArquivo }
  } catch (erro) {
    throw new ErroBancoLocal('Nao foi possivel abrir o banco SQLite local.', {
      cause: erro,
    })
  }
}

export function fecharConexaoSqlite(conexao: ConexaoSqlite): void {
  persistirBanco(conexao)
  conexao.instancia.close()
}

export function persistirConexaoBanco(conexao: ConexaoSqlite): void {
  persistirBanco(conexao)
}

function tabelaAppMetadataExiste(conexao: ConexaoSqlite): boolean {
  const consulta = conexao.instancia.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'app_metadata'",
  )
  const existe = consulta.step()
  consulta.free()
  return existe
}

function obterVersaoAtual(conexao: ConexaoSqlite): number {
  if (!tabelaAppMetadataExiste(conexao)) {
    return 0
  }

  const valor = consultarValorMetadata(conexao, CHAVE_VERSAO_MIGRACOES)
  if (!valor) {
    return 0
  }

  const versao = Number.parseInt(valor, 10)
  return Number.isNaN(versao) ? 0 : versao
}

function registrarVersaoMigracao(
  conexao: ConexaoSqlite,
  versao: number,
): void {
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
  const versaoAtual = obterVersaoAtual(conexao)
  const migracoesPendentes = REGISTRO_MIGRACOES.filter(
    (migracao) => migracao.versao > versaoAtual,
  )

  if (migracoesPendentes.length === 0) {
    return
  }

  conexao.instancia.run('BEGIN')

  try {
    for (const migracao of migracoesPendentes) {
      conexao.instancia.run(migracao.sql)
      registrarVersaoMigracao(conexao, migracao.versao)
    }

    conexao.instancia.run('COMMIT')
    persistirBanco(conexao)
  } catch (erro) {
    conexao.instancia.run('ROLLBACK')
    throw new ErroBancoLocal('Falha ao executar migracoes do banco local.', {
      cause: erro,
    })
  }
}

export function bancoEstaInicializado(conexao: ConexaoSqlite): boolean {
  if (!tabelaAppMetadataExiste(conexao)) {
    return false
  }

  const versao = obterVersaoAtual(conexao)
  return versao > 0
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
