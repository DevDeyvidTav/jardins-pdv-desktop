export const CODIGOS_ERRO_PRODUTOS = {
  NOME_OBRIGATORIO: 'NOME_OBRIGATORIO',
  PRECO_INVALIDO: 'PRECO_INVALIDO',
  CATEGORIA_NAO_ENCONTRADA: 'CATEGORIA_NAO_ENCONTRADA',
  CATEGORIA_INATIVA: 'CATEGORIA_INATIVA',
  PRODUTO_NAO_ENCONTRADO: 'PRODUTO_NAO_ENCONTRADO',
  ENTRADA_INVALIDA: 'ENTRADA_INVALIDA',
} as const

export type CodigoErroProdutos =
  (typeof CODIGOS_ERRO_PRODUTOS)[keyof typeof CODIGOS_ERRO_PRODUTOS]

export class ErroProdutos extends Error {
  readonly codigo: CodigoErroProdutos

  constructor(codigo: CodigoErroProdutos, mensagem: string) {
    super(mensagem)
    this.name = 'ErroProdutos'
    this.codigo = codigo
  }
}
