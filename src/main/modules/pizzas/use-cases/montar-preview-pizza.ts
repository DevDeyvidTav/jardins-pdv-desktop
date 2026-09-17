import type {
  MontarPreviewPizzaEntrada,
  PreviewPizza,
} from '@shared/types/pizza'
import {
  criarResolverComposicaoPizza,
  type ComposicaoPizzaResolvida,
} from './resolver-composicao-pizza'
import type { PizzaCategoriaRepository } from '../repositories/pizza-categoria.repository'
import { criarPizzaCategoriaRepository } from '../repositories/pizza-categoria.repository'
import type { PizzaSaborRepository } from '../repositories/pizza-sabor.repository'
import { criarPizzaSaborRepository } from '../repositories/pizza-sabor.repository'
import type { PizzaSaborPrecoRepository } from '../repositories/pizza-sabor-preco.repository'
import { criarPizzaSaborPrecoRepository } from '../repositories/pizza-sabor-preco.repository'
import type { PizzaTamanhoRepository } from '../repositories/pizza-tamanho.repository'
import { criarPizzaTamanhoRepository } from '../repositories/pizza-tamanho.repository'

function mapearPreview(composicao: ComposicaoPizzaResolvida): PreviewPizza {
  return {
    categoria: {
      id: composicao.categoria.id,
      nome: composicao.categoria.nome,
      regraPrecificacao: composicao.regraPrecificacaoAplicada,
    },
    tamanho: {
      id: composicao.tamanho.id,
      nome: composicao.tamanho.nome,
      sigla: composicao.tamanho.sigla,
      maximoSabores: composicao.tamanho.maximoSabores,
    },
    sabores: composicao.sabores,
    valorFinalCentavos: composicao.valorFinalCentavos,
  }
}

export function criarMontarPreviewPizza(
  repositorioCategoria: PizzaCategoriaRepository = criarPizzaCategoriaRepository(),
  repositorioTamanho: PizzaTamanhoRepository = criarPizzaTamanhoRepository(),
  repositorioSabor: PizzaSaborRepository = criarPizzaSaborRepository(),
  repositorioPreco: PizzaSaborPrecoRepository = criarPizzaSaborPrecoRepository(),
) {
  const resolver = criarResolverComposicaoPizza(
    repositorioCategoria,
    repositorioTamanho,
    repositorioSabor,
    repositorioPreco,
  )

  return function montarPreviewPizza(entrada: MontarPreviewPizzaEntrada): PreviewPizza {
    return mapearPreview(resolver(entrada))
  }
}

export const montarPreviewPizza = criarMontarPreviewPizza()
