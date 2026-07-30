import { describe, expect, it } from 'vitest'
import { fecharSessaoCaixaSchema } from '../../../src/main/modules/caixa/schemas/fechamento-caixa.schema'

describe('schema de fechamento de caixa', () => {
  it('aceita fechamento valido', () => {
    const resultado = fecharSessaoCaixaSchema.parse({
      saldoFinalInformadoCentavos: 28000,
      observacaoFechamento: 'Conferido',
    })

    expect(resultado.saldoFinalInformadoCentavos).toBe(28000)
  })

  it('rejeita valor contado negativo', () => {
    expect(() =>
      fecharSessaoCaixaSchema.parse({
        saldoFinalInformadoCentavos: -100,
      }),
    ).toThrow()
  })
})
