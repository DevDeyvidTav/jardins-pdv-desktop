import { describe, expect, it } from 'vitest'
import {
  centavosSaoValidos,
  converterReaisParaCentavos,
  formatarMoeda,
} from '../../src/shared/utils/moeda'

describe('utilitarios de moeda', () => {
  it('formata centavos em reais', () => {
    expect(formatarMoeda(30000)).toMatch(/R\$\s*300,00/)
  })

  it('converte reais para centavos', () => {
    expect(converterReaisParaCentavos('300,00')).toBe(30000)
    expect(converterReaisParaCentavos('125,90')).toBe(12590)
  })

  it('rejeita valores invalidos', () => {
    expect(converterReaisParaCentavos('-10,00')).toBeNull()
    expect(converterReaisParaCentavos('abc')).toBeNull()
    expect(centavosSaoValidos(-1)).toBe(false)
    expect(centavosSaoValidos(0)).toBe(true)
  })
})
