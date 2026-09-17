export const REGRA_PRECIFICACAO_PIZZA = {
  MAIOR_SABOR: 'MAIOR_SABOR',
  MEDIA_SABORES: 'MEDIA_SABORES',
} as const

export type RegraPrecificacaoPizza =
  (typeof REGRA_PRECIFICACAO_PIZZA)[keyof typeof REGRA_PRECIFICACAO_PIZZA]

export const TIPO_PEDIDO_ITEM = {
  PRODUTO: 'PRODUTO',
  PIZZA: 'PIZZA',
} as const

export type TipoPedidoItem = (typeof TIPO_PEDIDO_ITEM)[keyof typeof TIPO_PEDIDO_ITEM]

export interface PizzaCategoria {
  id: string
  nome: string
  descricao: string | null
  regraPrecificacao: RegraPrecificacaoPizza
  ativa: boolean
  ordem: number
  criadoEm: string
  atualizadoEm: string
}

export interface PizzaTamanho {
  id: string
  nome: string
  sigla: string
  maximoSabores: number
  ativa: boolean
  ordem: number
  criadoEm: string
  atualizadoEm: string
}

export interface PizzaSabor {
  id: string
  nome: string
  descricao: string | null
  ativa: boolean
  ordem: number
  criadoEm: string
  atualizadoEm: string
}

export interface PizzaSaborComCategoria extends PizzaSabor {
  categoriaId: string
  categoriaNome: string
}

export interface PizzaSaborPreco {
  id: string
  pizzaSaborId: string
  pizzaTamanhoId: string
  valorCentavos: number
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
}

export interface CriarPizzaCategoriaEntrada {
  nome: string
  descricao?: string
  regraPrecificacao?: RegraPrecificacaoPizza
  ordem?: number
}

export interface AtualizarPizzaCategoriaEntrada {
  categoriaId: string
  nome?: string
  descricao?: string | null
  regraPrecificacao?: RegraPrecificacaoPizza
  ativa?: boolean
  ordem?: number
}

export interface CriarPizzaTamanhoEntrada {
  nome: string
  sigla: string
  maximoSabores: number
  ordem?: number
}

export interface AtualizarPizzaTamanhoEntrada {
  tamanhoId: string
  nome?: string
  sigla?: string
  maximoSabores?: number
  ativa?: boolean
  ordem?: number
}

export interface CriarPizzaSaborEntrada {
  nome: string
  descricao?: string
  ordem?: number
}

export interface AtualizarPizzaSaborEntrada {
  saborId: string
  nome?: string
  descricao?: string | null
  ativa?: boolean
  ordem?: number
}

export interface VincularSaborCategoriaEntrada {
  categoriaId: string
  saborId: string
  ativo?: boolean
}

export interface DefinirPrecoSaborPorTamanhoEntrada {
  saborId: string
  tamanhoId: string
  valorCentavos: number
}

export interface MontarPreviewPizzaEntrada {
  categoriaId?: string
  tamanhoId: string
  saborIds: string[]
}

export interface PreviewPizza {
  categoria: {
    id: string
    nome: string
    regraPrecificacao: RegraPrecificacaoPizza
  }
  tamanho: {
    id: string
    nome: string
    sigla: string
    maximoSabores: number
  }
  sabores: Array<{
    id: string
    nome: string
    valorCentavos: number
  }>
  valorFinalCentavos: number
}

export interface AdicionarPizzaAoPedidoEntrada {
  pedidoId: string
  categoriaId?: string
  tamanhoId: string
  saborIds: string[]
  observacao?: string
}

export interface ObterPizzaPedidoItemEntrada {
  pedidoItemId: string
}

export interface PizzaPedidoItemSaborResumo {
  id: string
  pizzaSaborId: string
  saborNomeSnapshot: string
  valorSaborSnapshotCentavos: number
  ordem: number
}

export interface PizzaPedidoItemResumo {
  id: string
  pedidoItemId: string
  pizzaCategoriaId: string
  pizzaTamanhoId: string
  regraPrecificacaoSnapshot: RegraPrecificacaoPizza
  valorCalculadoCentavos: number
  observacao: string | null
  categoriaNomeSnapshot: string
  tamanhoNomeSnapshot: string
  sabores: PizzaPedidoItemSaborResumo[]
}

/** Arredonda media de sabores para o centavo mais proximo. */
export function calcularPrecoPizzaCentavos(
  valoresCentavos: number[],
  regra: RegraPrecificacaoPizza,
): number {
  if (valoresCentavos.length === 0) {
    throw new Error('Lista de valores vazia.')
  }

  if (regra === REGRA_PRECIFICACAO_PIZZA.MAIOR_SABOR) {
    return Math.max(...valoresCentavos)
  }

  const soma = valoresCentavos.reduce((acc, valor) => acc + valor, 0)
  return Math.round(soma / valoresCentavos.length)
}

export interface SaborComCategoriasParaPrecificacao {
  valorCentavos: number
  categoriaIds: string[]
}

/** Define regra e categoria de referencia para composicao (inclui mistura de categorias). */
export function resolverRegraPrecificacaoComposicaoPizza(
  sabores: SaborComCategoriasParaPrecificacao[],
  buscarCategoria: (categoriaId: string) => PizzaCategoria | null,
): { regra: RegraPrecificacaoPizza; categoriaReferencia: PizzaCategoria } {
  const categoriasPorSabor = sabores.map((sabor) => {
    const categoriaId = sabor.categoriaIds[0]
    if (!categoriaId) {
      throw new Error('Sabor sem categoria vinculada.')
    }

    const categoria = buscarCategoria(categoriaId)
    if (!categoria) {
      throw new Error('Categoria de pizza nao encontrada.')
    }
    if (!categoria.ativa) {
      throw new Error('Categoria de pizza inativa.')
    }

    return categoria
  })

  const categoriasUnicas = new Set(categoriasPorSabor.map((categoria) => categoria.id))

  if (categoriasUnicas.size === 1) {
    const categoriaReferencia = categoriasPorSabor[0]!
    return {
      regra: categoriaReferencia.regraPrecificacao,
      categoriaReferencia,
    }
  }

  const indiceMaisCaro = sabores.reduce(
    (indiceAtual, sabor, indice) =>
      sabor.valorCentavos >= sabores[indiceAtual]!.valorCentavos ? indice : indiceAtual,
    0,
  )

  return {
    regra: REGRA_PRECIFICACAO_PIZZA.MAIOR_SABOR,
    categoriaReferencia: categoriasPorSabor[indiceMaisCaro]!,
  }
}
