export const TIPO_MOVIMENTO_CAIXA = {
  SUPRIMENTO: 'SUPRIMENTO',
  SANGRIA: 'SANGRIA',
  RETIRADA: 'RETIRADA',
} as const

export type TipoMovimentoCaixa =
  (typeof TIPO_MOVIMENTO_CAIXA)[keyof typeof TIPO_MOVIMENTO_CAIXA]

export const ORIGEM_MOVIMENTO_CAIXA = {
  MANUAL: 'MANUAL',
} as const

export type OrigemMovimentoCaixa =
  (typeof ORIGEM_MOVIMENTO_CAIXA)[keyof typeof ORIGEM_MOVIMENTO_CAIXA]

export interface MovimentoCaixa {
  id: string
  sessaoCaixaId: string
  tipo: TipoMovimentoCaixa
  valorCentavos: number
  descricao: string | null
  origem: OrigemMovimentoCaixa
  criadoEm: string
  atualizadoEm: string
}

export interface RegistrarMovimentoCaixaEntrada {
  tipo: TipoMovimentoCaixa
  valorCentavos: number
  descricao?: string
}

export interface ResumoCaixaAtual {
  sessao: import('./sessao-caixa').SessaoCaixa
  saldoInicialCentavos: number
  totalSuprimentosCentavos: number
  totalSangriasCentavos: number
  totalRetiradasCentavos: number
  totalVendasDinheiroCentavos: number
  totalVendasCartaoCreditoCentavos: number
  totalVendasCartaoDebitoCentavos: number
  totalVendasPixCentavos: number
  totalVendasPixMaquinetaCentavos: number
  totalVendasPixCnpjCentavos: number
  totalVendasTalaoCentavos: number
  totalRecebimentoTalaoCentavos: number
  totalVendasCentavos: number
  saldoAtualEsperadoCentavos: number
  quantidadePedidosAbertos: number
}
