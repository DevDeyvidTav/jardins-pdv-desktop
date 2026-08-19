import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'
import { ErroInicializacaoAplicacao } from '@shared/errors/erros-aplicacao'
import {
  abrirConexaoSqlite,
  bancoEstaInicializado,
  executarMigracoes,
  fecharConexaoSqlite,
  prepararBootBanco,
  reiniciarControleTransacao,
  type ConexaoSqlite,
  ErroIntegridadeBanco,
} from './conexao-sqlite'
import { rotacionarLogsAntigos, registrarErro, registrarInfo } from '../logging/logger'
import { obterBackupMaisRecente } from './backup-banco'

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
    rotacionarLogsAntigos()
    conexaoAtual = await abrirConexaoSqlite(caminho)
    executarMigracoes(conexaoAtual)
    prepararBootBanco(conexaoAtual)
    registrarInfo('Banco local inicializado', {
      operacao: 'banco.inicializar',
      caminho,
    })
    return conexaoAtual
  } catch (erro) {
    conexaoAtual = null
    if (erro instanceof ErroIntegridadeBanco) {
      registrarErro(
        'Integridade do banco falhou na inicializacao',
        {
          operacao: 'banco.integridade',
          backupMaisRecente: erro.backupMaisRecente ?? obterBackupMaisRecente(),
        },
        erro,
      )
    } else {
      registrarErro('Falha ao inicializar banco local', { operacao: 'banco.inicializar' }, erro)
    }
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
