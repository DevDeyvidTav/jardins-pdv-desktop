import { calcularTrocoDinheiro } from './troco-dinheiro'

/** Um unico valor em dinheiro: menor que o restante vira parcial, maior vira troco. */
export function resolverValorDinheiro(entrada: {
  valorDigitadoCentavos: number
  restanteCentavos: number
}): { valorCentavos: number; valorRecebidoCentavos?: number; trocoCentavos: number } {
  const valorCentavos = Math.min(entrada.valorDigitadoCentavos, entrada.restanteCentavos)
  const comTroco = entrada.valorDigitadoCentavos > entrada.restanteCentavos

  return {
    valorCentavos,
    valorRecebidoCentavos: comTroco ? entrada.valorDigitadoCentavos : undefined,
    trocoCentavos: comTroco
      ? calcularTrocoDinheiro(entrada.restanteCentavos, entrada.valorDigitadoCentavos)
      : 0,
  }
}

export function resolverPagamentoParcial(entrada: {
  valorDigitadoCentavos: number
  valorRecebidoCentavos: number | null
  restanteCentavos: number
  ehDinheiro: boolean
}): { valorCentavos: number; valorRecebidoCentavos?: number } {
  let valorCentavos = entrada.valorDigitadoCentavos
  let valorRecebidoCentavos: number | undefined

  if (entrada.ehDinheiro && entrada.valorRecebidoCentavos != null) {
    if (entrada.valorRecebidoCentavos < valorCentavos) {
      valorCentavos = entrada.valorRecebidoCentavos
    } else {
      valorRecebidoCentavos = entrada.valorRecebidoCentavos
    }
  }

  return { valorCentavos, valorRecebidoCentavos }
}
