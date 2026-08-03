export function calcularTotaisItemCentavos(
  quantidade: number,
  precoUnitarioCentavos: number,
  descontoCentavos: number,
): { subtotalCentavos: number; totalCentavos: number } {
  if (quantidade <= 0) {
    throw new Error('Quantidade deve ser maior que zero.')
  }
  if (precoUnitarioCentavos < 0) {
    throw new Error('Preco unitario nao pode ser negativo.')
  }
  if (descontoCentavos < 0) {
    throw new Error('Desconto do item deve ser maior ou igual a zero.')
  }

  const subtotalCentavos = quantidade * precoUnitarioCentavos

  if (descontoCentavos > subtotalCentavos) {
    throw new Error('Desconto do item nao pode ser maior que o subtotal.')
  }

  const totalCentavos = subtotalCentavos - descontoCentavos

  if (totalCentavos < 0) {
    throw new Error('Total do item nao pode ser negativo.')
  }

  return { subtotalCentavos, totalCentavos }
}

export function calcularTotaisPedido(
  subtotalCentavos: number,
  descontoItensCentavos: number,
  descontoPedidoCentavos: number,
  valorPagoCentavos: number,
  valorCortesiaCentavos: number,
): {
  subtotalCentavos: number
  descontoItensCentavos: number
  descontoPedidoCentavos: number
  totalCentavos: number
  valorRestanteCentavos: number
} {
  if (descontoItensCentavos < 0) {
    throw new Error('Desconto de itens deve ser maior ou igual a zero.')
  }
  if (descontoPedidoCentavos < 0) {
    throw new Error('Desconto do pedido deve ser maior ou igual a zero.')
  }

  const totalAntesDescontoPedidoCentavos =
    subtotalCentavos - descontoItensCentavos

  if (descontoPedidoCentavos > totalAntesDescontoPedidoCentavos) {
    throw new Error(
      'Desconto do pedido nao pode ser maior que o total apos descontos de itens.',
    )
  }

  const totalCentavos =
    totalAntesDescontoPedidoCentavos - descontoPedidoCentavos

  if (totalCentavos < 0) {
    throw new Error('Total do pedido nunca pode ser negativo.')
  }

  const valorQuitadoCentavos = valorPagoCentavos + valorCortesiaCentavos
  const valorRestanteCentavos = totalCentavos - valorQuitadoCentavos

  if (valorRestanteCentavos < 0) {
    throw new Error('Valor restante nao pode ser negativo.')
  }

  return {
    subtotalCentavos,
    descontoItensCentavos,
    descontoPedidoCentavos,
    totalCentavos,
    valorRestanteCentavos,
  }
}

/** Versão estendida que inclui taxa de entrega no total. */
export function calcularTotaisPedidoComTaxa(
  subtotalCentavos: number,
  descontoItensCentavos: number,
  descontoPedidoCentavos: number,
  taxaEntregaCentavos: number,
  valorPagoCentavos: number,
  valorCortesiaCentavos: number,
): {
  subtotalCentavos: number
  descontoItensCentavos: number
  descontoPedidoCentavos: number
  taxaEntregaCentavos: number
  totalCentavos: number
  valorRestanteCentavos: number
} {
  if (descontoItensCentavos < 0) {
    throw new Error('Desconto de itens deve ser maior ou igual a zero.')
  }
  if (descontoPedidoCentavos < 0) {
    throw new Error('Desconto do pedido deve ser maior ou igual a zero.')
  }
  if (taxaEntregaCentavos < 0) {
    throw new Error('Taxa de entrega deve ser maior ou igual a zero.')
  }

  const subtotalLiquido = subtotalCentavos - descontoItensCentavos

  if (descontoPedidoCentavos > subtotalLiquido) {
    throw new Error(
      'Desconto do pedido nao pode ser maior que o total apos descontos de itens.',
    )
  }

  const totalCentavos = subtotalLiquido - descontoPedidoCentavos + taxaEntregaCentavos

  if (totalCentavos < 0) {
    throw new Error('Total do pedido nunca pode ser negativo.')
  }

  const valorQuitadoCentavos = valorPagoCentavos + valorCortesiaCentavos
  const valorRestanteCentavos = totalCentavos - valorQuitadoCentavos

  if (valorRestanteCentavos < 0) {
    throw new Error('Valor restante nao pode ser negativo.')
  }

  return {
    subtotalCentavos,
    descontoItensCentavos,
    descontoPedidoCentavos,
    taxaEntregaCentavos,
    totalCentavos,
    valorRestanteCentavos,
  }
}
