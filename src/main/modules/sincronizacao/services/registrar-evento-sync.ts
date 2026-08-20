import type { ConexaoSqlite } from '../../../database/conexao-sqlite';
import type { EntidadeSync, OperacaoSync } from '@shared/types/sincronizacao';
import { criarSyncOutboxRepository } from '../repositories/sync-outbox.repository';

export function registrarEventoSync(
  conexao: ConexaoSqlite,
  entrada: {
    entidade: EntidadeSync;
    entidadeId: string;
    operacao: OperacaoSync;
    payload: Record<string, unknown>;
  },
): void {
  criarSyncOutboxRepository().inserirNaConexao(conexao, entrada);
}
