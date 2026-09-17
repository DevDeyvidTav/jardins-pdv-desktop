import type { AtualizarSetorCategoriaEntrada } from '@shared/types/config-impressora'
import type { CategoriaProduto } from '@shared/types/categoria-produto'
import { criarCategoriaProdutoRepository } from '../../produtos/repositories/categoria-produto.repository'
import {
  CODIGOS_ERRO_CONFIGURACOES,
  ErroConfiguracoes,
} from '../errors/erros-configuracoes'

export function criarAtualizarSetorCategoria(
  repositorioCategoria = criarCategoriaProdutoRepository(),
) {
  return function atualizarSetorCategoria(
    entrada: AtualizarSetorCategoriaEntrada,
  ): CategoriaProduto {
    try {
      return repositorioCategoria.atualizarSetorImpressao(
        entrada.categoriaId,
        entrada.setorImpressao,
      )
    } catch {
      throw new ErroConfiguracoes(
        CODIGOS_ERRO_CONFIGURACOES.CATEGORIA_NAO_ENCONTRADA,
        'Categoria nao encontrada.',
      )
    }
  }
}

export const atualizarSetorCategoria = criarAtualizarSetorCategoria()
