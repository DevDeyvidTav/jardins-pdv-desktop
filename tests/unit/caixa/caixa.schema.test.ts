import { describe, expect, it } from 'vitest'
import { abrirSessaoCaixaSchema } from '../../../src/main/modules/caixa/schemas/caixa.schema'

describe('schema de abertura de caixa', () => {
  it('aceita entrada valida', () => {
    const resultado = abrirSessaoCaixaSchema.parse({
      operadorId: 'local',
      operadorNome: 'Operador Local',
      saldoInicialCentavos: 30000,
    })

    expect(resultado.saldoInicialCentavos).toBe(30000)
  })

  it('rejeita saldo inicial negativo', () => {
    expect(() =>
      abrirSessaoCaixaSchema.parse({
        operadorId: 'local',
        operadorNome: 'Operador Local',
        saldoInicialCentavos: -100,
      }),
    ).toThrow()
  })

  it('rejeita operador vazio', () => {
    expect(() =>
      abrirSessaoCaixaSchema.parse({
        operadorId: '',
        operadorNome: 'Operador Local',
        saldoInicialCentavos: 0,
      }),
    ).toThrow()
  })

  it('rejeita saldo inicial decimal', () => {
    expect(() =>
      abrirSessaoCaixaSchema.parse({
        operadorId: 'local',
        operadorNome: 'Operador Local',
        saldoInicialCentavos: 10.5,
      }),
    ).toThrow()
  })
})
