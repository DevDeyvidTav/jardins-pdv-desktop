import { describe, expect, it } from 'vitest'
import {
  LINHAS_AVANCO_CUPOM,
  codificarCupomEscPos,
  codificarCupomEscPosComQr,
  codificarTextoTermica,
  montarComandoQrRaster,
  montarFinalizacaoCupomEscPos,
} from '../../../src/main/modules/impressao/infraestrutura/encoder-escpos'

describe('encoder ESC/POS', () => {
  it('inicia, destaca o setor e finaliza com avanco e corte Bematech', () => {
    const buffer = codificarCupomEscPos(['          PIZZA', 'Mesa 12'])

    expect(buffer[0]).toBe(0x1b)
    expect(buffer[1]).toBe(0x40)
    expect(buffer.includes(Buffer.from([0x1b, 0x74, 0x02]))).toBe(true)
    expect(buffer.includes(Buffer.from('Mesa 12', 'latin1'))).toBe(true)
    expect(buffer.subarray(-7).equals(montarFinalizacaoCupomEscPos())).toBe(true)
  })

  it('usa linhas em branco e corte ESC i compativel com a MP-4200', () => {
    const finalizacao = montarFinalizacaoCupomEscPos()

    expect(finalizacao.equals(
      Buffer.concat([
        Buffer.from('\n'.repeat(LINHAS_AVANCO_CUPOM), 'latin1'),
        Buffer.from([0x1b, 0x69]),
      ]),
    )).toBe(true)
  })

  it('insere o QR como imagem raster GS v 0 no DANFE', () => {
    const url = 'https://sehomolog.sefaz.pe.gov.br/nfce/consulta?p=26160950681762000179650010000000011000000010'
    const cupom = codificarCupomEscPosComQr(['DANFE', '{QR}'], url)
    const comando = montarComandoQrRaster(url)

    expect(cupom.includes(Buffer.from('DANFE', 'latin1'))).toBe(true)
    expect(cupom.includes(Buffer.from([0x1d, 0x76, 0x30, 0x00]))).toBe(true)
    expect(cupom.includes(comando.subarray(3, 11))).toBe(true)
    expect(cupom.includes(Buffer.from(url, 'utf8'))).toBe(false)
    expect(comando.length).toBeGreaterThan(200)
  })

  it('converte acentos para CP850 em vez de latin1', () => {
    const buffer = codificarTextoTermica('Rúcula Camarão')
    expect(buffer.includes(0xa3)).toBe(true)
    expect(buffer.includes(0xc6)).toBe(true)
    expect(buffer.includes(0xfa)).toBe(false)
  })
})
