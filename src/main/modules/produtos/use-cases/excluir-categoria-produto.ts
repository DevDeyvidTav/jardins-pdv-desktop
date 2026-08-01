import type { ExcluirCategoriaProdutoEntrada } from '@shared/types/categoria-produto'
import {
  CODIGOS_ERRO_PRODUTOS,
  ErroProdutos,
} from '../errors/erros-produtos'
import type { CategoriaProdutoRepository } from '../repositories/categoria-produto.repository'
import { criarCategoriaProdutoRepository } from '../repositories/categoria-produto.repository'
import type { ProdutoRepository } from '../repositories/produto.repository'
import { criarProdutoRepository } from '../repositories/produto.repository'

export function criarExcluirCategoriaProduto(
  repositorioCategoria: CategoriaProdutoRepository = criarCategoriaProdutoRepository(),
  repositorioProduto: ProdutoRepository = criarProdutoRepository(),
) {
  return function excluirCategoriaProduto(entrada: ExcluirCategoriaProdutoEntrada): void {
    const existente = repositorioCategoria.buscarPorId(entrada.categoriaId)

    if (!existente) {
      throw new ErroProdutos(
        CODIGOS_ERRO_PRODUTOS.CATEGORIA_NAO_ENCONTRADA,
        'Categoria nao encontrada.',
      )
    }

    const totalProdutos = repositorioProduto.contarPorCategoria(entrada.categoriaId)

    if (totalProdutos > 0) {
      throw new ErroProdutos(
        CODIGOS_ERRO_PRODUTOS.CATEGORIA_COM_PRODUTOS,
        'Nao e possivel excluir esta categoria enquanto houver produtos vinculados. Exclua ou mova os produtos antes.',
      )
    }

    repositorioCategoria.excluir(entrada.categoriaId)
  }
}

export const excluirCategoriaProduto = criarExcluirCategoriaProduto()
