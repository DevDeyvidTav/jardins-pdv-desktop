import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'
import { ErroInicializacaoAplicacao } from '@shared/errors/erros-aplicacao'
import {
  abrirConexaoSqlite,
  bancoEstaInicializado,
  executarMigracoes,
  fecharConexaoSqlite,
  reiniciarControleTransacao,
  type ConexaoSqlite,
} from './conexao-sqlite'

let conexaoAtual: ConexaoSqlite | null = null

export function obterCaminhoBancoLocal(): string {
  const diretorioDados = app.getPath('userData')
  mkdirSync(diretorioDados, { recursive: true })
  return join(diretorioDados, 'pdv-local.sqlite')
}

export function obterConexaoBancoLocal(): ConexaoSqlite {
  if (!conexaoAtual) {
    throw new ErroInicializacaoAplicacao(
      'Banco local ainda nao foi inicializado.',
    )
  }

  return conexaoAtual
}

export async function inicializarBancoLocal(
  caminhoArquivo?: string,
): Promise<ConexaoSqlite> {
  if (conexaoAtual) {
    return conexaoAtual
  }

  const caminho = caminhoArquivo ?? obterCaminhoBancoLocal()

  try {
    conexaoAtual = await abrirConexaoSqlite(caminho)
    executarMigracoes(conexaoAtual)
    return conexaoAtual
  } catch (erro) {
    conexaoAtual = null
    throw erro
  }
}

export function bancoLocalEstaPronto(): boolean {
  if (!conexaoAtual) {
    return false
  }

  return bancoEstaInicializado(conexaoAtual)
}

export function encerrarBancoLocal(): void {
  if (!conexaoAtual) {
    reiniciarControleTransacao()
    return
  }

  fecharConexaoSqlite(conexaoAtual)
  conexaoAtual = null
  reiniciarControleTransacao()
}

export async function reiniciarBancoLocalParaTestes(
  caminhoArquivo: string,
): Promise<ConexaoSqlite> {
  encerrarBancoLocal()
  return inicializarBancoLocal(caminhoArquivo)
}
