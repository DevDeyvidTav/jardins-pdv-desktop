import type { ExcluirCategoriaProdutoEntrada } from '@shared/types/categoria-produto'
import type { ResultadoRemocaoCatalogo } from '@shared/types/produto'
import {
  confirmarTransacao,
  iniciarTransacaoImediata,
  persistirConexaoBanco,
  reverterTransacao,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import {
  CODIGOS_ERRO_PRODUTOS,
  ErroProdutos,
} from '../errors/erros-produtos'
import type { CategoriaProdutoRepository } from '../repositories/categoria-produto.repository'
import { criarCategoriaProdutoRepository } from '../repositories/categoria-produto.repository'
import type { ProdutoRepository } from '../repositories/produto.repository'
import { criarProdutoRepository } from '../repositories/produto.repository'
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import {
  registrarCategoriaProdutoSync,
  registrarProdutoSync,
} from '../../sincronizacao/services/registrar-cadastro-sync'

export function criarExcluirCategoriaProduto(
  repositorioCategoria: CategoriaProdutoRepository = criarCategoriaProdutoRepository(),
  repositorioProduto: ProdutoRepository = criarProdutoRepository(),
  obterConexao = obterConexaoBancoLocal,
) {
  return function excluirCategoriaProduto(
    entrada: ExcluirCategoriaProdutoEntrada,
  ): ResultadoRemocaoCatalogo {
    const existente = repositorioCategoria.buscarPorId(entrada.categoriaId)

    if (!existente) {
      throw new ErroProdutos(
        CODIGOS_ERRO_PRODUTOS.CATEGORIA_NAO_ENCONTRADA,
        'Categoria nao encontrada.',
      )
    }

    const conexao = obterConexao()
    iniciarTransacaoImediata(conexao)

    try {
      // Soft delete em cascata: produtos vinculados, depois a categoria.
      repositorioProduto.inativarPorCategoria(entrada.categoriaId)

      if (existente.ativo) {
        repositorioCategoria.inativar(entrada.categoriaId)
      }

      confirmarTransacao(conexao)
      persistirConexaoBanco(conexao)

      const categoriaAtualizada = repositorioCategoria.buscarPorId(entrada.categoriaId)
      if (categoriaAtualizada) {
        registrarCategoriaProdutoSync(categoriaAtualizada, OPERACAO_SYNC.UPDATE, conexao)
      }
      for (const produto of repositorioProduto.listarComCategoria({
        categoriaId: entrada.categoriaId,
      })) {
        registrarProdutoSync(produto, OPERACAO_SYNC.UPDATE, conexao)
      }
    } catch (erro) {
      reverterTransacao(conexao)
      throw erro
    }

    return { modo: 'INATIVADO' }
  }
}

export const excluirCategoriaProduto = criarExcluirCategoriaProduto()
