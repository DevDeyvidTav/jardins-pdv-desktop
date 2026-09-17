import type { AtualizarDadosEntregaEntrada, PedidoEntrega } from '@shared/types/pedido'
import { STATUS_PEDIDO } from '@shared/types/pedido'
import { ErroDelivery, CODIGOS_ERRO_DELIVERY } from '../errors/erros-delivery'
import {
  criarPedidoEntregaRepository,
  type PedidoEntregaRepository,
} from '../repositories/pedido-entrega.repository'
import {
  criarPedidoRepository,
  type PedidoRepository,
} from '../../pedidos/repositories/pedido.repository'
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { registrarEventoPedidoSync } from '../../sincronizacao/services/registrar-evento-pedido'

export function criarAtualizarDadosEntrega(
  repositorioEntrega: PedidoEntregaRepository = criarPedidoEntregaRepository(),
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
) {
  return function atualizarDadosEntrega(
    entrada: AtualizarDadosEntregaEntrada,
  ): PedidoEntrega {
    const pedido = repositorioPedido.buscarPorId(entrada.pedidoId)
    if (!pedido) {
      throw new ErroDelivery(
        CODIGOS_ERRO_DELIVERY.PEDIDO_NAO_ENCONTRADO,
        'Pedido nao encontrado.',
      )
    }
    if (pedido.status !== STATUS_PEDIDO.ABERTO) {
      throw new ErroDelivery(
        CODIGOS_ERRO_DELIVERY.PEDIDO_NAO_ABERTO,
        'Pedido nao esta aberto para alteracao.',
      )
    }

    const entrega = repositorioEntrega.buscarPorPedidoId(entrada.pedidoId)
    if (!entrega) {
      throw new ErroDelivery(
        CODIGOS_ERRO_DELIVERY.ENTREGA_NAO_ENCONTRADA,
        'Entrega nao encontrada para este pedido.',
      )
    }

    const entregaAtualizada = repositorioEntrega.atualizarDados(entrada.pedidoId, {
      clienteNome: entrada.clienteNome,
      telefone: entrada.telefone,
      endereco: entrada.endereco,
      observacao: entrada.observacao,
    })
    registrarEventoPedidoSync(entrada.pedidoId, OPERACAO_SYNC.UPDATE)
    return entregaAtualizada
  }
}

export const atualizarDadosEntrega = criarAtualizarDadosEntrega()
