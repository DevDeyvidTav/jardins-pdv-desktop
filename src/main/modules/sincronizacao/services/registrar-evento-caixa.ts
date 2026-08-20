import type { ConexaoSqlite } from '../../../database/conexao-sqlite';
import type { SessaoCaixa } from '@shared/types/sessao-caixa';
import type { MovimentoCaixa } from '@shared/types/movimento-caixa';
import { ENTIDADE_SYNC, type OperacaoSync } from '@shared/types/sincronizacao';
import { serializarSessaoCaixaSync } from './montar-payload-sessao-caixa-sync';
import { serializarMovimentoCaixaSync } from './montar-payload-movimento-caixa-sync';
import { registrarEventoSync } from './registrar-evento-sync';

export function registrarEventoSessaoCaixaSync(
  conexao: ConexaoSqlite,
  sessao: SessaoCaixa,
  operacao: OperacaoSync,
): void {
  registrarEventoSync(conexao, {
    entidade: ENTIDADE_SYNC.SESSAO_CAIXA,
    entidadeId: sessao.id,
    operacao,
    payload: serializarSessaoCaixaSync(sessao),
  });
}

export function registrarEventoMovimentoCaixaSync(
  conexao: ConexaoSqlite,
  movimento: MovimentoCaixa,
  operacao: OperacaoSync,
): void {
  registrarEventoSync(conexao, {
    entidade: ENTIDADE_SYNC.MOVIMENTO_CAIXA,
    entidadeId: movimento.id,
    operacao,
    payload: serializarMovimentoCaixaSync(movimento),
  });
}
