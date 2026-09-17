import {
  calcularPrecoPizzaCentavos,
  REGRA_PRECIFICACAO_PIZZA,
  resolverRegraPrecificacaoComposicaoPizza,
  type PizzaCategoria,
  type PizzaTamanho,
  type RegraPrecificacaoPizza,
} from '@shared/types/pizza'
import { CODIGOS_ERRO_PIZZAS, ErroPizzas } from '../errors/erros-pizzas'
import type { PizzaCategoriaRepository } from '../repositories/pizza-categoria.repository'
import { criarPizzaCategoriaRepository } from '../repositories/pizza-categoria.repository'
import type { PizzaSaborRepository } from '../repositories/pizza-sabor.repository'
import { criarPizzaSaborRepository } from '../repositories/pizza-sabor.repository'
import type { PizzaSaborPrecoRepository } from '../repositories/pizza-sabor-preco.repository'
import { criarPizzaSaborPrecoRepository } from '../repositories/pizza-sabor-preco.repository'
import type { PizzaTamanhoRepository } from '../repositories/pizza-tamanho.repository'
import { criarPizzaTamanhoRepository } from '../repositories/pizza-tamanho.repository'

export interface ComposicaoPizzaResolvida {
  categoria: PizzaCategoria
  regraPrecificacaoAplicada: RegraPrecificacaoPizza
  tamanho: PizzaTamanho
  sabores: Array<{
    id: string
    nome: string
    valorCentavos: number
  }>
  valorFinalCentavos: number
  produtoNome: string
}

