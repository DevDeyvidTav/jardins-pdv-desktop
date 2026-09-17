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
  setor_impressao: string | null
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
  fiscal_ncm: string | null
  fiscal_cest: string | null
  fiscal_cfop: string
  fiscal_icms_origem: number
  fiscal_icms_csosn: string
  fiscal_pis_cst: string
  fiscal_cofins_cst: string
  fiscal_aliquota_nacional: number | null
  ativo: number
  criado_em: string
  atualizado_em: string
}

export interface LinhaProdutoComCategoriaSql extends LinhaProdutoSql {
  categoria_nome: string
}

const COLUNAS_CATEGORIA_PRODUTO = `
  id, nome, descricao, setor_impressao, ativo, criado_em, atualizado_em
`.trim()

const COLUNAS_PRODUTO = `
  id, categoria_id, nome, descricao, preco_centavos,
  fiscal_ncm, fiscal_cest, fiscal_cfop, fiscal_icms_origem, fiscal_icms_csosn,
  fiscal_pis_cst, fiscal_cofins_cst, fiscal_aliquota_nacional,
  ativo, criado_em, atualizado_em
`.trim()

export function obterColunasCategoriaProduto(): string {
  return COLUNAS_CATEGORIA_PRODUTO
}

export function obterColunasProduto(prefixo = ''): string {
  return COLUNAS_PRODUTO.split(',')
    .map((coluna) => `${prefixo}${coluna.trim()}`)
    .join(', ')
}

function mapearDadosFiscaisSql(
  linha: Pick<
    LinhaProdutoSql,
    | 'fiscal_ncm'
    | 'fiscal_cest'
    | 'fiscal_cfop'
    | 'fiscal_icms_origem'
    | 'fiscal_icms_csosn'
    | 'fiscal_pis_cst'
    | 'fiscal_cofins_cst'
    | 'fiscal_aliquota_nacional'
  >,
): import('@shared/types/produto').DadosFiscaisProduto {
  return {
    fiscalNcm: linha.fiscal_ncm,
    fiscalCest: linha.fiscal_cest,
    fiscalCfop: linha.fiscal_cfop,
    fiscalIcmsOrigem: Number(linha.fiscal_icms_origem),
    fiscalIcmsCsosn: linha.fiscal_icms_csosn,
    fiscalPisCst: linha.fiscal_pis_cst,
    fiscalCofinsCst: linha.fiscal_cofins_cst,
    fiscalAliquotaNacional:
      linha.fiscal_aliquota_nacional === null || linha.fiscal_aliquota_nacional === undefined
        ? null
        : Number(linha.fiscal_aliquota_nacional),
  }
}

export function mapearLinhaCategoriaProduto(
  linha: LinhaCategoriaProdutoSql,
): import('@shared/types/categoria-produto').CategoriaProduto {
  return {
    id: linha.id,
    nome: linha.nome,
    descricao: linha.descricao,
    setorImpressao: linha.setor_impressao as import('@shared/types/config-impressora').SetorImpressao | null,
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
    ...mapearDadosFiscaisSql(linha),
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
