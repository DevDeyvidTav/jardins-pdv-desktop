import type { ConexaoSqlite } from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import { ENTIDADE_SYNC, type OperacaoSync } from '@shared/types/sincronizacao'
import { montarPayloadPedidoSync } from './montar-payload-pedido-sync'
import { registrarEventoSync } from './registrar-evento-sync'

export function registrarEventoPedidoSync(
  pedidoId: string,
  operacao: OperacaoSync,
  conexao: ConexaoSqlite = obterConexaoBancoLocal(),
): void {
  const payload = montarPayloadPedidoSync(pedidoId, conexao)
  registrarEventoSync(conexao, {
    entidade: ENTIDADE_SYNC.PEDIDO,
    entidadeId: pedidoId,
    operacao,
    payload,
  })
}
