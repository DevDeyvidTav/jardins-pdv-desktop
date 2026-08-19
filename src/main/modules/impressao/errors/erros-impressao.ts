export const CODIGOS_ERRO_IMPRESSAO = {
  ENTRADA_INVALIDA: 'ENTRADA_INVALIDA',
  SETOR_OBRIGATORIO: 'SETOR_OBRIGATORIO',
  FALHA_ENVIO_IMPRESSORA: 'FALHA_ENVIO_IMPRESSORA',
  PEDIDO_NAO_ENCONTRADO: 'PEDIDO_NAO_ENCONTRADO',
  PEDIDO_SEM_ITENS: 'PEDIDO_SEM_ITENS',
} as const

export type CodigoErroImpressao =
  (typeof CODIGOS_ERRO_IMPRESSAO)[keyof typeof CODIGOS_ERRO_IMPRESSAO]

export class ErroImpressao extends Error {
  readonly codigo: CodigoErroImpressao

  constructor(codigo: CodigoErroImpressao, mensagem: string) {
    super(mensagem)
    this.name = 'ErroImpressao'
    this.codigo = codigo
  }
}
