import {
  REGRA_PRECIFICACAO_PIZZA,
  type CriarPizzaCategoriaEntrada,
  type PizzaCategoria,
  type RegraPrecificacaoPizza,
} from '@shared/types/pizza'
import { CODIGOS_ERRO_PIZZAS, ErroPizzas } from '../errors/erros-pizzas'
import type { PizzaCategoriaRepository } from '../repositories/pizza-categoria.repository'
import { criarPizzaCategoriaRepository } from '../repositories/pizza-categoria.repository'

function garantirRegraValida(regra: RegraPrecificacaoPizza): void {
  if (
    regra !== REGRA_PRECIFICACAO_PIZZA.MAIOR_SABOR &&
    regra !== REGRA_PRECIFICACAO_PIZZA.MEDIA_SABORES
  ) {
    throw new ErroPizzas(
      CODIGOS_ERRO_PIZZAS.PIZZA_REGRA_PRECIFICACAO_INVALIDA,
      'Regra de precificacao invalida.',
    )
  }
}

export function criarCriarPizzaCategoria(
  repositorio: PizzaCategoriaRepository = criarPizzaCategoriaRepository(),
) {
  return function criarPizzaCategoria(
    entrada: CriarPizzaCategoriaEntrada,
  ): PizzaCategoria {
    const nome = entrada.nome.trim()
    if (nome === '') {
      throw new ErroPizzas(
        CODIGOS_ERRO_PIZZAS.NOME_OBRIGATORIO,
        'Nome da categoria e obrigatorio.',
      )
    }

    const regra =
      entrada.regraPrecificacao ?? REGRA_PRECIFICACAO_PIZZA.MAIOR_SABOR
    garantirRegraValida(regra)

    return repositorio.inserir({
      nome,
      descricao: entrada.descricao?.trim() || null,
      regraPrecificacao: regra,
      ordem: entrada.ordem ?? 0,
    })
  }
}

export const criarPizzaCategoria = criarCriarPizzaCategoria()

export function criarListarPizzaCategorias(
  repositorio: PizzaCategoriaRepository = criarPizzaCategoriaRepository(),
) {
  return function listarPizzaCategorias(entrada?: {
    apenasAtivas?: boolean
  }): PizzaCategoria[] {
    return repositorio.listar({ apenasAtivas: entrada?.apenasAtivas })
  }
}

export const listarPizzaCategorias = criarListarPizzaCategorias()

export function criarAtualizarPizzaCategoria(
  repositorio: PizzaCategoriaRepository = criarPizzaCategoriaRepository(),
) {
  return function atualizarPizzaCategoria(
    entrada: import('@shared/types/pizza').AtualizarPizzaCategoriaEntrada,
  ): PizzaCategoria {
    const existente = repositorio.buscarPorId(entrada.categoriaId)
    if (!existente) {
      throw new ErroPizzas(
        CODIGOS_ERRO_PIZZAS.PIZZA_CATEGORIA_NAO_ENCONTRADA,
        'Categoria de pizza nao encontrada.',
      )
    }

    if (entrada.nome !== undefined && entrada.nome.trim() === '') {
      throw new ErroPizzas(
        CODIGOS_ERRO_PIZZAS.NOME_OBRIGATORIO,
        'Nome da categoria e obrigatorio.',
      )
    }

    if (entrada.regraPrecificacao !== undefined) {
      garantirRegraValida(entrada.regraPrecificacao)
    }

    return repositorio.atualizar({
      categoriaId: entrada.categoriaId,
      nome: entrada.nome?.trim(),
      descricao: entrada.descricao,
      regraPrecificacao: entrada.regraPrecificacao,
      ativa: entrada.ativa,
      ordem: entrada.ordem,
    })
  }
}

export const atualizarPizzaCategoria = criarAtualizarPizzaCategoria()
