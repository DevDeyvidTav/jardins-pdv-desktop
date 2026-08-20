import type {
  CategoriaProduto,
  ReativarCategoriaProdutoEntrada,
} from '@shared/types/categoria-produto'
import {
  CODIGOS_ERRO_PRODUTOS,
  ErroProdutos,
} from '../errors/erros-produtos'
import type { CategoriaProdutoRepository } from '../repositories/categoria-produto.repository'
import { criarCategoriaProdutoRepository } from '../repositories/categoria-produto.repository'
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { registrarCategoriaProdutoSync } from '../../sincronizacao/services/registrar-cadastro-sync'

export function criarReativarCategoriaProduto(
  repositorio: CategoriaProdutoRepository = criarCategoriaProdutoRepository(),
) {
  return function reativarCategoriaProduto(
    entrada: ReativarCategoriaProdutoEntrada,
  ): CategoriaProduto {
    const existente = repositorio.buscarPorId(entrada.categoriaId)

    if (!existente) {
      throw new ErroProdutos(
        CODIGOS_ERRO_PRODUTOS.CATEGORIA_NAO_ENCONTRADA,
        'Categoria nao encontrada.',
      )
    }

    const categoria = repositorio.reativar(entrada.categoriaId)
    registrarCategoriaProdutoSync(categoria, OPERACAO_SYNC.UPDATE)
    return categoria
  }
}

export const reativarCategoriaProduto = criarReativarCategoriaProduto()
