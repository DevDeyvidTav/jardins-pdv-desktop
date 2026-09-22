import { encode } from 'uqr'

const ESC = 0x1b
const GS = 0x1d

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
 * 203 dpi da MP-4200: 25 mm legais ≈ 200 pontos. Usamos 208 (~26 mm) e quiet zone
 * de 4 modulos. O comando nativo GS k Q e ignorado neste firmware (imprime a URL
 * como texto); GS v 0 (raster) e o caminho que a impressora realmente desenha.
 */
const PIXELS_MINIMOS_QR_NFCE = 208
const BORDA_QR_MODULOS = 4

function empacotarRasterMonocromatico(pixels: boolean[][]): Buffer {
  const altura = pixels.length
  const largura = pixels[0]?.length ?? 0
  const bytesPorLinha = Math.ceil(largura / 8)
  const raster = Buffer.alloc(bytesPorLinha * altura)

  for (let y = 0; y < altura; y += 1) {
    const linha = pixels[y] ?? []
    for (let x = 0; x < largura; x += 1) {
      if (!linha[x]) {
        continue
      }
      const offset = y * bytesPorLinha + (x >> 3)
      raster[offset] = (raster[offset] ?? 0) | (0x80 >> (x & 7))
    }
  }

  return raster
}

function ampliarMatrizQr(matriz: boolean[][], escala: number): boolean[][] {
  const origem = matriz.length
  const destino = origem * escala
  const pixels: boolean[][] = Array.from({ length: destino }, () =>
    Array.from({ length: destino }, () => false),
  )

  for (let y = 0; y < origem; y += 1) {
    const linha = matriz[y] ?? []
    for (let x = 0; x < origem; x += 1) {
      if (!linha[x]) {
        continue
      }
      for (let dy = 0; dy < escala; dy += 1) {
        for (let dx = 0; dx < escala; dx += 1) {
          pixels[y * escala + dy]![x * escala + dx] = true
        }
      }
    }
  }

  return pixels
}

export function montarComandoQrRaster(conteudo: string): Buffer {
  const qr = encode(conteudo, { ecc: 'M', border: BORDA_QR_MODULOS })
  const escala = Math.max(4, Math.ceil(PIXELS_MINIMOS_QR_NFCE / qr.size))
  const pixels = ampliarMatrizQr(qr.data, escala)
  const altura = pixels.length
  const bytesPorLinha = Math.ceil((pixels[0]?.length ?? 0) / 8)
  const raster = empacotarRasterMonocromatico(pixels)

  return Buffer.concat([
    Buffer.from([ESC, 0x61, 0x01]),
    Buffer.from([
      GS,
      0x76,
      0x30,
      0x00,
      bytesPorLinha & 0xff,
      (bytesPorLinha >> 8) & 0xff,
      altura & 0xff,
      (altura >> 8) & 0xff,
    ]),
    raster,
    Buffer.from('\n\n', 'latin1'),
    Buffer.from([ESC, 0x61, 0x00]),
  ])
}

export function codificarCupomEscPosComQr(linhas: string[], qr?: string | null): Buffer {
  const partes: Buffer[] = [
    Buffer.from([ESC, 0x40]),
    Buffer.from([ESC, 0x74, CODEPAGE_PC850]),
    Buffer.from([ESC, 0x61, 0x00]),
  ]

  for (const linha of linhas) {
    if (linha.trim() === '{QR}') {
      const conteudo = qr?.trim()
      if (conteudo) {
        partes.push(montarComandoQrRaster(conteudo))
      }
      continue
    }

    partes.push(codificarTextoTermica(`${linha}\n`))
  }

  partes.push(montarFinalizacaoCupomEscPos())
  return Buffer.concat(partes)
}
