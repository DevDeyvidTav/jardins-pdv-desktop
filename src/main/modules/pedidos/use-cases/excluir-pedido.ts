import type { ExcluirPedidoEntrada } from '@shared/types/pedido'
import { STATUS_PEDIDO, TIPO_PEDIDO } from '@shared/types/pedido'
import {
  MOTIVO_ENCERRAMENTO_AGRUPAMENTO,
  STATUS_MESA,
} from '@shared/types/mesa'
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import {
  executarEmTransacaoImediata,
  persistirConexaoBanco,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import type { MesaRepository } from '../../mesas/repositories/mesa.repository'
import { criarMesaRepository } from '../../mesas/repositories/mesa.repository'
import {
  atualizarStatusMesaNaConexao,
  encerrarAgrupamentoAtivoNaConexao,
} from '../../mesas/services/mesa-movimentacao.sql'
import { CODIGOS_ERRO_PEDIDOS, ErroPedidos } from '../errors/erros-pedidos'
import type { PedidoRepository } from '../repositories/pedido.repository'
import { criarPedidoRepository } from '../repositories/pedido.repository'
import { registrarEventoPedidoSync } from '../../sincronizacao/services/registrar-evento-pedido'
import { registrarAcaoAuditoria } from '../../sincronizacao/services/registrar-acao-auditoria'

export function criarExcluirPedido(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioMesa: MesaRepository = criarMesaRepository(),
  obterConexao = obterConexaoBancoLocal,
) {
  return function excluirPedido(entrada: ExcluirPedidoEntrada): void {
    const conexao = obterConexao()
    executarEmTransacaoImediata(conexao, () => {
      const pedido = repositorioPedido.buscarPorId(entrada.pedidoId)

      if (!pedido) {
        throw new ErroPedidos(
          CODIGOS_ERRO_PEDIDOS.PEDIDO_NAO_ENCONTRADO,
          'Pedido nao encontrado.',
        )
      }

      if (pedido.status !== STATUS_PEDIDO.ABERTO) {
        throw new ErroPedidos(
          CODIGOS_ERRO_PEDIDOS.PEDIDO_NAO_ABERTO,
          'Somente pedido aberto pode ser excluido.',
        )
      }

      if (pedido.valorPagoCentavos > 0 || pedido.valorCortesiaCentavos > 0) {
        throw new ErroPedidos(
          CODIGOS_ERRO_PEDIDOS.PEDIDO_POSSUI_PAGAMENTO,
          'Pedido com pagamento nao pode ser excluido. Use cancelamento.',
        )
      }

      const consultaItens = conexao.instancia.prepare(
        `SELECT COUNT(*) AS total
         FROM pedido_item
         WHERE pedido_id = ? AND cancelado_em IS NULL`,
      )
      consultaItens.bind([entrada.pedidoId])
      consultaItens.step()
      const totalAtivos = Number(
        (consultaItens.getAsObject() as { total: number }).total ?? 0,
      )
      consultaItens.free()

      if (totalAtivos > 0) {
        throw new ErroPedidos(
          CODIGOS_ERRO_PEDIDOS.PEDIDO_POSSUI_ITENS,
          'Pedido com itens nao pode ser excluido. Remova os itens ou cancele o pedido.',
        )
      }

      // Sync e auditoria ANTES do DELETE — o payload ainda precisa do pedido no banco.
      registrarEventoPedidoSync(entrada.pedidoId, OPERACAO_SYNC.CANCEL, conexao)
      registrarAcaoAuditoria(
        {
          acao: 'PEDIDO_EXCLUIR',
          resumo: `Excluiu pedido vazio ${pedido.referencia ?? pedido.id}`,
          entidade: 'PEDIDO',
          entidadeId: pedido.id,
          detalhes: { tipo: pedido.tipo, mesaId: pedido.mesaId },
        },
        conexao,
      )

      if (pedido.mesaId) {
        if (pedido.tipo === TIPO_PEDIDO.MESA) {
          encerrarAgrupamentoAtivoNaConexao(conexao, {
            pedidoId: pedido.id,
            motivo: MOTIVO_ENCERRAMENTO_AGRUPAMENTO.PEDIDO_CANCELADO,
            observacao: 'Pedido vazio excluido',
            liberarMesaPrincipal: true,
          })
        }

        const mesa = repositorioMesa.buscarPorId(pedido.mesaId)
        if (mesa && mesa.status !== STATUS_MESA.LIVRE) {
          atualizarStatusMesaNaConexao(conexao, pedido.mesaId, STATUS_MESA.LIVRE)
        }
      }

      // Cascata manual — FKs do SQLite nao tem ON DELETE CASCADE nestas tabelas.
      conexao.instancia.run(
        `DELETE FROM pizza_pedido_item_sabor
         WHERE pizza_pedido_item_id IN (
           SELECT ppi.id FROM pizza_pedido_item ppi
           INNER JOIN pedido_item pi ON pi.id = ppi.pedido_item_id
           WHERE pi.pedido_id = ?
         )`,
        [entrada.pedidoId],
      )
      conexao.instancia.run(
        `DELETE FROM pizza_pedido_item
         WHERE pedido_item_id IN (SELECT id FROM pedido_item WHERE pedido_id = ?)`,
        [entrada.pedidoId],
      )
      conexao.instancia.run(`DELETE FROM pedido_item WHERE pedido_id = ?`, [
        entrada.pedidoId,
      ])
      conexao.instancia.run(`DELETE FROM pagamento_pedido WHERE pedido_id = ?`, [
        entrada.pedidoId,
      ])
      conexao.instancia.run(
        `DELETE FROM pedido_divisao_movimentacao WHERE pedido_id = ?`,
        [entrada.pedidoId],
      )
      conexao.instancia.run(
        `DELETE FROM pedido_divisao_parte
         WHERE pedido_divisao_conta_id IN (
           SELECT id FROM pedido_divisao_conta WHERE pedido_id = ?
         )`,
        [entrada.pedidoId],
      )
      conexao.instancia.run(`DELETE FROM pedido_divisao_conta WHERE pedido_id = ?`, [
        entrada.pedidoId,
      ])
      conexao.instancia.run(
        `DELETE FROM pedido_mesa_movimentacao WHERE pedido_id = ?`,
        [entrada.pedidoId],
      )
      conexao.instancia.run(
        `DELETE FROM mesa_agrupada
         WHERE mesa_agrupamento_id IN (
           SELECT id FROM mesa_agrupamento WHERE pedido_id = ?
         )`,
        [entrada.pedidoId],
      )
      conexao.instancia.run(`DELETE FROM mesa_agrupamento WHERE pedido_id = ?`, [
        entrada.pedidoId,
      ])
      conexao.instancia.run(`DELETE FROM pedido_entrega WHERE pedido_id = ?`, [
        entrada.pedidoId,
      ])
      conexao.instancia.run(`DELETE FROM documento_fiscal WHERE pedido_id = ?`, [
        entrada.pedidoId,
      ])
      conexao.instancia.run(`DELETE FROM pedido WHERE id = ?`, [entrada.pedidoId])
    })

    persistirConexaoBanco(conexao)
  }
}

export const excluirPedido = criarExcluirPedido()
