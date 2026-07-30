export type {
  CategoriaProduto,
  CriarCategoriaProdutoEntrada,
  AtualizarCategoriaProdutoEntrada,
  InativarCategoriaProdutoEntrada,
  ListarCategoriasProdutoEntrada,
} from '@shared/types/categoria-produto'

export type {
  Produto,
  ProdutoComCategoria,
  CriarProdutoEntrada,
  AtualizarProdutoEntrada,
  ListarProdutosEntrada,
  BuscarProdutosEntrada,
  InativarProdutoEntrada,
  ObterProdutoPorIdEntrada,
} from '@shared/types/produto'

export interface LinhaCategoriaProdutoSql {
  id: string
  nome: string
  descricao: string | null
  ativo: number
  criado_em: string
  atualizado_em: string
}

export interface LinhaProdutoSql {
  id: string
  categoria_id: string
  nome: string
  descricao: string | null
  preco_centavos: number
  ativo: number
  criado_em: string
  atualizado_em: string
}

export interface LinhaProdutoComCategoriaSql extends LinhaProdutoSql {
  categoria_nome: string
}

const COLUNAS_CATEGORIA_PRODUTO = `
  id, nome, descricao, ativo, criado_em, atualizado_em
`.trim()

const COLUNAS_PRODUTO = `
  id, categoria_id, nome, descricao, preco_centavos, ativo, criado_em, atualizado_em
`.trim()

export function obterColunasCategoriaProduto(): string {
  return COLUNAS_CATEGORIA_PRODUTO
}

export function obterColunasProduto(): string {
  return COLUNAS_PRODUTO
}

export function mapearLinhaCategoriaProduto(
  linha: LinhaCategoriaProdutoSql,
): import('@shared/types/categoria-produto').CategoriaProduto {
  return {
    id: linha.id,
    nome: linha.nome,
    descricao: linha.descricao,
    ativo: linha.ativo === 1,
    criadoEm: linha.criado_em,
    atualizadoEm: linha.atualizado_em,
  }
}

export function mapearLinhaProduto(
  linha: LinhaProdutoSql,
): import('@shared/types/produto').Produto {
  return {
    id: linha.id,
    categoriaId: linha.categoria_id,
    nome: linha.nome,
    descricao: linha.descricao,
    precoCentavos: linha.preco_centavos,
    ativo: linha.ativo === 1,
    criadoEm: linha.criado_em,
    atualizadoEm: linha.atualizado_em,
  }
}

export function mapearLinhaProdutoComCategoria(
  linha: LinhaProdutoComCategoriaSql,
): import('@shared/types/produto').ProdutoComCategoria {
  return {
    ...mapearLinhaProduto(linha),
    categoriaNome: linha.categoria_nome,
  }
}
