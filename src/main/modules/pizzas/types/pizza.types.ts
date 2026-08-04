export type {
  PizzaCategoria,
  PizzaTamanho,
  PizzaSabor,
  PizzaSaborPreco,
  PizzaPedidoItemResumo,
  PizzaPedidoItemSaborResumo,
  PreviewPizza,
  CriarPizzaCategoriaEntrada,
  AtualizarPizzaCategoriaEntrada,
  CriarPizzaTamanhoEntrada,
  AtualizarPizzaTamanhoEntrada,
  CriarPizzaSaborEntrada,
  AtualizarPizzaSaborEntrada,
  VincularSaborCategoriaEntrada,
  DefinirPrecoSaborPorTamanhoEntrada,
  MontarPreviewPizzaEntrada,
  AdicionarPizzaAoPedidoEntrada,
  ObterPizzaPedidoItemEntrada,
  RegraPrecificacaoPizza,
} from '@shared/types/pizza'

export interface LinhaPizzaCategoriaSql {
  id: string
  nome: string
  descricao: string | null
  regra_precificacao: string
  ativa: number
  ordem: number
  criado_em: string
  atualizado_em: string
}

export interface LinhaPizzaTamanhoSql {
  id: string
  nome: string
  sigla: string
  maximo_sabores: number
  ativa: number
  ordem: number
  criado_em: string
  atualizado_em: string
}

export interface LinhaPizzaSaborSql {
  id: string
  nome: string
  descricao: string | null
  ativa: number
  ordem: number
  criado_em: string
  atualizado_em: string
}

export interface LinhaPizzaCategoriaSaborSql {
  pizza_categoria_id: string
  pizza_sabor_id: string
  ativo: number
  criado_em: string
}

export interface LinhaPizzaSaborPrecoSql {
  id: string
  pizza_sabor_id: string
  pizza_tamanho_id: string
  valor_centavos: number
  ativo: number
  criado_em: string
  atualizado_em: string
}

export interface LinhaPizzaPedidoItemSql {
  id: string
  pedido_item_id: string
  pizza_categoria_id: string
  pizza_tamanho_id: string
  regra_precificacao_snapshot: string
  valor_calculado_centavos: number
  observacao: string | null
  categoria_nome_snapshot: string
  tamanho_nome_snapshot: string
  criado_em: string
  atualizado_em: string
}

export interface LinhaPizzaPedidoItemSaborSql {
  id: string
  pizza_pedido_item_id: string
  pizza_sabor_id: string
  sabor_nome_snapshot: string
  valor_sabor_snapshot_centavos: number
  ordem: number
  criado_em: string
}

const COLUNAS_PIZZA_CATEGORIA = `
  id, nome, descricao, regra_precificacao, ativa, ordem, criado_em, atualizado_em
`.trim()

const COLUNAS_PIZZA_TAMANHO = `
  id, nome, sigla, maximo_sabores, ativa, ordem, criado_em, atualizado_em
`.trim()

const COLUNAS_PIZZA_SABOR = `
  id, nome, descricao, ativa, ordem, criado_em, atualizado_em
`.trim()

const COLUNAS_PIZZA_SABOR_PRECO = `
  id, pizza_sabor_id, pizza_tamanho_id, valor_centavos, ativo, criado_em, atualizado_em
`.trim()

const COLUNAS_PIZZA_PEDIDO_ITEM = `
  id, pedido_item_id, pizza_categoria_id, pizza_tamanho_id,
  regra_precificacao_snapshot, valor_calculado_centavos, observacao,
  categoria_nome_snapshot, tamanho_nome_snapshot, criado_em, atualizado_em
`.trim()

const COLUNAS_PIZZA_PEDIDO_ITEM_SABOR = `
  id, pizza_pedido_item_id, pizza_sabor_id, sabor_nome_snapshot,
  valor_sabor_snapshot_centavos, ordem, criado_em
`.trim()

export function obterColunasPizzaCategoria(): string {
  return COLUNAS_PIZZA_CATEGORIA
}

export function obterColunasPizzaTamanho(): string {
  return COLUNAS_PIZZA_TAMANHO
}

