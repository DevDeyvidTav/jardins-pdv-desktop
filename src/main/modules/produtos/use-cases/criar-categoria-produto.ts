import type {
  CategoriaProduto,
  CriarCategoriaProdutoEntrada,
} from '@shared/types/categoria-produto'
import {
  CODIGOS_ERRO_PRODUTOS,
  ErroProdutos,
} from '../errors/erros-produtos'
import type { CategoriaProdutoRepository } from '../repositories/categoria-produto.repository'
import { criarCategoriaProdutoRepository } from '../repositories/categoria-produto.repository'

export function criarCriarCategoriaProduto(
  repositorio: CategoriaProdutoRepository = criarCategoriaProdutoRepository(),
) {
  return function criarCategoriaProduto(
    entrada: CriarCategoriaProdutoEntrada,
  ): CategoriaProduto {
    const nome = entrada.nome.trim()

    if (nome === '') {
      throw new ErroProdutos(
        CODIGOS_ERRO_PRODUTOS.NOME_OBRIGATORIO,
        'Nome da categoria e obrigatorio.',
      )
    }

    return repositorio.inserir({
      nome,
      descricao: entrada.descricao?.trim() || null,
    })
  }
}

export const criarCategoriaProduto = criarCriarCategoriaProduto()
