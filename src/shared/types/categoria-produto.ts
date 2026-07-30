export interface CategoriaProduto {
  id: string
  nome: string
  descricao: string | null
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
}

export interface CriarCategoriaProdutoEntrada {
  nome: string
  descricao?: string
}

export interface AtualizarCategoriaProdutoEntrada {
  categoriaId: string
  nome?: string
  descricao?: string | null
}

export interface InativarCategoriaProdutoEntrada {
  categoriaId: string
}

export interface ReativarCategoriaProdutoEntrada {
  categoriaId: string
}

export interface ListarCategoriasProdutoEntrada {
  apenasAtivas?: boolean
}
