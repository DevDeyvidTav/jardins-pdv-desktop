const ESC = 0x1b

/** Linhas em branco antes do corte — evita papel preso na MP-4200. */
export const LINHAS_AVANCO_CUPOM = 5

export function montarFinalizacaoCupomEscPos(): Buffer {
  return Buffer.concat([
    Buffer.from('\n'.repeat(LINHAS_AVANCO_CUPOM), 'latin1'),
    Buffer.from([ESC, 0x69]),
  ])
}

export function codificarCupomEscPos(linhas: string[]): Buffer {
  const partes: Buffer[] = [
    Buffer.from([ESC, 0x40]),
    Buffer.from([ESC, 0x61, 0x00]),
  ]

  for (const linha of linhas) {
    const destaqueSetor =
      linha.trim() === 'PIZZA' ||
      linha.trim() === 'JAPONESA' ||
      linha.trim() === 'CHINESA' ||
      linha.trim() === 'COZINHA' ||
      linha.trim() === 'CONTA'

    if (destaqueSetor) {
      partes.push(Buffer.from([ESC, 0x21, 0x30]))
      partes.push(Buffer.from(`${linha.trim()}\n`, 'latin1'))
      partes.push(Buffer.from([ESC, 0x21, 0x00]))
      continue
    }

    partes.push(Buffer.from(`${linha}\n`, 'latin1'))
  }

  partes.push(montarFinalizacaoCupomEscPos())

  return Buffer.concat(partes)
}
