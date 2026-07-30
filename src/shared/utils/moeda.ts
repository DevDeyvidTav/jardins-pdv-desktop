export function formatarMoeda(valorEmCentavos: number): string {
  const reais = valorEmCentavos / 100
  return reais.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function converterReaisParaCentavos(valorEmReais: string): number | null {
  const normalizado = valorEmReais.trim().replace(/\./g, '').replace(',', '.')

  if (normalizado === '') {
    return null
  }

  const valor = Number(normalizado)

  if (Number.isNaN(valor) || valor < 0) {
    return null
  }

  return Math.round(valor * 100)
}

export function centavosSaoValidos(valorEmCentavos: number): boolean {
  return Number.isInteger(valorEmCentavos) && valorEmCentavos >= 0
}

export function calcularDiferencaCentavos(
  saldoFinalInformadoCentavos: number,
  saldoFinalEsperadoCentavos: number,
): number {
  return saldoFinalInformadoCentavos - saldoFinalEsperadoCentavos
}
