export const CODIGOS_ERRO_CAIXA = {
  CAIXA_JA_ABERTO: 'CAIXA_JA_ABERTO',
  CAIXA_NAO_ABERTO: 'CAIXA_NAO_ABERTO',
  CAIXA_JA_FECHADO: 'CAIXA_JA_FECHADO',
  SALDO_INICIAL_INVALIDO: 'SALDO_INICIAL_INVALIDO',
  SALDO_FINAL_INVALIDO: 'SALDO_FINAL_INVALIDO',
  VALOR_MOVIMENTO_INVALIDO: 'VALOR_MOVIMENTO_INVALIDO',
  DESCRICAO_OBRIGATORIA: 'DESCRICAO_OBRIGATORIA',
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