export function criarResolverComposicaoPizza(
  repositorioCategoria: PizzaCategoriaRepository = criarPizzaCategoriaRepository(),
  repositorioTamanho: PizzaTamanhoRepository = criarPizzaTamanhoRepository(),
  repositorioSabor: PizzaSaborRepository = criarPizzaSaborRepository(),
  repositorioPreco: PizzaSaborPrecoRepository = criarPizzaSaborPrecoRepository(),
) {
  return function resolverComposicaoPizza(entrada: {
    categoriaId?: string
    tamanhoId: string
    saborIds: string[]
  }): ComposicaoPizzaResolvida {
    const tamanho = repositorioTamanho.buscarPorId(entrada.tamanhoId)
    if (!tamanho) {
      throw new ErroPizzas(
        CODIGOS_ERRO_PIZZAS.PIZZA_TAMANHO_NAO_ENCONTRADO,
        'Tamanho de pizza nao encontrado.',
      )
    }
    if (!tamanho.ativa) {
      throw new ErroPizzas(
        CODIGOS_ERRO_PIZZAS.PIZZA_TAMANHO_INATIVO,
        'Tamanho de pizza inativo.',
      )
    }

    if (entrada.saborIds.length === 0) {
      throw new ErroPizzas(
        CODIGOS_ERRO_PIZZAS.PIZZA_SEM_SABOR,
        'Pizza precisa de pelo menos um sabor.',
      )
    }

    const idsUnicos = new Set(entrada.saborIds)
    if (idsUnicos.size !== entrada.saborIds.length) {
      throw new ErroPizzas(
        CODIGOS_ERRO_PIZZAS.PIZZA_SABOR_DUPLICADO,
        'Nao e permitido repetir o mesmo sabor na pizza.',
      )
    }

    if (entrada.saborIds.length > tamanho.maximoSabores) {
      throw new ErroPizzas(
        CODIGOS_ERRO_PIZZAS.PIZZA_QUANTIDADE_SABORES_EXCEDE_LIMITE,
        `Tamanho ${tamanho.sigla} permite no maximo ${tamanho.maximoSabores} sabor(es).`,
      )
    }

    const sabores: ComposicaoPizzaResolvida['sabores'] = []
    const saboresParaPrecificacao: Array<{
      valorCentavos: number
      categoriaIds: string[]
    }> = []

    for (const saborId of entrada.saborIds) {
      const sabor = repositorioSabor.buscarPorId(saborId)
      if (!sabor) {
        throw new ErroPizzas(
          CODIGOS_ERRO_PIZZAS.PIZZA_SABOR_NAO_ENCONTRADO,
          'Sabor de pizza nao encontrado.',
        )
      }
      if (!sabor.ativa) {
        throw new ErroPizzas(
          CODIGOS_ERRO_PIZZAS.PIZZA_SABOR_INATIVO,
          `Sabor "${sabor.nome}" esta inativo.`,
        )
      }

      const categoriaIds = repositorioSabor.listarIdsCategoriasDoSabor(sabor.id)
      const categoriasAtivas = categoriaIds
        .map((categoriaId) => repositorioCategoria.buscarPorId(categoriaId))
        .filter((categoria): categoria is PizzaCategoria => !!categoria && categoria.ativa)

      if (categoriasAtivas.length === 0) {
        if (categoriaIds.length === 0) {
          throw new ErroPizzas(
            CODIGOS_ERRO_PIZZAS.PIZZA_SABOR_NAO_PERTENCE_A_CATEGORIA,
            `Sabor "${sabor.nome}" nao possui categoria vinculada.`,
          )
        }

        throw new ErroPizzas(
          CODIGOS_ERRO_PIZZAS.PIZZA_CATEGORIA_INATIVA,
          `Categoria do sabor "${sabor.nome}" esta inativa.`,
        )
      }

      const preco = repositorioPreco.buscarAtivoPorSaborETamanho(sabor.id, tamanho.id)
      if (!preco) {
        throw new ErroPizzas(
          CODIGOS_ERRO_PIZZAS.PIZZA_PRECO_NAO_CONFIGURADO_PARA_TAMANHO,
          `Preco do sabor "${sabor.nome}" nao configurado para o tamanho ${tamanho.sigla}.`,
        )
      }

      sabores.push({
        id: sabor.id,
        nome: sabor.nome,
        valorCentavos: preco.valorCentavos,
      })
      saboresParaPrecificacao.push({
        valorCentavos: preco.valorCentavos,
        categoriaIds: categoriasAtivas.map((categoria) => categoria.id),
      })
    }

    let regraPrecificacaoAplicada: RegraPrecificacaoPizza
    let categoriaReferencia: PizzaCategoria

    try {
      const resolucao = resolverRegraPrecificacaoComposicaoPizza(
        saboresParaPrecificacao,
        (categoriaId) => repositorioCategoria.buscarPorId(categoriaId),
      )
      regraPrecificacaoAplicada = resolucao.regra
      categoriaReferencia = resolucao.categoriaReferencia
    } catch (erro) {
      if (erro instanceof ErroPizzas) {
        throw erro
      }

      throw new ErroPizzas(
        CODIGOS_ERRO_PIZZAS.PIZZA_REGRA_PRECIFICACAO_INVALIDA,
        'Regra de precificacao da composicao e invalida.',
      )
    }

    if (
      regraPrecificacaoAplicada !== REGRA_PRECIFICACAO_PIZZA.MAIOR_SABOR &&
      regraPrecificacaoAplicada !== REGRA_PRECIFICACAO_PIZZA.MEDIA_SABORES
    ) {
      throw new ErroPizzas(
        CODIGOS_ERRO_PIZZAS.PIZZA_REGRA_PRECIFICACAO_INVALIDA,
        'Regra de precificacao da composicao e invalida.',
      )
    }

    const valorFinalCentavos = calcularPrecoPizzaCentavos(
      sabores.map((sabor) => sabor.valorCentavos),
      regraPrecificacaoAplicada,
    )

    const produtoNome = `Pizza ${tamanho.sigla} — ${sabores.map((s) => s.nome).join(' / ')}`

    return {
      categoria: categoriaReferencia,
      regraPrecificacaoAplicada,
      tamanho,
      sabores,
      valorFinalCentavos,
      produtoNome,
    }
  }
}

export const resolverComposicaoPizza = criarResolverComposicaoPizza()

/** Alias semantico para a mesma validacao compartilhada. */
export const validarComposicaoPizza = resolverComposicaoPizza
export const criarValidarComposicaoPizza = criarResolverComposicaoPizza
