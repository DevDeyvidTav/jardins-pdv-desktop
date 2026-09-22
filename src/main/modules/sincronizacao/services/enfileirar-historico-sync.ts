import type { ConexaoSqlite } from '../../../database/conexao-sqlite'
import {
  consultarValorMetadata,
  definirValorMetadata,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { criarSessaoCaixaRepository } from '../../caixa/repositories/sessao-caixa.repository'
import { criarMovimentoCaixaRepository } from '../../caixa/repositories/movimento-caixa.repository'
import { criarPedidoRepository } from '../../pedidos/repositories/pedido.repository'
import { criarTalaoRepository } from '../../clientes/repositories/talao.repository'
import { registrarEventoPedidoSync } from './registrar-evento-pedido'
import {
  registrarEventoMovimentoCaixaSync,
  registrarEventoSessaoCaixaSync,
} from './registrar-evento-caixa'
import { registrarTalaoBaixaSync } from './registrar-cadastro-sync'
import { registrarInfo } from '../../../logging/logger'

const CHAVE_HISTORICO = 'sync_historico_enfileirado'

export function enfileirarHistoricoInicial(
  conexao: ConexaoSqlite = obterConexaoBancoLocal(),
  opcoes: { forcar?: boolean } = {},
): void {
  if (!opcoes.forcar && consultarValorMetadata(conexao, CHAVE_HISTORICO)) {
    return
  }

  const sessoes = criarSessaoCaixaRepository(conexao).listarTodas()
  for (const sessao of sessoes) {
    registrarEventoSessaoCaixaSync(conexao, sessao, OPERACAO_SYNC.UPDATE)
  }

  const movimentos = criarMovimentoCaixaRepository(conexao).listarTodos()
  for (const movimento of movimentos) {
    registrarEventoMovimentoCaixaSync(conexao, movimento, OPERACAO_SYNC.CREATE)
  }

  const pedidoIds = criarPedidoRepository(conexao).listarIds()
  for (const pedidoId of pedidoIds) {
    registrarEventoPedidoSync(pedidoId, OPERACAO_SYNC.UPDATE, conexao)
  }

  const baixas = criarTalaoRepository(conexao).listarTodasBaixas()
  for (const baixa of baixas) {
    registrarTalaoBaixaSync(baixa, conexao)
  }

  definirValorMetadata(conexao, CHAVE_HISTORICO, agoraEmIsoUtc())
  registrarInfo('Historico local enfileirado para sync', {
    operacao: 'sync.backfill',
    sessoes: sessoes.length,
    movimentos: movimentos.length,
    pedidos: pedidoIds.length,
    talaoBaixas: baixas.length,
  })
}
