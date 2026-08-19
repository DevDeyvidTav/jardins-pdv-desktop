import { describe, expect, it } from 'vitest'
import {
  LINHAS_AVANCO_CUPOM,
  codificarCupomEscPos,
  montarFinalizacaoCupomEscPos,
} from '../../../src/main/modules/impressao/infraestrutura/encoder-escpos'

describe('encoder ESC/POS', () => {
  it('inicia, destaca o setor e finaliza com avanco e corte Bematech', () => {
    const buffer = codificarCupomEscPos(['          PIZZA', 'Mesa 12'])

    expect(buffer[0]).toBe(0x1b)
    expect(buffer[1]).toBe(0x40)
    expect(buffer.includes(Buffer.from('PIZZA', 'latin1'))).toBe(true)
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
})
