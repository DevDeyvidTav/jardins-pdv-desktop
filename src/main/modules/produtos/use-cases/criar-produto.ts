import type { CriarProdutoEntrada, Produto } from '@shared/types/produto'
import {
  CODIGOS_ERRO_PRODUTOS,
  ErroProdutos,
} from '../errors/erros-produtos'
import type { CategoriaProdutoRepository } from '../repositories/categoria-produto.repository'
import { criarCategoriaProdutoRepository } from '../repositories/categoria-produto.repository'
import type { ProdutoRepository } from '../repositories/produto.repository'
import { criarProdutoRepository } from '../repositories/produto.repository'
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { registrarProdutoSync } from '../../sincronizacao/services/registrar-cadastro-sync'

export function criarCriarProduto(
  repositorioProduto: ProdutoRepository = criarProdutoRepository(),
  repositorioCategoria: CategoriaProdutoRepository = criarCategoriaProdutoRepository(),
) {
  return function criarProduto(entrada: CriarProdutoEntrada): Produto {
    const nome = entrada.nome.trim()

    if (nome === '') {
      throw new ErroProdutos(
        CODIGOS_ERRO_PRODUTOS.NOME_OBRIGATORIO,
        'Nome do produto e obrigatorio.',
      )
    }

    if (entrada.precoCentavos < 0) {
      throw new ErroProdutos(
        CODIGOS_ERRO_PRODUTOS.PRECO_INVALIDO,
        'Preco nao pode ser negativo.',
      )
    }

    const categoria = repositorioCategoria.buscarPorId(entrada.categoriaId)

    if (!categoria) {
      throw new ErroProdutos(
        CODIGOS_ERRO_PRODUTOS.CATEGORIA_NAO_ENCONTRADA,
        'Categoria nao encontrada.',
      )
    }

    if (!categoria.ativo) {
      throw new ErroProdutos(
        CODIGOS_ERRO_PRODUTOS.CATEGORIA_INATIVA,
        'Nao e permitido vincular produto a categoria inativa.',
      )
    }

    const produto = repositorioProduto.inserir({
      categoriaId: entrada.categoriaId,
      nome,
      descricao: entrada.descricao?.trim() || null,
      precoCentavos: entrada.precoCentavos,
    })
    registrarProdutoSync(produto, OPERACAO_SYNC.CREATE)
    return produto
  }
}

export const criarProduto = criarCriarProduto()
