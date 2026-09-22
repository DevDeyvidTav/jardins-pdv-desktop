import { randomUUID } from 'node:crypto'
import type { ConexaoSqlite } from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import { ENTIDADE_SYNC, OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { ORIGEM_AUDITORIA } from '@shared/types/auditoria'
import { obterSessaoOperador } from '../../configuracoes/services/contexto-sessao-operador'
import { registrarEventoSync } from './registrar-evento-sync'

export function registrarAcaoAuditoria(
  entrada: {
    acao: string
    resumo: string
    entidade?: string
    entidadeId?: string
    detalhes?: Record<string, unknown>
    ator?: { operadorId: string; operadorNome: string; perfil?: string }
  },
  conexao: ConexaoSqlite = obterConexaoBancoLocal(),
  opcoes: { forcar?: boolean } = {},
): void {
  if (process.env.NODE_ENV === 'test' && !opcoes.forcar) {
    return
  }

  const ator = entrada.ator ?? obterSessaoOperador()
  const agora = agoraEmIsoUtc()
  const id = randomUUID()
  const payload = {
    id,
    origem: ORIGEM_AUDITORIA.PDV,
    acao: entrada.acao,
    atorTipo: 'OPERADOR',
    atorId: ator?.operadorId ?? null,
    atorNome: ator?.operadorNome ?? 'Operador',
    perfil: ator?.perfil ?? null,
    entidade: entrada.entidade ?? null,
    entidadeId: entrada.entidadeId ?? null,
    resumo: entrada.resumo,
    detalhes: entrada.detalhes ?? null,
    criadoEm: agora,
  }

  conexao.instancia.run(
    `INSERT INTO auditoria_evento (
      id, origem, acao, ator_tipo, ator_id, ator_nome, perfil,
      entidade, entidade_id, resumo, detalhes_json, criado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      payload.origem,
      payload.acao,
      payload.atorTipo,
      payload.atorId,
      payload.atorNome,
      payload.perfil,
      payload.entidade,
      payload.entidadeId,
      payload.resumo,
      payload.detalhes ? JSON.stringify(payload.detalhes) : null,
      agora,
    ],
  )

  registrarEventoSync(conexao, {
    entidade: ENTIDADE_SYNC.AUDITORIA,
    entidadeId: id,
    operacao: OPERACAO_SYNC.CREATE,
    payload,
  })
}
