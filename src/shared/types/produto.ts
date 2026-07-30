export interface Produto {
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

export interface CriarProdutoEntrada {
  categoriaId: string
  nome: string
  descricao?: string
  precoCentavos: number
}

export interface AtualizarProdutoEntrada {
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
