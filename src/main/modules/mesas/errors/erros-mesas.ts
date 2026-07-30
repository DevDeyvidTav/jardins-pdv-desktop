export const CODIGOS_ERRO_MESAS = {
  NUMERO_OBRIGATORIO: 'NUMERO_OBRIGATORIO',
  INTERVALO_INVALIDO: 'INTERVALO_INVALIDO',
  MESA_NAO_ENCONTRADA: 'MESA_NAO_ENCONTRADA',
  ENTRADA_INVALIDA: 'ENTRADA_INVALIDA',
} as const

export type CodigoErroMesas = (typeof CODIGOS_ERRO_MESAS)[keyof typeof CODIGOS_ERRO_MESAS]

export class ErroMesas extends Error {
  readonly codigo: CodigoErroMesas

  constructor(codigo: CodigoErroMesas, mensagem: string) {
    super(mensagem)
    this.name = 'ErroMesas'
    this.codigo = codigo
  }
}
