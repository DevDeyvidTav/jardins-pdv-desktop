import type { DefinirObservacaoItemPedidoEntrada, ResumoPedido } from '@shared/types/pedido'
import { TIPO_PEDIDO_ITEM } from '@shared/types/pizza'
import { CODIGOS_ERRO_PEDIDOS, ErroPedidos } from '../errors/erros-pedidos'
import type { PedidoRepository } from '../repositories/pedido.repository'
import { criarPedidoRepository } from '../repositories/pedido.repository'
import type { PedidoItemRepository } from '../repositories/pedido-item.repository'
import { criarPedidoItemRepository } from '../repositories/pedido-item.repository'
import { garantirPedidoSemDivisaoAtiva } from '../../divisao-conta/services/resumo-divisao-conta'
import { garantirPedidoAberto, obterResumoPedido } from './consultas-pedido'
import { executarEmTransacaoImediata } from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { registrarEventoPedidoSync } from '../../sincronizacao/services/registrar-evento-pedido'
import {
  criarPizzaPedidoItemRepository,
  type PizzaPedidoItemRepository,
} from '../../pizzas/repositories/pizza-pedido-item.repository'

export function criarDefinirObservacaoItemPedido(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioItem: PedidoItemRepository = criarPedidoItemRepository(),
  repositorioPizza: PizzaPedidoItemRepository = criarPizzaPedidoItemRepository(),
  obterConexao = obterConexaoBancoLocal,
) {
  return function definirObservacaoItemPedido(
    entrada: DefinirObservacaoItemPedidoEntrada,
  ): ResumoPedido {
    const observacao = entrada.observacao?.trim() || null
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
      garantirPedidoSemDivisaoAtiva(pedido.id)

      const item = repositorioItem.buscarPorId(entrada.itemId)

      if (!item || item.pedidoId !== entrada.pedidoId || item.canceladoEm) {
        throw new ErroPedidos(CODIGOS_ERRO_PEDIDOS.ITEM_NAO_ENCONTRADO, 'Item nao encontrado.')
      }

      const mudou = (item.observacao ?? null) !== observacao
      repositorioItem.atualizarObservacao(entrada.itemId, observacao, mudou && Boolean(item.enviadoCozinhaEm))

      if (item.tipo === TIPO_PEDIDO_ITEM.PIZZA) {
        repositorioPizza.atualizarObservacaoPorPedidoItemId(entrada.itemId, observacao)
      }

      registrarEventoPedidoSync(entrada.pedidoId, OPERACAO_SYNC.UPDATE, conexao)
      return obterResumoPedido({ pedidoId: entrada.pedidoId })
    })
  }
}

export const definirObservacaoItemPedido = criarDefinirObservacaoItemPedido()
