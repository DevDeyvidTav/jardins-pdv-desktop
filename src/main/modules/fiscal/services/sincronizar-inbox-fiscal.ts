import {
  consultarValorMetadata,
  definirValorMetadata,
  type ConexaoSqlite,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import { obterConfiguracaoSincronizacao } from '../../../config/sincronizacao'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import { registrarErro, registrarInfo } from '../../../logging/logger'
import { criarDocumentoFiscalRepository } from '../repositories/documento-fiscal.repository'
import { buscarInboxFiscalApi } from './cliente-fiscal-api'
import { CHAVE_EMITENTE_FISCAL } from './obter-emitente-danfe'
import { imprimirDanfeNfce } from '../use-cases/imprimir-danfe-nfce'

const CHAVE_CURSOR = 'fiscal_inbox_atualizado_desde'

/**
 * Guarda-chuva contra tempestade de reimpressao: cada tentativa que trava o
 * USB pode deixar restos no driver; sem limite, a porta COM entra em colapso.
 * Apos 3 falhas, so reimpressao manual (badge/modal) tenta de novo.
 */
const CHAVE_FALHAS_IMPRESSAO = 'fiscal_impressao_danfe_falhas'
const MAX_TENTATIVAS_IMPRESSAO_AUTO = 3

/**
 * Cooldown global: depois de qualquer falha de impressao, segura TODAS as
 * impressoes automaticas por 90s. Evita tempestade quando varias notas
 * autorizam em sequencia com a impressora travada. Reimpressao manual
 * (badge/modal) nao passa por aqui.
 */
const CHAVE_COOLDOWN_IMPRESSAO = 'fiscal_impressao_danfe_cooldown_ate'
const COOLDOWN_IMPRESSAO_MS = 90_000

function impressaoAutoEmCooldown(conexao: ConexaoSqlite): boolean {
  const bruto = consultarValorMetadata(conexao, CHAVE_COOLDOWN_IMPRESSAO)
  if (!bruto) return false
  const ate = new Date(bruto).getTime()
  return !Number.isNaN(ate) && Date.now() < ate
}

function registrarCooldownImpressao(conexao: ConexaoSqlite): void {
  definirValorMetadata(
    conexao,
    CHAVE_COOLDOWN_IMPRESSAO,
    new Date(Date.now() + COOLDOWN_IMPRESSAO_MS).toISOString(),
  )
}

interface FalhaImpressao {
  tentativas: number
  ultimaEm: string
}

type FalhasImpressao = Record<string, FalhaImpressao>

function lerFalhasImpressao(conexao: ConexaoSqlite): FalhasImpressao {
  try {
    const bruto = consultarValorMetadata(conexao, CHAVE_FALHAS_IMPRESSAO)
    if (!bruto) return {}
    const lido = JSON.parse(bruto) as FalhasImpressao
    return lido && typeof lido === 'object' ? lido : {}
  } catch {
    return {}
  }
}

function gravarFalhasImpressao(conexao: ConexaoSqlite, falhas: FalhasImpressao): void {
  definirValorMetadata(conexao, CHAVE_FALHAS_IMPRESSAO, JSON.stringify(falhas))
}

function deveTentarImpressaoAuto(falhas: FalhasImpressao, pedidoId: string): boolean {
  const falha = falhas[pedidoId]
  if (!falha) return true
  if (falha.tentativas >= MAX_TENTATIVAS_IMPRESSAO_AUTO) return false
  const backoffMs = 30_000 * 2 ** (falha.tentativas - 1)
  const ultima = new Date(falha.ultimaEm).getTime()
  if (Number.isNaN(ultima)) return true
  return Date.now() - ultima >= backoffMs
}

export async function sincronizarInboxFiscal(): Promise<void> {
  const config = obterConfiguracaoSincronizacao()
  const conexao = obterConexaoBancoLocal()
  const cursor = consultarValorMetadata(conexao, CHAVE_CURSOR)
  const repositorio = criarDocumentoFiscalRepository()

  try {
    const inbox = await buscarInboxFiscalApi(config, cursor)
    if (inbox.emitente) {
      definirValorMetadata(conexao, CHAVE_EMITENTE_FISCAL, JSON.stringify(inbox.emitente))
    }

    let maisRecente = cursor

    for (const documento of inbox.documentos) {
      const { novoAutorizado } = repositorio.upsertDaInbox(documento)
      if (!maisRecente || documento.atualizadoEm > maisRecente) {
        maisRecente = documento.atualizadoEm
      }

      if (novoAutorizado) {
        if (impressaoAutoEmCooldown(conexao)) {
          registrarInfo('Impressao automatica do DANFE em cooldown apos falha recente', {
            operacao: 'fiscal.imprimir',
            pedidoId: documento.pedidoId,
          })
          continue
        }

        const falhas = lerFalhasImpressao(conexao)
        if (!deveTentarImpressaoAuto(falhas, documento.pedidoId)) {
          registrarInfo('Reimpressao automatica do DANFE adiada por falhas recentes', {
            operacao: 'fiscal.imprimir',
            pedidoId: documento.pedidoId,
          })
          continue
        }

        try {
          await imprimirDanfeNfce(documento.pedidoId)
          if (falhas[documento.pedidoId]) {
            delete falhas[documento.pedidoId]
            gravarFalhasImpressao(conexao, falhas)
          }
          registrarInfo('DANFE NFC-e impresso automaticamente', {
            operacao: 'fiscal.imprimir',
            pedidoId: documento.pedidoId,
          })
        } catch (erro) {
          const anterior = falhas[documento.pedidoId]
          falhas[documento.pedidoId] = {
            tentativas: (anterior?.tentativas ?? 0) + 1,
            ultimaEm: agoraEmIsoUtc(),
          }
          gravarFalhasImpressao(conexao, falhas)
          registrarCooldownImpressao(conexao)
          registrarErro(
            'Falha ao imprimir DANFE NFC-e automaticamente',
            { operacao: 'fiscal.imprimir', pedidoId: documento.pedidoId },
            erro,
          )
        }
      }
    }

    definirValorMetadata(conexao, CHAVE_CURSOR, maisRecente ?? agoraEmIsoUtc())
  } catch (erro) {
    registrarErro('Falha ao puxar inbox fiscal', { operacao: 'fiscal.inbox' }, erro)
  }
}
