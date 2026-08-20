import type { InativarProdutoEntrada, Produto } from '@shared/types/produto'
import {
  CODIGOS_ERRO_PRODUTOS,
  ErroProdutos,
} from '../errors/erros-produtos'
import type { ProdutoRepository } from '../repositories/produto.repository'
import { criarProdutoRepository } from '../repositories/produto.repository'
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { registrarProdutoSync } from '../../sincronizacao/services/registrar-cadastro-sync'

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

    const produto = repositorio.inativar(entrada.produtoId)
    registrarProdutoSync(produto, OPERACAO_SYNC.UPDATE)
    return produto
  }
}

export const inativarProduto = criarInativarProduto()
