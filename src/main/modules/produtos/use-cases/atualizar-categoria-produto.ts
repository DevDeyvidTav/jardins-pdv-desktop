import type {
  AtualizarCategoriaProdutoEntrada,
  CategoriaProduto,
} from '@shared/types/categoria-produto'
import {
  CODIGOS_ERRO_PRODUTOS,
  ErroProdutos,
} from '../errors/erros-produtos'
import type { CategoriaProdutoRepository } from '../repositories/categoria-produto.repository'
import { criarCategoriaProdutoRepository } from '../repositories/categoria-produto.repository'
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { registrarCategoriaProdutoSync } from '../../sincronizacao/services/registrar-cadastro-sync'

export function criarAtualizarCategoriaProduto(
  repositorio: CategoriaProdutoRepository = criarCategoriaProdutoRepository(),
) {
  return function atualizarCategoriaProduto(
    entrada: AtualizarCategoriaProdutoEntrada,
  ): CategoriaProduto {
    const existente = repositorio.buscarPorId(entrada.categoriaId)

    if (!existente) {
      throw new ErroProdutos(
        CODIGOS_ERRO_PRODUTOS.CATEGORIA_NAO_ENCONTRADA,
        'Categoria nao encontrada.',
      )
    }

    if (entrada.nome !== undefined && entrada.nome.trim() === '') {
      throw new ErroProdutos(
        CODIGOS_ERRO_PRODUTOS.NOME_OBRIGATORIO,
        'Nome da categoria e obrigatorio.',
      )
    }

    const categoria = repositorio.atualizar({
      categoriaId: entrada.categoriaId,
      nome: entrada.nome?.trim(),
      descricao: entrada.descricao,
    })
    registrarCategoriaProdutoSync(categoria, OPERACAO_SYNC.UPDATE)
    return categoria
  }
}

export const atualizarCategoriaProduto = criarAtualizarCategoriaProduto()