export function obterColunasPizzaSabor(alias?: string): string {
  if (!alias) {
    return COLUNAS_PIZZA_SABOR
  }

  return COLUNAS_PIZZA_SABOR.split(',')
    .map((coluna) => `${alias}.${coluna.trim()}`)
    .join(', ')
}

export function obterColunasPizzaSaborPreco(): string {
  return COLUNAS_PIZZA_SABOR_PRECO
}

export function obterColunasPizzaPedidoItem(): string {
  return COLUNAS_PIZZA_PEDIDO_ITEM
}

export function obterColunasPizzaPedidoItemSabor(): string {
  return COLUNAS_PIZZA_PEDIDO_ITEM_SABOR
}

export function mapearLinhaPizzaCategoria(
  linha: LinhaPizzaCategoriaSql,
): import('@shared/types/pizza').PizzaCategoria {
  return {
    id: linha.id,
    nome: linha.nome,
    descricao: linha.descricao,
    regraPrecificacao:
      linha.regra_precificacao as import('@shared/types/pizza').RegraPrecificacaoPizza,
    ativa: linha.ativa === 1,
    ordem: Number(linha.ordem) || 0,
    criadoEm: linha.criado_em,
    atualizadoEm: linha.atualizado_em,
  }
}

export function mapearLinhaPizzaTamanho(
  linha: LinhaPizzaTamanhoSql,
): import('@shared/types/pizza').PizzaTamanho {
  return {
    id: linha.id,
    nome: linha.nome,
    sigla: linha.sigla,
    maximoSabores: Number(linha.maximo_sabores) || 0,
    ativa: linha.ativa === 1,
    ordem: Number(linha.ordem) || 0,
    criadoEm: linha.criado_em,
    atualizadoEm: linha.atualizado_em,
  }
}

export function mapearLinhaPizzaSabor(
  linha: LinhaPizzaSaborSql,
): import('@shared/types/pizza').PizzaSabor {
  return {
    id: linha.id,
    nome: linha.nome,
    descricao: linha.descricao,
    ativa: linha.ativa === 1,
    ordem: Number(linha.ordem) || 0,
    criadoEm: linha.criado_em,
    atualizadoEm: linha.atualizado_em,
  }
}

export function mapearLinhaPizzaSaborPreco(
  linha: LinhaPizzaSaborPrecoSql,
): import('@shared/types/pizza').PizzaSaborPreco {
  return {
    id: linha.id,
    pizzaSaborId: linha.pizza_sabor_id,
    pizzaTamanhoId: linha.pizza_tamanho_id,
    valorCentavos: Number(linha.valor_centavos) || 0,
    ativo: linha.ativo === 1,
    criadoEm: linha.criado_em,
    atualizadoEm: linha.atualizado_em,
  }
}

export function mapearLinhaPizzaPedidoItemSabor(
  linha: LinhaPizzaPedidoItemSaborSql,
): import('@shared/types/pizza').PizzaPedidoItemSaborResumo {
  return {
    id: linha.id,
    pizzaSaborId: linha.pizza_sabor_id,
    saborNomeSnapshot: linha.sabor_nome_snapshot,
    valorSaborSnapshotCentavos: Number(linha.valor_sabor_snapshot_centavos) || 0,
    ordem: Number(linha.ordem) || 0,
  }
}

export function mapearLinhaPizzaPedidoItem(
  linha: LinhaPizzaPedidoItemSql,
  sabores: import('@shared/types/pizza').PizzaPedidoItemSaborResumo[] = [],
): import('@shared/types/pizza').PizzaPedidoItemResumo {
  return {
    id: linha.id,
    pedidoItemId: linha.pedido_item_id,
    pizzaCategoriaId: linha.pizza_categoria_id,
    pizzaTamanhoId: linha.pizza_tamanho_id,
    regraPrecificacaoSnapshot:
      linha.regra_precificacao_snapshot as import('@shared/types/pizza').RegraPrecificacaoPizza,
    valorCalculadoCentavos: Number(linha.valor_calculado_centavos) || 0,
    observacao: linha.observacao,
    categoriaNomeSnapshot: linha.categoria_nome_snapshot,
    tamanhoNomeSnapshot: linha.tamanho_nome_snapshot,
    sabores,
  }
}
