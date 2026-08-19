import type { CancelarPedidoEntrada, Pedido } from '@shared/types/pedido'
import { STATUS_PEDIDO, TIPO_PEDIDO } from '@shared/types/pedido'
import {
  MOTIVO_ENCERRAMENTO_AGRUPAMENTO,
  STATUS_MESA,
  TIPO_MOVIMENTACAO_MESA,
} from '@shared/types/mesa'
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
  inserirMovimentacaoNaConexao,
  snapshotMesa,
} from '../../mesas/services/mesa-movimentacao.sql'
import { CODIGOS_ERRO_PEDIDOS, ErroPedidos } from '../errors/erros-pedidos'
import type { PedidoRepository } from '../repositories/pedido.repository'
import { criarPedidoRepository } from '../repositories/pedido.repository'
import type { PedidoItemRepository } from '../repositories/pedido-item.repository'
import { criarPedidoItemRepository } from '../repositories/pedido-item.repository'
import { criarPedidoEntregaRepository } from '../../delivery/repositories/pedido-entrega.repository'
import {
  criarPedidoDivisaoContaRepository,
  criarPedidoDivisaoMovimentacaoRepository,
} from '../../divisao-conta/repositories/divisao-conta.repository'
import {
  STATUS_DIVISAO_CONTA,
  TIPO_MOVIMENTACAO_DIVISAO,
} from '@shared/types/divisao-conta'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { registrarEventoPedidoSync } from '../../sincronizacao/services/registrar-evento-pedido'

export function criarCancelarPedido(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioMesa: MesaRepository = criarMesaRepository(),
  repositorioItem: PedidoItemRepository = criarPedidoItemRepository(),
  obterConexao = obterConexaoBancoLocal,
) {
  return function cancelarPedido(entrada: CancelarPedidoEntrada): Pedido {
    const conexao = obterConexao()
    const pedidoCancelado = executarEmTransacaoImediata(conexao, () => {
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
          'Pedido nao esta aberto para cancelamento.',
        )
      }

      const mesaAntes =
        pedido.tipo === TIPO_PEDIDO.MESA && pedido.mesaId
          ? repositorioMesa.buscarPorId(pedido.mesaId)
          : null

      const repositorioDivisao = criarPedidoDivisaoContaRepository()
      const repositorioMovimentacaoDivisao = criarPedidoDivisaoMovimentacaoRepository()
      const divisaoAtiva = repositorioDivisao.buscarAtivaPorPedido(pedido.id)
      if (divisaoAtiva) {
        const agora = agoraEmIsoUtc()
        repositorioDivisao.atualizarStatus(divisaoAtiva.id, STATUS_DIVISAO_CONTA.CANCELADA, {
          canceladoEm: agora,
          motivoCancelamento: entrada.motivoCancelamento,
        })
        repositorioMovimentacaoDivisao.inserir({
          pedidoId: pedido.id,
          divisaoId: divisaoAtiva.id,
          tipo: TIPO_MOVIMENTACAO_DIVISAO.DIVISAO_CANCELADA,
          dadosAntes: { status: divisaoAtiva.status },
          dadosDepois: { status: STATUS_DIVISAO_CONTA.CANCELADA },
          motivo: entrada.motivoCancelamento,
        })
      }

      repositorioItem.cancelarItensAtivosPorPedido(
        entrada.pedidoId,
        entrada.motivoCancelamento,
      )

      const cancelado = repositorioPedido.cancelar(
        entrada.pedidoId,
        entrada.motivoCancelamento,
      )

      if (pedido.tipo === TIPO_PEDIDO.MESA && pedido.mesaId) {
        const encerrado = encerrarAgrupamentoAtivoNaConexao(conexao, {
          pedidoId: pedido.id,
          motivo: MOTIVO_ENCERRAMENTO_AGRUPAMENTO.PEDIDO_CANCELADO,
          observacao: entrada.motivoCancelamento,
          liberarMesaPrincipal: true,
        })

        if (!encerrado) {
          atualizarStatusMesaNaConexao(conexao, pedido.mesaId, STATUS_MESA.LIVRE)
        }

        inserirMovimentacaoNaConexao(conexao, {
          pedidoId: pedido.id,
          tipo: TIPO_MOVIMENTACAO_MESA.PEDIDO_CANCELADO,
          mesaOrigemId: pedido.mesaId,
          mesaAgrupamentoId: pedido.mesaAgrupamentoId,
          dadosAntes: {
            pedidoId: pedido.id,
            status: pedido.status,
            mesa: mesaAntes ? snapshotMesa(mesaAntes) : null,
          },
          dadosDepois: {
            pedidoId: pedido.id,
            status: STATUS_PEDIDO.CANCELADO,
            motivoCancelamento: entrada.motivoCancelamento,
          },
          motivo: entrada.motivoCancelamento,
        })
      }

      if (pedido.tipo === TIPO_PEDIDO.DELIVERY) {
        const repositorioEntrega = criarPedidoEntregaRepository()
        const entrega = repositorioEntrega.buscarPorPedidoId(entrada.pedidoId)
        if (entrega && entrega.status !== 'CANCELADA') {
          repositorioEntrega.atualizarStatus(
            entrada.pedidoId,
            'CANCELADA',
            entrada.motivoCancelamento,
          )
        }
      }

      registrarEventoPedidoSync(entrada.pedidoId, OPERACAO_SYNC.CANCEL, conexao)
      return cancelado
    })

    persistirConexaoBanco(conexao)
    return pedidoCancelado
  }
}

export const cancelarPedido = criarCancelarPedido()
