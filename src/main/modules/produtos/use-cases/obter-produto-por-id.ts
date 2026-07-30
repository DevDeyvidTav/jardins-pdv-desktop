import type {
  ObterProdutoPorIdEntrada,
  Produto,
} from '@shared/types/produto'
import {
  CODIGOS_ERRO_PRODUTOS,
  ErroProdutos,
} from '../errors/erros-produtos'
import type { ProdutoRepository } from '../repositories/produto.repository'
import { criarProdutoRepository } from '../repositories/produto.repository'

export function criarObterProdutoPorId(
  repositorio: ProdutoRepository = criarProdutoRepository(),
) {
  return function obterProdutoPorId(entrada: ObterProdutoPorIdEntrada): Produto {
    const produto = repositorio.buscarPorId(entrada.produtoId)

    if (!produto) {
      throw new ErroProdutos(
        CODIGOS_ERRO_PRODUTOS.PRODUTO_NAO_ENCONTRADO,
        'Produto nao encontrado.',
      )
    }

    return produto
  }
}

export const obterProdutoPorId = criarObterProdutoPorId()
