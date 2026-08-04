import type {
  ExcluirProdutoEntrada,
  ResultadoRemocaoCatalogo,
} from '@shared/types/produto'
import {
  CODIGOS_ERRO_PRODUTOS,
  ErroProdutos,
} from '../errors/erros-produtos'
import type { ProdutoRepository } from '../repositories/produto.repository'
import { criarProdutoRepository } from '../repositories/produto.repository'

export function criarExcluirProduto(
  repositorioProduto: ProdutoRepository = criarProdutoRepository(),
) {
  return function excluirProduto(entrada: ExcluirProdutoEntrada): ResultadoRemocaoCatalogo {
    const existente = repositorioProduto.buscarPorId(entrada.produtoId)

    if (!existente) {
      throw new ErroProdutos(
        CODIGOS_ERRO_PRODUTOS.PRODUTO_NAO_ENCONTRADO,
        'Produto nao encontrado.',
      )
    }

    // Soft delete: produto ja usado em pedidos nao pode sumir do historico.
    if (repositorioProduto.estaReferenciadoEmPedido(entrada.produtoId)) {
      if (existente.ativo) {
        repositorioProduto.inativar(entrada.produtoId)
      }
      return { modo: 'INATIVADO' }
    }

    repositorioProduto.excluir(entrada.produtoId)
    return { modo: 'EXCLUIDO' }
  }
}

export const excluirProduto = criarExcluirProduto()
