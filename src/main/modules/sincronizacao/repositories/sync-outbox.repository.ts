import { randomUUID } from 'node:crypto'
import type { ConexaoSqlite } from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import {
  STATUS_SYNC_OUTBOX,
  type EntidadeSync,
  type OperacaoSync,
  type StatusSyncOutbox,
} from '@shared/types/sincronizacao'

export interface EventoSyncOutbox {
  id: string
  entidade: EntidadeSync
  entidadeId: string
  operacao: OperacaoSync
  payload: Record<string, unknown>
  status: StatusSyncOutbox
  tentativas: number
  proximaTentativaEm: string | null
  ultimoErro: string | null
  criadoEm: string
  sincronizadoEm: string | null
}

interface LinhaSyncOutboxSql {
  id: string
  entidade: string
  entidade_id: string
  operacao: string
  payload: string
  status: string
  tentativas: number
  proxima_tentativa_em: string | null
  ultimo_erro: string | null
  criado_em: string
  sincronizado_em: string | null
}

function mapearLinha(linha: LinhaSyncOutboxSql): EventoSyncOutbox {
  return {
    id: linha.id,
    entidade: linha.entidade as EntidadeSync,
    entidadeId: linha.entidade_id,
    operacao: linha.operacao as OperacaoSync,
    payload: JSON.parse(linha.payload) as Record<string, unknown>,
    status: linha.status as StatusSyncOutbox,
    tentativas: Number(linha.tentativas) || 0,
    proximaTentativaEm: linha.proxima_tentativa_em,
    ultimoErro: linha.ultimo_erro,
    criadoEm: linha.criado_em,
    sincronizadoEm: linha.sincronizado_em,
  }
}

export class SyncOutboxRepository {
  constructor(private readonly obterConexao = obterConexaoBancoLocal) {}

  inserirNaConexao(
    conexao: ConexaoSqlite,
    entrada: {
      entidade: EntidadeSync
      entidadeId: string
      operacao: OperacaoSync
      payload: Record<string, unknown>
    },
  ): EventoSyncOutbox {
    const agora = agoraEmIsoUtc()
    const evento: EventoSyncOutbox = {
      id: randomUUID(),
      entidade: entrada.entidade,
      entidadeId: entrada.entidadeId,
      operacao: entrada.operacao,
      payload: entrada.payload,
      status: STATUS_SYNC_OUTBOX.PENDENTE,
      tentativas: 0,
      proximaTentativaEm: null,
      ultimoErro: null,
      criadoEm: agora,
      sincronizadoEm: null,
    }

    conexao.instancia.run(
      `INSERT INTO sync_outbox (
        id, entidade, entidade_id, operacao, payload, status,
        tentativas, proxima_tentativa_em, ultimo_erro, criado_em, sincronizado_em
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        evento.id,
        evento.entidade,
        evento.entidadeId,
        evento.operacao,
        JSON.stringify(evento.payload),
        evento.status,
        evento.tentativas,
        evento.proximaTentativaEm,
        evento.ultimoErro,
        evento.criadoEm,
        evento.sincronizadoEm,
      ],
    )

    return evento
  }

  listarPendentes(limite: number): EventoSyncOutbox[] {
    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()
    const consulta = conexao.instancia.prepare(
      `SELECT id, entidade, entidade_id, operacao, payload, status,
              tentativas, proxima_tentativa_em, ultimo_erro, criado_em, sincronizado_em
       FROM sync_outbox
       WHERE status = ?
         AND (proxima_tentativa_em IS NULL OR proxima_tentativa_em <= ?)
       ORDER BY criado_em ASC
       LIMIT ?`,
    )
    consulta.bind([STATUS_SYNC_OUTBOX.PENDENTE, agora, limite])

    const eventos: EventoSyncOutbox[] = []
    while (consulta.step()) {
      eventos.push(
        mapearLinha(consulta.getAsObject() as unknown as LinhaSyncOutboxSql),
      )
    }
    consulta.free()
    return eventos
  }

  marcarSincronizados(eventoIds: string[]): void {
    if (eventoIds.length === 0) {
      return
    }

    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()
    const placeholders = eventoIds.map(() => '?').join(', ')

    conexao.instancia.run(
      `UPDATE sync_outbox
       SET status = ?, sincronizado_em = ?, ultimo_erro = NULL
       WHERE id IN (${placeholders})`,
      [STATUS_SYNC_OUTBOX.SINCRONIZADO, agora, ...eventoIds],
    )
  }

  registrarFalha(eventoId: string, erro: string, proximaTentativaEm: string): void {
    const conexao = this.obterConexao()
    conexao.instancia.run(
      `UPDATE sync_outbox
       SET tentativas = tentativas + 1,
           ultimo_erro = ?,
           proxima_tentativa_em = ?
       WHERE id = ?`,
      [erro.slice(0, 500), proximaTentativaEm, eventoId],
    )
  }

  contarPorStatus(status: StatusSyncOutbox): number {
    const conexao = this.obterConexao()
    const consulta = conexao.instancia.prepare(
      `SELECT COUNT(*) AS total FROM sync_outbox WHERE status = ?`,
    )
    consulta.bind([status])
    consulta.step()
    const linha = consulta.getAsObject() as { total: number }
    consulta.free()
    return Number(linha.total) || 0
  }
}

export function criarSyncOutboxRepository(): SyncOutboxRepository {
  return new SyncOutboxRepository()
}
