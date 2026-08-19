import type { AlterarQuantidadeItemPedidoEntrada, ResumoPedido } from '@shared/types/pedido'
import { TIPO_PEDIDO_ITEM } from '@shared/types/pizza'
import { CODIGOS_ERRO_PEDIDOS, ErroPedidos } from '../errors/erros-pedidos'
import type { PedidoRepository } from '../repositories/pedido.repository'
import { criarPedidoRepository } from '../repositories/pedido.repository'
import type { PedidoItemRepository } from '../repositories/pedido-item.repository'
import { criarPedidoItemRepository } from '../repositories/pedido-item.repository'
import { garantirPedidoSemDivisaoAtiva } from '../../divisao-conta/services/resumo-divisao-conta'
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

export function criarAlterarQuantidadeItemPedido(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioItem: PedidoItemRepository = criarPedidoItemRepository(),
  obterConexao = obterConexaoBancoLocal,
) {
  return function alterarQuantidadeItemPedido(
    entrada: AlterarQuantidadeItemPedidoEntrada,
  ): ResumoPedido {
    if (entrada.quantidade <= 0) {
      throw new ErroPedidos(
        CODIGOS_ERRO_PEDIDOS.QUANTIDADE_INVALIDA,
        'Quantidade deve ser maior que zero.',
      )
    }

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

      if (item.tipo === TIPO_PEDIDO_ITEM.PIZZA) {
        throw new ErroPizzas(
          CODIGOS_ERRO_PIZZAS.QUANTIDADE_PIZZA_NAO_ALTERAVEL,
          'Quantidade de pizza nao pode ser alterada. Remova e adicione outra pizza.',
        )
      }

      repositorioItem.atualizarQuantidade(entrada.itemId, entrada.quantidade)
      recalcularTotaisPedido(entrada.pedidoId, repositorioPedido, repositorioItem)

      registrarEventoPedidoSync(entrada.pedidoId, OPERACAO_SYNC.UPDATE, conexao)
      return obterResumoPedido({ pedidoId: entrada.pedidoId })
    })
  }
}

export const alterarQuantidadeItemPedido = criarAlterarQuantidadeItemPedido()
