export const CODIGOS_ERRO_CONFIGURACOES = {
  ENTRADA_INVALIDA: 'CONFIGURACOES_ENTRADA_INVALIDA',
  CATEGORIA_NAO_ENCONTRADA: 'CONFIGURACOES_CATEGORIA_NAO_ENCONTRADA',
  OPERADOR_NAO_CONFIGURADO: 'CONFIGURACOES_OPERADOR_NAO_CONFIGURADO',
  PIN_INVALIDO: 'CONFIGURACOES_PIN_INVALIDO',
  SESSAO_NAO_AUTENTICADA: 'CONFIGURACOES_SESSAO_NAO_AUTENTICADA',
  SEM_PERMISSAO: 'CONFIGURACOES_SEM_PERMISSAO',
} as const

export type CodigoErroConfiguracoes =
  (typeof CODIGOS_ERRO_CONFIGURACOES)[keyof typeof CODIGOS_ERRO_CONFIGURACOES]

export class ErroConfiguracoes extends Error {
  constructor(
    public readonly codigo: CodigoErroConfiguracoes,
    mensagem: string,
  ) {
    super(mensagem)
    this.name = 'ErroConfiguracoes'
  }
}
