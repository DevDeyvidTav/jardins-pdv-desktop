import type { CancelarPedidoEntrada, Pedido } from '@shared/types/pedido'
import { STATUS_PEDIDO, TIPO_PEDIDO } from '@shared/types/pedido'
import {
  MOTIVO_ENCERRAMENTO_AGRUPAMENTO,
  STATUS_MESA,
  TIPO_MOVIMENTACAO_MESA,
} from '@shared/types/mesa'
import {
  confirmarTransacao,
  iniciarTransacaoImediata,
  persistirConexaoBanco,
  reverterTransacao,
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

export function criarCancelarPedido(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioMesa: MesaRepository = criarMesaRepository(),
  repositorioItem: PedidoItemRepository = criarPedidoItemRepository(),
  obterConexao = obterConexaoBancoLocal,
) {
  return function cancelarPedido(entrada: CancelarPedidoEntrada): Pedido {
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

    const conexao = obterConexao()
    const mesaAntes =
      pedido.tipo === TIPO_PEDIDO.MESA && pedido.mesaId
        ? repositorioMesa.buscarPorId(pedido.mesaId)
        : null

    iniciarTransacaoImediata(conexao)
    try {
      repositorioItem.cancelarItensAtivosPorPedido(
        entrada.pedidoId,
        entrada.motivoCancelamento,
      )

      const pedidoCancelado = repositorioPedido.cancelar(
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

      confirmarTransacao(conexao)
      persistirConexaoBanco(conexao)
      return pedidoCancelado
    } catch (erro) {
      reverterTransacao(conexao)
      throw erro
    }
  }
}

export const cancelarPedido = criarCancelarPedido()
