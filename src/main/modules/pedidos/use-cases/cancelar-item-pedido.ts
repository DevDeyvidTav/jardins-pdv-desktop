import {
  itemPedidoEnviadoCozinha,
  type CancelarItemPedidoEntrada,
  type ResumoPedido,
} from '@shared/types/pedido'
import { TIPO_PEDIDO_ITEM } from '@shared/types/pizza'
import {
  criarPizzaPedidoItemRepository,
  type PizzaPedidoItemRepository,
} from '../../pizzas/repositories/pizza-pedido-item.repository'
import { CODIGOS_ERRO_PEDIDOS, ErroPedidos } from '../errors/erros-pedidos'
import type { PedidoRepository } from '../repositories/pedido.repository'
import { criarPedidoRepository } from '../repositories/pedido.repository'
import type { PedidoItemRepository } from '../repositories/pedido-item.repository'
import { criarPedidoItemRepository } from '../repositories/pedido-item.repository'
import { garantirPedidoSemDivisaoAtiva } from '../../divisao-conta/services/resumo-divisao-conta'
import {
  criarPedidoDivisaoContaRepository,
  type PedidoDivisaoContaRepository,
} from '../../divisao-conta/repositories/divisao-conta.repository'
import { recalcularTotaisPedido } from '../services/recalcular-totais-pedido'
import { garantirPedidoAberto, obterResumoPedido } from './consultas-pedido'
import {
  CODIGOS_ERRO_PIZZAS,
  ErroPizzas,
} from '../../pizzas/errors/erros-pizzas'
import { executarEmTransacaoImediata } from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { registrarEventoPedidoSync } from '../../sincronizacao/services/registrar-evento-pedido'
import { registrarAcaoAuditoria } from '../../sincronizacao/services/registrar-acao-auditoria'

export function criarCancelarItemPedido(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioItem: PedidoItemRepository = criarPedidoItemRepository(),
  repositorioDivisao: PedidoDivisaoContaRepository = criarPedidoDivisaoContaRepository(),
  obterConexao = obterConexaoBancoLocal,
  repositorioPizza: PizzaPedidoItemRepository = criarPizzaPedidoItemRepository(),
) {
  return function cancelarItemPedido(entrada: CancelarItemPedidoEntrada): ResumoPedido {
    const conexao = obterConexao()
    return executarEmTransacaoImediata(conexao, () => {
      const pedido = repositorioPedido.buscarPorId(entrada.pedidoId)

      if (!pedido) {
        throw new ErroPedidos(
          CODIGOS_ERRO_PEDIDOS.PEDIDO_NAO_ENCONTRADO,
          'Pedido nao encontrado.',
        )
      }

      garantirPedidoAberto(pedido)

      const item = repositorioItem.buscarPorId(entrada.itemId)

      if (!item || item.pedidoId !== entrada.pedidoId || item.canceladoEm) {
        throw new ErroPedidos(
          CODIGOS_ERRO_PEDIDOS.ITEM_NAO_ENCONTRADO,
          'Item nao encontrado ou ja cancelado.',
        )
      }

      if (item.tipo === TIPO_PEDIDO_ITEM.PIZZA) {
        if (repositorioDivisao.buscarAtivaPorPedido(pedido.id)) {
          throw new ErroPizzas(
            CODIGOS_ERRO_PIZZAS.ALTERACAO_PIZZA_BLOQUEADA_POR_DIVISAO_ATIVA,
            'Nao e permitido remover pizza com divisao de conta ativa.',
          )
        }
      } else {
        garantirPedidoSemDivisaoAtiva(pedido.id)
      }

      const enviadoCozinha = itemPedidoEnviadoCozinha(item)
      if (!enviadoCozinha) {
        if (item.tipo === TIPO_PEDIDO_ITEM.PIZZA) {
          repositorioPizza.excluirPorPedidoItemId(entrada.itemId)
        }
        repositorioItem.excluir(entrada.itemId)
      } else {
        const motivo = entrada.motivoCancelamento?.trim() ?? ''
        if (!motivo) {
          throw new ErroPedidos(
            CODIGOS_ERRO_PEDIDOS.ENTRADA_INVALIDA,
            'Motivo do cancelamento e obrigatorio para item ja enviado a cozinha.',
          )
        }
        repositorioItem.cancelar(entrada.itemId, motivo)
      }

      recalcularTotaisPedido(entrada.pedidoId, repositorioPedido, repositorioItem)

      registrarEventoPedidoSync(entrada.pedidoId, OPERACAO_SYNC.UPDATE, conexao)
      registrarAcaoAuditoria(
        {
          acao: enviadoCozinha ? 'ITEM_CANCELAR' : 'ITEM_EXCLUIR',
          resumo: enviadoCozinha ? 'Cancelou item enviado a cozinha' : 'Removeu item do pedido',
          entidade: 'PEDIDO_ITEM',
          entidadeId: entrada.itemId,
          detalhes: {
            pedidoId: entrada.pedidoId,
            motivo: entrada.motivoCancelamento ?? null,
          },
        },
        conexao,
      )
      return obterResumoPedido({ pedidoId: entrada.pedidoId })
    })
  }
}

export const cancelarItemPedido = criarCancelarItemPedido()

/** Alias mantido para compatibilidade com IPC e UI existentes. */
export const removerItemPedido = cancelarItemPedido
export const criarRemoverItemPedido = criarCancelarItemPedido
