import { describe, expect, it } from 'vitest'
import { imprimirAmostraSchema } from '../../../src/main/modules/impressao/schemas/impressao.schema'

describe('schema de amostra de impressao', () => {
  it('aceita conta sem setor', () => {
    expect(imprimirAmostraSchema.parse({ tipo: 'CONTA' })).toEqual({ tipo: 'CONTA' })
  })

  it('aceita comanda com setor', () => {
    expect(
      imprimirAmostraSchema.parse({ tipo: 'COMANDA', setor: 'PIZZA' }),
    ).toEqual({ tipo: 'COMANDA', setor: 'PIZZA' })
  })

  it('rejeita comanda sem setor', () => {
    expect(() => imprimirAmostraSchema.parse({ tipo: 'COMANDA' })).toThrow()
  })

  it('rejeita tipo desconhecido', () => {
    expect(() => imprimirAmostraSchema.parse({ tipo: 'DANFE' })).toThrow()
  })
})
