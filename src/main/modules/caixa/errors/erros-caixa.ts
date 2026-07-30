export const CODIGOS_ERRO_CAIXA = {
  CAIXA_JA_ABERTO: 'CAIXA_JA_ABERTO',
  SALDO_INICIAL_INVALIDO: 'SALDO_INICIAL_INVALIDO',
  ENTRADA_INVALIDA: 'ENTRADA_INVALIDA',
} as const

export type CodigoErroCaixa =
  (typeof CODIGOS_ERRO_CAIXA)[keyof typeof CODIGOS_ERRO_CAIXA]

export class ErroCaixa extends Error {
  readonly codigo: CodigoErroCaixa

  constructor(codigo: CodigoErroCaixa, mensagem: string) {
    super(mensagem)
    this.name = 'ErroCaixa'
    this.codigo = codigo
  }
}
