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
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { registrarCategoriaProdutoSync } from '../../sincronizacao/services/registrar-cadastro-sync'

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

    const categoria = repositorio.inserir({
      nome,
      descricao: entrada.descricao?.trim() || null,
    })
    registrarCategoriaProdutoSync(categoria, OPERACAO_SYNC.CREATE)
    return categoria
  }
}

export const criarCategoriaProduto = criarCriarCategoriaProduto()
