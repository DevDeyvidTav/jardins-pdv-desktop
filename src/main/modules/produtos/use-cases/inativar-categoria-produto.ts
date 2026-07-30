import type {
  CategoriaProduto,
  InativarCategoriaProdutoEntrada,
} from '@shared/types/categoria-produto'
import {
  CODIGOS_ERRO_PRODUTOS,
  ErroProdutos,
} from '../errors/erros-produtos'
import type { CategoriaProdutoRepository } from '../repositories/categoria-produto.repository'
import { criarCategoriaProdutoRepository } from '../repositories/categoria-produto.repository'

export function criarInativarCategoriaProduto(
  repositorio: CategoriaProdutoRepository = criarCategoriaProdutoRepository(),
) {
  return function inativarCategoriaProduto(
    entrada: InativarCategoriaProdutoEntrada,
  ): CategoriaProduto {
    const existente = repositorio.buscarPorId(entrada.categoriaId)

    if (!existente) {
      throw new ErroProdutos(
        CODIGOS_ERRO_PRODUTOS.CATEGORIA_NAO_ENCONTRADA,
        'Categoria nao encontrada.',
      )
    }

    return repositorio.inativar(entrada.categoriaId)
  }
}

export const inativarCategoriaProduto = criarInativarCategoriaProduto()
