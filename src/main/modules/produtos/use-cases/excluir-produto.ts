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
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { registrarCadastroSync, registrarProdutoSync } from '../../sincronizacao/services/registrar-cadastro-sync'
import { ENTIDADE_SYNC } from '@shared/types/sincronizacao'

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
      const produto = existente.ativo
        ? repositorioProduto.inativar(entrada.produtoId)
        : existente
      registrarProdutoSync(produto, OPERACAO_SYNC.UPDATE)
      return { modo: 'INATIVADO' }
    }

    repositorioProduto.excluir(entrada.produtoId)
    registrarCadastroSync(ENTIDADE_SYNC.PRODUTO, entrada.produtoId, OPERACAO_SYNC.CANCEL, {
      id: entrada.produtoId,
    })
    return { modo: 'EXCLUIDO' }
  }
}

export const excluirProduto = criarExcluirProduto()
