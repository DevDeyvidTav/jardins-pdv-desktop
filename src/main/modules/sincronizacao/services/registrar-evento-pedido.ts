import type { ConexaoSqlite } from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import { ENTIDADE_SYNC, type OperacaoSync } from '@shared/types/sincronizacao'
import { criarSyncOutboxRepository } from '../repositories/sync-outbox.repository'
import { montarPayloadPedidoSync } from './montar-payload-pedido-sync'

export function registrarEventoPedidoSync(
  pedidoId: string,
  operacao: OperacaoSync,
  conexao: ConexaoSqlite = obterConexaoBancoLocal(),
): void {
  const payload = montarPayloadPedidoSync(pedidoId, conexao)
  criarSyncOutboxRepository().inserirNaConexao(conexao, {
    entidade: ENTIDADE_SYNC.PEDIDO,
    entidadeId: pedidoId,
    operacao,
    payload,
  })
}
