import { describe, expect, it } from 'vitest'
import {
  calcularDiferencaCentavos,
  calcularSaldoEsperadoCentavos,
} from '../../../src/main/modules/caixa/types/fechamento-caixa.types'

describe('calculos de fechamento de caixa', () => {
  it('calcula saldo esperado corretamente', () => {
    const saldo = calcularSaldoEsperadoCentavos(30000, {
      totalSuprimentosCentavos: 5000,
      totalRetiradasCentavos: 3000,
    })

    expect(saldo).toBe(32000)
  })

  it('calcula diferenca corretamente', () => {
    expect(calcularDiferencaCentavos(33000, 32000)).toBe(1000)
    expect(calcularDiferencaCentavos(31000, 32000)).toBe(-1000)
  })
})
