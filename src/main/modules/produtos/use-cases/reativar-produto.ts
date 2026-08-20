import type { Produto, ReativarProdutoEntrada } from '@shared/types/produto'
import {
  CODIGOS_ERRO_PRODUTOS,
  ErroProdutos,
} from '../errors/erros-produtos'
import type { CategoriaProdutoRepository } from '../repositories/categoria-produto.repository'
import { criarCategoriaProdutoRepository } from '../repositories/categoria-produto.repository'
import type { ProdutoRepository } from '../repositories/produto.repository'
import { criarProdutoRepository } from '../repositories/produto.repository'
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { registrarProdutoSync } from '../../sincronizacao/services/registrar-cadastro-sync'

export function criarReativarProduto(
  repositorioProduto: ProdutoRepository = criarProdutoRepository(),
  repositorioCategoria: CategoriaProdutoRepository = criarCategoriaProdutoRepository(),
) {
  return function reativarProduto(entrada: ReativarProdutoEntrada): Produto {
    const existente = repositorioProduto.buscarPorId(entrada.produtoId)

    if (!existente) {
      throw new ErroProdutos(
        CODIGOS_ERRO_PRODUTOS.PRODUTO_NAO_ENCONTRADO,
        'Produto nao encontrado.',
      )
    }

    const categoria = repositorioCategoria.buscarPorId(existente.categoriaId)

    if (!categoria) {
      throw new ErroProdutos(
        CODIGOS_ERRO_PRODUTOS.CATEGORIA_NAO_ENCONTRADA,
        'Categoria nao encontrada.',
      )
    }

    if (!categoria.ativo) {
      throw new ErroProdutos(
        CODIGOS_ERRO_PRODUTOS.CATEGORIA_INATIVA,
        'Reative a categoria antes de reativar o produto.',
      )
    }

    const produto = repositorioProduto.reativar(entrada.produtoId)
    registrarProdutoSync(produto, OPERACAO_SYNC.UPDATE)
    return produto
  }
}

export const reativarProduto = criarReativarProduto()
