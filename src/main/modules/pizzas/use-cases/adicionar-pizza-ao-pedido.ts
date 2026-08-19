import { TIPO_PEDIDO_ITEM, type AdicionarPizzaAoPedidoEntrada } from '@shared/types/pizza'
import type { ResumoPedido } from '@shared/types/pedido'
import {
  executarEmTransacaoImediata,
  persistirConexaoBanco,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import {
  criarPedidoDivisaoContaRepository,
  type PedidoDivisaoContaRepository,
} from '../../divisao-conta/repositories/divisao-conta.repository'
import { CODIGOS_ERRO_PEDIDOS, ErroPedidos } from '../../pedidos/errors/erros-pedidos'
import type { PedidoRepository } from '../../pedidos/repositories/pedido.repository'
import { criarPedidoRepository } from '../../pedidos/repositories/pedido.repository'
import type { PedidoItemRepository } from '../../pedidos/repositories/pedido-item.repository'
import { criarPedidoItemRepository } from '../../pedidos/repositories/pedido-item.repository'
import { recalcularTotaisPedido } from '../../pedidos/services/recalcular-totais-pedido'
import {
  garantirPedidoAberto,
  obterResumoPedido,
} from '../../pedidos/use-cases/consultas-pedido'
import { CODIGOS_ERRO_PIZZAS, ErroPizzas } from '../errors/erros-pizzas'
import type { PizzaCategoriaRepository } from '../repositories/pizza-categoria.repository'
import { criarPizzaCategoriaRepository } from '../repositories/pizza-categoria.repository'
import type { PizzaPedidoItemRepository } from '../repositories/pizza-pedido-item.repository'
import { criarPizzaPedidoItemRepository } from '../repositories/pizza-pedido-item.repository'
import type { PizzaSaborRepository } from '../repositories/pizza-sabor.repository'
import { criarPizzaSaborRepository } from '../repositories/pizza-sabor.repository'
import type { PizzaSaborPrecoRepository } from '../repositories/pizza-sabor-preco.repository'
import { criarPizzaSaborPrecoRepository } from '../repositories/pizza-sabor-preco.repository'
import type { PizzaTamanhoRepository } from '../repositories/pizza-tamanho.repository'
import { criarPizzaTamanhoRepository } from '../repositories/pizza-tamanho.repository'
import { criarResolverComposicaoPizza } from './resolver-composicao-pizza'
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { registrarEventoPedidoSync } from '../../sincronizacao/services/registrar-evento-pedido'

export function criarAdicionarPizzaAoPedido(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioItem: PedidoItemRepository = criarPedidoItemRepository(),
  repositorioPizzaItem: PizzaPedidoItemRepository = criarPizzaPedidoItemRepository(),
  repositorioCategoria: PizzaCategoriaRepository = criarPizzaCategoriaRepository(),
  repositorioTamanho: PizzaTamanhoRepository = criarPizzaTamanhoRepository(),
  repositorioSabor: PizzaSaborRepository = criarPizzaSaborRepository(),
  repositorioPreco: PizzaSaborPrecoRepository = criarPizzaSaborPrecoRepository(),
  repositorioDivisao: PedidoDivisaoContaRepository = criarPedidoDivisaoContaRepository(),
  obterConexao = obterConexaoBancoLocal,
) {
  const resolver = criarResolverComposicaoPizza(
    repositorioCategoria,
    repositorioTamanho,
    repositorioSabor,
    repositorioPreco,
  )

  return function adicionarPizzaAoPedido(
    entrada: AdicionarPizzaAoPedidoEntrada,
  ): ResumoPedido {
    const conexao = obterConexao()
    const resumo = executarEmTransacaoImediata(conexao, () => {
      const pedido = repositorioPedido.buscarPorId(entrada.pedidoId)
      if (!pedido) {
        throw new ErroPedidos(
          CODIGOS_ERRO_PEDIDOS.PEDIDO_NAO_ENCONTRADO,
          'Pedido nao encontrado.',
        )
      }

      garantirPedidoAberto(pedido)

      if (repositorioDivisao.buscarAtivaPorPedido(pedido.id)) {
        throw new ErroPizzas(
          CODIGOS_ERRO_PIZZAS.ALTERACAO_PIZZA_BLOQUEADA_POR_DIVISAO_ATIVA,
          'Nao e permitido incluir pizza com divisao de conta ativa.',
        )
      }

      const composicao = resolver({
        categoriaId: entrada.categoriaId,
        tamanhoId: entrada.tamanhoId,
        saborIds: entrada.saborIds,
      })

      const item = repositorioItem.inserir({
        pedidoId: entrada.pedidoId,
        produtoId: null,
        tipo: TIPO_PEDIDO_ITEM.PIZZA,
        produtoNome: composicao.produtoNome,
        quantidade: 1,
        precoUnitarioCentavos: composicao.valorFinalCentavos,
        descontoCentavos: 0,
        observacao: entrada.observacao?.trim() || null,
      })

      repositorioPizzaItem.inserir({
        pedidoItemId: item.id,
        pizzaCategoriaId: composicao.categoria.id,
        pizzaTamanhoId: composicao.tamanho.id,
        regraPrecificacaoSnapshot: composicao.categoria.regraPrecificacao,
        valorCalculadoCentavos: composicao.valorFinalCentavos,
        observacao: entrada.observacao?.trim() || null,
        categoriaNomeSnapshot: composicao.categoria.nome,
        tamanhoNomeSnapshot: composicao.tamanho.nome,
        sabores: composicao.sabores.map((sabor, indice) => ({
          pizzaSaborId: sabor.id,
          saborNomeSnapshot: sabor.nome,
          valorSaborSnapshotCentavos: sabor.valorCentavos,
          ordem: indice + 1,
        })),
      })

      recalcularTotaisPedido(entrada.pedidoId, repositorioPedido, repositorioItem)

      registrarEventoPedidoSync(entrada.pedidoId, OPERACAO_SYNC.UPDATE, conexao)
      return obterResumoPedido({ pedidoId: entrada.pedidoId })
    })

    persistirConexaoBanco(conexao)
    return resumo
  }
}

export const adicionarPizzaAoPedido = criarAdicionarPizzaAoPedido()
