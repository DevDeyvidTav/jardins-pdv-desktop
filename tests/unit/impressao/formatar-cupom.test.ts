import { describe, expect, it } from 'vitest'
import {
  formatarMoedaCupom,
  linhaEsquerdaDireita,
  linhaRotuloValorOpcional,
  quebrarTexto,
} from '../../../src/main/modules/impressao/templates/formatar-cupom'

describe('formatarMoedaCupom', () => {
  it('usa espaco comum entre R$ e o valor', () => {
    expect(formatarMoedaCupom(5000)).toBe('R$ 50,00')
    expect(formatarMoedaCupom(5000)).not.toMatch(/[\u00A0\u202F\u2007]/)
  })
})

describe('linhaRotuloValorOpcional', () => {
  it('omite linhas com valor zero', () => {
    expect(linhaRotuloValorOpcional('Cortesia', 0)).toBeNull()
    expect(linhaRotuloValorOpcional('Pago', 5000)).toContain('R$ 50,00')
  })
})

describe('quebrarTexto', () => {
  it('quebra na largura sem cortar palavra quando cabe', () => {
    expect(quebrarTexto('Calabresa / Frango c/ Catupiry / Quatro Queijos', 28)).toEqual([
      'Calabresa / Frango c/',
      'Catupiry / Quatro Queijos',
    ])
  })
})

describe('linhaEsquerdaDireita', () => {
  it('mantem a direita colada na borda', () => {
    const linha = linhaEsquerdaDireita('1  Pizza Grande', 'R$ 59,90', 48)
    expect(linha.startsWith('1  Pizza Grande')).toBe(true)
    expect(linha.endsWith('R$ 59,90')).toBe(true)
    expect(linha).toHaveLength(48)
  })
})
