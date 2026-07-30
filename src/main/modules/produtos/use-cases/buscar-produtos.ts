import type {
  BuscarProdutosEntrada,
  ProdutoComCategoria,
} from '@shared/types/produto'
import type { ProdutoRepository } from '../repositories/produto.repository'
import { criarProdutoRepository } from '../repositories/produto.repository'

export function criarBuscarProdutos(
  repositorio: ProdutoRepository = criarProdutoRepository(),
) {
  return function buscarProdutos(
    entrada: BuscarProdutosEntrada,
  ): ProdutoComCategoria[] {
    return repositorio.listarComCategoria({
      termo: entrada.termo,
      categoriaId: entrada.categoriaId,
      apenasAtivos: entrada.apenasAtivos ?? true,
    })
  }
}

export const buscarProdutos = criarBuscarProdutos()
