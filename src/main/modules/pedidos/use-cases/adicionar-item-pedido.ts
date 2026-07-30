import type { AdicionarItemPedidoEntrada, ResumoPedido } from '@shared/types/pedido'
import type { ProdutoRepository } from '../../produtos/repositories/produto.repository'
import { criarProdutoRepository } from '../../produtos/repositories/produto.repository'
import { CODIGOS_ERRO_PEDIDOS, ErroPedidos } from '../errors/erros-pedidos'
import type { PedidoRepository } from '../repositories/pedido.repository'
import { criarPedidoRepository } from '../repositories/pedido.repository'
import type { PedidoItemRepository } from '../repositories/pedido-item.repository'
import { criarPedidoItemRepository } from '../repositories/pedido-item.repository'
import { recalcularTotaisPedido } from '../services/recalcular-totais-pedido'
import { garantirPedidoAberto } from './consultas-pedido'
import { obterResumoPedido } from './consultas-pedido'

export function criarAdicionarItemPedido(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioItem: PedidoItemRepository = criarPedidoItemRepository(),
  repositorioProduto: ProdutoRepository = criarProdutoRepository(),
) {
  return function adicionarItemPedido(entrada: AdicionarItemPedidoEntrada): ResumoPedido {
    const pedido = repositorioPedido.buscarPorId(entrada.pedidoId)

    if (!pedido) {
      throw new ErroPedidos(
        CODIGOS_ERRO_PEDIDOS.PEDIDO_NAO_ENCONTRADO,
        'Pedido nao encontrado.',
      )
    }

    garantirPedidoAberto(pedido)

    if (entrada.quantidade <= 0) {
      throw new ErroPedidos(
        CODIGOS_ERRO_PEDIDOS.QUANTIDADE_INVALIDA,
        'Quantidade deve ser maior que zero.',
      )
    }

    const produto = repositorioProduto.buscarPorId(entrada.produtoId)

    if (!produto) {
      throw new ErroPedidos(
        CODIGOS_ERRO_PEDIDOS.PRODUTO_NAO_ENCONTRADO,
        'Produto nao encontrado.',
      )
    }

    if (!produto.ativo) {
      throw new ErroPedidos(
        CODIGOS_ERRO_PEDIDOS.PRODUTO_INATIVO,
        'Nao e permitido adicionar produto inativo ao pedido.',
      )
    }

    repositorioItem.inserir({
      pedidoId: entrada.pedidoId,
      produtoId: produto.id,
      produtoNome: produto.nome,
      quantidade: entrada.quantidade,
      precoUnitarioCentavos: produto.precoCentavos,
      observacao: entrada.observacao?.trim() || null,
    })

    recalcularTotaisPedido(entrada.pedidoId, repositorioPedido, repositorioItem)

    return obterResumoPedido({ pedidoId: entrada.pedidoId })
  }
}

export const adicionarItemPedido = criarAdicionarItemPedido()
