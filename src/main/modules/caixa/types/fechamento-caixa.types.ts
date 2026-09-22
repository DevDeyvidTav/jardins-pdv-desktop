export type {
  FecharSessaoCaixaEntrada,
} from '@shared/types/sessao-caixa'

export interface TotaisMovimentosCaixa {
  totalSuprimentosCentavos: number
  totalRetiradasCentavos: number
}

export function calcularSaldoEsperadoCentavos(
  saldoInicialCentavos: number,
  totais: TotaisMovimentosCaixa,
): number {
  return (
    saldoInicialCentavos +
    totais.totalSuprimentosCentavos -
    totais.totalRetiradasCentavos
  )
}

export function calcularDiferencaCentavos(
  saldoFinalInformadoCentavos: number,
  saldoFinalEsperadoCentavos: number,
): number {
  return saldoFinalInformadoCentavos - saldoFinalEsperadoCentavos
}
