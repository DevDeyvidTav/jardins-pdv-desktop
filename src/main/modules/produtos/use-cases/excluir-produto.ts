import type { ExcluirProdutoEntrada } from '@shared/types/produto'
import {
  CODIGOS_ERRO_PRODUTOS,
  ErroProdutos,
} from '../errors/erros-produtos'
import type { ProdutoRepository } from '../repositories/produto.repository'
import { criarProdutoRepository } from '../repositories/produto.repository'

export function criarExcluirProduto(
  repositorioProduto: ProdutoRepository = criarProdutoRepository(),
) {
  return function excluirProduto(entrada: ExcluirProdutoEntrada): void {
    const existente = repositorioProduto.buscarPorId(entrada.produtoId)

    if (!existente) {
      throw new ErroProdutos(
        CODIGOS_ERRO_PRODUTOS.PRODUTO_NAO_ENCONTRADO,
        'Produto nao encontrado.',
      )
    }

    if (repositorioProduto.estaReferenciadoEmPedido(entrada.produtoId)) {
      throw new ErroProdutos(
        CODIGOS_ERRO_PRODUTOS.PRODUTO_EM_USO,
        'Nao e possivel excluir este produto porque ele ja foi usado em pedidos. Inative-o em vez de excluir.',
      )
    }

    repositorioProduto.excluir(entrada.produtoId)
  }
}

export const excluirProduto = criarExcluirProduto()
