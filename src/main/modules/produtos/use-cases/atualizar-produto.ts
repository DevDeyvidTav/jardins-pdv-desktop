import type {
  AtualizarProdutoEntrada,
  Produto,
} from '@shared/types/produto'
import {
  CODIGOS_ERRO_PRODUTOS,
  ErroProdutos,
} from '../errors/erros-produtos'
import type { CategoriaProdutoRepository } from '../repositories/categoria-produto.repository'
import { criarCategoriaProdutoRepository } from '../repositories/categoria-produto.repository'
import type { ProdutoRepository } from '../repositories/produto.repository'
import { criarProdutoRepository } from '../repositories/produto.repository'
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { ACAO_AUDITORIA } from '@shared/types/auditoria'
import { formatarCentavosParaReais } from '@shared/utils/moeda'
import { registrarProdutoSync } from '../../sincronizacao/services/registrar-cadastro-sync'
import { registrarAcaoAuditoria } from '../../sincronizacao/services/registrar-acao-auditoria'
import { validarRestricaoFiscalAtualizar } from '../util/restaurar-fiscal-produto'

export function criarAtualizarProduto(
  repositorioProduto: ProdutoRepository = criarProdutoRepository(),
  repositorioCategoria: CategoriaProdutoRepository = criarCategoriaProdutoRepository(),
) {
  return function atualizarProduto(entrada: AtualizarProdutoEntrada): Produto {
    validarRestricaoFiscalAtualizar(entrada)
    const existente = repositorioProduto.buscarPorId(entrada.produtoId)

    if (!existente) {
      throw new ErroProdutos(
        CODIGOS_ERRO_PRODUTOS.PRODUTO_NAO_ENCONTRADO,
        'Produto nao encontrado.',
      )
    }

    if (entrada.nome !== undefined && entrada.nome.trim() === '') {
      throw new ErroProdutos(
        CODIGOS_ERRO_PRODUTOS.NOME_OBRIGATORIO,
        'Nome do produto e obrigatorio.',
      )
    }

    if (entrada.precoCentavos !== undefined && entrada.precoCentavos < 0) {
      throw new ErroProdutos(
        CODIGOS_ERRO_PRODUTOS.PRECO_INVALIDO,
        'Preco nao pode ser negativo.',
      )
    }

    if (entrada.categoriaId) {
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
    }

    const precoAntes = existente.precoCentavos
    const produto = repositorioProduto.atualizar({
      produtoId: entrada.produtoId,
      categoriaId: entrada.categoriaId,
      nome: entrada.nome?.trim(),
      descricao: entrada.descricao,
      precoCentavos: entrada.precoCentavos,
      fiscalNcm: entrada.fiscalNcm,
      fiscalCest: entrada.fiscalCest,
      fiscalCfop: entrada.fiscalCfop,
      fiscalIcmsOrigem: entrada.fiscalIcmsOrigem,
      fiscalIcmsCsosn: entrada.fiscalIcmsCsosn,
      fiscalPisCst: entrada.fiscalPisCst,
      fiscalCofinsCst: entrada.fiscalCofinsCst,
      fiscalAliquotaNacional: entrada.fiscalAliquotaNacional,
    })
    if (entrada.precoCentavos !== undefined && entrada.precoCentavos !== precoAntes) {
      registrarAcaoAuditoria({
        acao: ACAO_AUDITORIA.PRECO,
        resumo: `Alterou o preço de ${produto.nome} de ${formatarCentavosParaReais(precoAntes)} para ${formatarCentavosParaReais(entrada.precoCentavos)}`,
        entidade: 'PRODUTO',
        entidadeId: produto.id,
        detalhes: {
          precoAnteriorCentavos: precoAntes,
          precoNovoCentavos: entrada.precoCentavos,
        },
      })
    }
    registrarProdutoSync(produto, OPERACAO_SYNC.UPDATE)
    return produto
  }
}

export const atualizarProduto = criarAtualizarProduto()
