import type { AdicionarItemPedidoEntrada, ResumoPedido } from '@shared/types/pedido'
import { TIPO_PEDIDO_ITEM } from '@shared/types/pizza'
import type { ProdutoRepository } from '../../produtos/repositories/produto.repository'
import { criarProdutoRepository } from '../../produtos/repositories/produto.repository'
import { CODIGOS_ERRO_PEDIDOS, ErroPedidos } from '../errors/erros-pedidos'
import type { PedidoRepository } from '../repositories/pedido.repository'
import { criarPedidoRepository } from '../repositories/pedido.repository'
import type { PedidoItemRepository } from '../repositories/pedido-item.repository'
import { criarPedidoItemRepository } from '../repositories/pedido-item.repository'
import { garantirPedidoSemDivisaoAtiva } from '../../divisao-conta/services/resumo-divisao-conta'
import { recalcularTotaisPedido } from '../services/recalcular-totais-pedido'
import { garantirPedidoAberto } from './consultas-pedido'
import { obterResumoPedido } from './consultas-pedido'
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { registrarEventoPedidoSync } from '../../sincronizacao/services/registrar-evento-pedido'
import { executarEmTransacaoImediata } from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import { snapshotFiscalDeProduto } from '@shared/utils/snapshot-fiscal-item'

export function criarAdicionarItemPedido(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioItem: PedidoItemRepository = criarPedidoItemRepository(),
  repositorioProduto: ProdutoRepository = criarProdutoRepository(),
  obterConexao = obterConexaoBancoLocal,
) {
  return function adicionarItemPedido(entrada: AdicionarItemPedidoEntrada): ResumoPedido {
    if (entrada.quantidade <= 0) {
      throw new ErroPedidos(
        CODIGOS_ERRO_PEDIDOS.QUANTIDADE_INVALIDA,
        'Quantidade deve ser maior que zero.',
      )
    }

    const descontoItemCentavos = entrada.descontoCentavos ?? 0
    if (descontoItemCentavos < 0) {
      throw new ErroPedidos(
        CODIGOS_ERRO_PEDIDOS.ENTRADA_INVALIDA,
        'Desconto do item deve ser maior ou igual a zero.',
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
        tipo: TIPO_PEDIDO_ITEM.PRODUTO,
        produtoNome: produto.nome,
        quantidade: entrada.quantidade,
        precoUnitarioCentavos: produto.precoCentavos,
        descontoCentavos: descontoItemCentavos,
        observacao: entrada.observacao?.trim() || null,
        fiscal: snapshotFiscalDeProduto(produto),
      })

      recalcularTotaisPedido(entrada.pedidoId, repositorioPedido, repositorioItem)

      registrarEventoPedidoSync(entrada.pedidoId, OPERACAO_SYNC.UPDATE, conexao)
      return obterResumoPedido({ pedidoId: entrada.pedidoId })
    })
  }
}

export const adicionarItemPedido = criarAdicionarItemPedido()
