export function calcularTotalItemCentavos(
  quantidade: number,
  precoUnitarioCentavos: number,
): number {
  return quantidade * precoUnitarioCentavos
}

export function calcularTotaisPedido(
  subtotalCentavos: number,
  descontoCentavos: number,
): { subtotalCentavos: number; totalCentavos: number } {
  return {
    subtotalCentavos,
    totalCentavos: subtotalCentavos - descontoCentavos,
  }
}
