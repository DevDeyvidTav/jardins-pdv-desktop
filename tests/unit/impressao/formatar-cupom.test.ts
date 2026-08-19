import { describe, expect, it } from 'vitest'
import {
  formatarMoedaCupom,
  linhaRotuloValorOpcional,
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
