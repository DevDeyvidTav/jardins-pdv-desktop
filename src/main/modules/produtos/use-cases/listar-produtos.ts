import type {
  ListarProdutosEntrada,
  ProdutoComCategoria,
} from '@shared/types/produto'
import type { ProdutoRepository } from '../repositories/produto.repository'
import { criarProdutoRepository } from '../repositories/produto.repository'

export function criarListarProdutos(
  repositorio: ProdutoRepository = criarProdutoRepository(),
) {
  return function listarProdutos(
    entrada?: ListarProdutosEntrada,
  ): ProdutoComCategoria[] {
    return repositorio.listarComCategoria({
      categoriaId: entrada?.categoriaId,
      apenasAtivos: entrada?.apenasAtivos ?? true,
    })
  }
}

export const listarProdutos = criarListarProdutos()
