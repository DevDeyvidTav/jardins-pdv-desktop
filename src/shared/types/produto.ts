export interface DadosFiscaisProduto {
  fiscalNcm: string | null
  fiscalCest: string | null
  fiscalCfop: string
  fiscalIcmsOrigem: number
  fiscalIcmsCsosn: string
  fiscalPisCst: string
  fiscalCofinsCst: string
  fiscalAliquotaNacional: number | null
}

export type DadosFiscaisProdutoEntrada = Partial<DadosFiscaisProduto>

export interface Produto extends DadosFiscaisProduto {
  id: string
  categoriaId: string
  nome: string
  descricao: string | null
  precoCentavos: number
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
}

export interface ProdutoComCategoria extends Produto {
  categoriaNome: string
}

export interface CriarProdutoEntrada extends DadosFiscaisProdutoEntrada {
  categoriaId: string
  nome: string
  descricao?: string
  precoCentavos: number
}

export interface AtualizarProdutoEntrada extends DadosFiscaisProdutoEntrada {
  produtoId: string
  categoriaId?: string
  nome?: string
  descricao?: string | null
  precoCentavos?: number
}

export interface ListarProdutosEntrada {
  categoriaId?: string
  apenasAtivos?: boolean
}

export interface BuscarProdutosEntrada {
  termo: string
  categoriaId?: string
  apenasAtivos?: boolean
}

export interface InativarProdutoEntrada {
  produtoId: string
}

export interface ReativarProdutoEntrada {
  produtoId: string
}

export interface ObterProdutoPorIdEntrada {
  produtoId: string
}

export interface ExcluirProdutoEntrada {
  produtoId: string
}

/** Hard delete quando seguro; soft delete (inativacao) quando o item ja esta em uso. */
export type ResultadoRemocaoCatalogo = {
  modo: 'EXCLUIDO' | 'INATIVADO'
}

export type SalvarProdutoFormulario = {
  categoriaId: string
  nome: string
  precoCentavos: number
  descricao?: string
} & DadosFiscaisProdutoEntrada
