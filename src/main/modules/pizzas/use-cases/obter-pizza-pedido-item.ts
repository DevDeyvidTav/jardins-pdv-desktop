import type {
  ObterPizzaPedidoItemEntrada,
  PizzaPedidoItemResumo,
} from '@shared/types/pizza'
import { CODIGOS_ERRO_PIZZAS, ErroPizzas } from '../errors/erros-pizzas'
import type { PizzaPedidoItemRepository } from '../repositories/pizza-pedido-item.repository'
import { criarPizzaPedidoItemRepository } from '../repositories/pizza-pedido-item.repository'

export function criarObterPizzaPedidoItem(
  repositorio: PizzaPedidoItemRepository = criarPizzaPedidoItemRepository(),
) {
  return function obterPizzaPedidoItem(
    entrada: ObterPizzaPedidoItemEntrada,
  ): PizzaPedidoItemResumo {
    const pizza = repositorio.buscarPorPedidoItemId(entrada.pedidoItemId)
    if (!pizza) {
      throw new ErroPizzas(
        CODIGOS_ERRO_PIZZAS.ENTRADA_INVALIDA,
        'Item de pizza nao encontrado para o pedido_item informado.',
      )
    }
    return pizza
  }
}

export const obterPizzaPedidoItem = criarObterPizzaPedidoItem()
