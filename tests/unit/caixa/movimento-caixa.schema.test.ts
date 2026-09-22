import { describe, expect, it } from 'vitest'
import { registrarMovimentoCaixaSchema } from '../../../src/main/modules/caixa/schemas/movimento-caixa.schema'
import { TIPO_MOVIMENTO_CAIXA } from '../../../src/shared/types/movimento-caixa'

describe('schema de movimento de caixa', () => {
  it('aceita suprimento valido', () => {
    const resultado = registrarMovimentoCaixaSchema.parse({
      tipo: TIPO_MOVIMENTO_CAIXA.SUPRIMENTO,
      valorCentavos: 5000,
    })

    expect(resultado.valorCentavos).toBe(5000)
  })

  it('rejeita valor zero', () => {
    expect(() =>
      registrarMovimentoCaixaSchema.parse({
        tipo: TIPO_MOVIMENTO_CAIXA.SUPRIMENTO,
        valorCentavos: 0,
      }),
    ).toThrow()
  })

  it('rejeita valor negativo', () => {
    expect(() =>
      registrarMovimentoCaixaSchema.parse({
        tipo: TIPO_MOVIMENTO_CAIXA.SUPRIMENTO,
        valorCentavos: -100,
      }),
    ).toThrow()
  })

  it('rejeita tipo sangria', () => {
    expect(() =>
      registrarMovimentoCaixaSchema.parse({
        tipo: 'SANGRIA',
        valorCentavos: 1000,
        descricao: 'legado',
      }),
    ).toThrow()
  })

  it('rejeita retirada sem descricao', () => {
    expect(() =>
      registrarMovimentoCaixaSchema.parse({
        tipo: TIPO_MOVIMENTO_CAIXA.RETIRADA,
        valorCentavos: 1000,
      }),
    ).toThrow()
  })
})
