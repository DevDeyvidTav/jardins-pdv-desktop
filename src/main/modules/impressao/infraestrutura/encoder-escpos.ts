const ESC = 0x1b

/** PC850 multilingual — default da MP-4200 apos ESC t, cobre acentos do pt-BR. */
const CODEPAGE_PC850 = 2

/** Linhas em branco antes do corte — evita papel preso na MP-4200. */
export const LINHAS_AVANCO_CUPOM = 5

const MAPA_CP850: Record<string, number> = {
  Ç: 0x80,
  ü: 0x81,
  é: 0x82,
  â: 0x83,
  ä: 0x84,
  à: 0x85,
  ç: 0x87,
  ê: 0x88,
  ë: 0x89,
  è: 0x8a,
  É: 0x90,
  ô: 0x93,
  ö: 0x94,
  ò: 0x95,
  û: 0x96,
  ù: 0x97,
  Ö: 0x99,
  Ü: 0x9a,
  á: 0xa0,
  í: 0xa1,
  ó: 0xa2,
  ú: 0xa3,
  Á: 0xb5,
  Â: 0xb6,
  ã: 0xc6,
  Ã: 0xc7,
  Í: 0xd6,
  Ó: 0xe0,
  Ô: 0xe2,
  õ: 0xe4,
  Õ: 0xe5,
  Ú: 0xe9,
}

export function codificarTextoTermica(texto: string): Buffer {
  const bytes = new Uint8Array(texto.length)
  for (let indice = 0; indice < texto.length; indice += 1) {
    const caractere = texto[indice]!
    const codigo = caractere.charCodeAt(0)
    bytes[indice] =
      MAPA_CP850[caractere] ?? (codigo <= 0x7f ? codigo : 0x3f)
  }
  return Buffer.from(bytes)
}

export function montarFinalizacaoCupomEscPos(): Buffer {
  return Buffer.concat([
    Buffer.from('\n'.repeat(LINHAS_AVANCO_CUPOM), 'latin1'),
    Buffer.from([ESC, 0x69]),
  ])
}

export function codificarCupomEscPos(linhas: string[]): Buffer {
  const partes: Buffer[] = [
    Buffer.from([ESC, 0x40]),
    Buffer.from([ESC, 0x74, CODEPAGE_PC850]),
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
      partes.push(codificarTextoTermica(`${linha.trim()}\n`))
      partes.push(Buffer.from([ESC, 0x21, 0x00]))
      continue
    }

    partes.push(codificarTextoTermica(`${linha}\n`))
  }

  partes.push(montarFinalizacaoCupomEscPos())

  return Buffer.concat(partes)
}

/**
 * A MP-4200 TH nao imprime QR: ignora GS (k (firmware antigo), trava o USB
 * com bitmap (ESC * / GS v 0) e a fonte interna subpreenche os blocos de
 * texto (~50% de gap, ilegivel). O DANFE sai com chave + URL de consulta;
 * QR so via driver do Windows ou atualizacao de firmware.
 */
export function codificarCupomEscPosComQr(linhas: string[], _qr?: string | null): Buffer {
  const partes: Buffer[] = [
    Buffer.from([ESC, 0x40]),
    Buffer.from([ESC, 0x74, CODEPAGE_PC850]),
    Buffer.from([ESC, 0x61, 0x00]),
  ]

  for (const linha of linhas) {
    if (linha.trim() === '{QR}') {
      // MP-4200 TH nao imprime QR — ver nota acima.
      continue
    }

    partes.push(codificarTextoTermica(`${linha}\n`))
  }

  partes.push(montarFinalizacaoCupomEscPos())
  return Buffer.concat(partes)
}
