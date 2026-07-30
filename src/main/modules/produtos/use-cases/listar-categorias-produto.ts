import type {
  CategoriaProduto,
  ListarCategoriasProdutoEntrada,
} from '@shared/types/categoria-produto'
import type { CategoriaProdutoRepository } from '../repositories/categoria-produto.repository'
import { criarCategoriaProdutoRepository } from '../repositories/categoria-produto.repository'

export function criarListarCategoriasProduto(
  repositorio: CategoriaProdutoRepository = criarCategoriaProdutoRepository(),
) {
  return function listarCategoriasProduto(
    entrada?: ListarCategoriasProdutoEntrada,
  ): CategoriaProduto[] {
    return repositorio.listar({
      apenasAtivas: entrada?.apenasAtivas,
    })
  }
}

export const listarCategoriasProduto = criarListarCategoriasProduto()
