import type { InativarProdutoEntrada, Produto } from '@shared/types/produto'
import {
  CODIGOS_ERRO_PRODUTOS,
  ErroProdutos,
} from '../errors/erros-produtos'
import type { ProdutoRepository } from '../repositories/produto.repository'
import { criarProdutoRepository } from '../repositories/produto.repository'

export function criarInativarProduto(
  repositorio: ProdutoRepository = criarProdutoRepository(),
) {
  return function inativarProduto(entrada: InativarProdutoEntrada): Produto {
    const existente = repositorio.buscarPorId(entrada.produtoId)

    if (!existente) {
      throw new ErroProdutos(
        CODIGOS_ERRO_PRODUTOS.PRODUTO_NAO_ENCONTRADO,
        'Produto nao encontrado.',
      )
    }

    return repositorio.inativar(entrada.produtoId)
  }
}

export const inativarProduto = criarInativarProduto()
