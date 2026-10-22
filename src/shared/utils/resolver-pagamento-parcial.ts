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
