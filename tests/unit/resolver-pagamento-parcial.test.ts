import { describe, expect, it } from 'vitest'
import { resolverPagamentoParcial } from '../../src/shared/utils/resolver-pagamento-parcial'

describe('resolverPagamentoParcial', () => {
  it('mantem o valor digitado quando nao ha recebido', () => {
    expect(
      resolverPagamentoParcial({
        valorDigitadoCentavos: 5000,
        valorRecebidoCentavos: null,
        restanteCentavos: 5000,
        ehDinheiro: true,
      }),
    ).toEqual({ valorCentavos: 5000 })
  })

  it('trata recebido menor que o restante como pagamento parcial', () => {
    expect(
      resolverPagamentoParcial({
        valorDigitadoCentavos: 5000,
        valorRecebidoCentavos: 2000,
        restanteCentavos: 5000,
        ehDinheiro: true,
      }),
    ).toEqual({ valorCentavos: 2000 })
  })

  it('mantem troco quando o recebido e maior que o pagamento', () => {
    expect(
      resolverPagamentoParcial({
        valorDigitadoCentavos: 2000,
        valorRecebidoCentavos: 5000,
        restanteCentavos: 5000,
        ehDinheiro: true,
      }),
    ).toEqual({ valorCentavos: 2000, valorRecebidoCentavos: 5000 })
  })

  it('nao usa recebido fora de dinheiro', () => {
    expect(
      resolverPagamentoParcial({
        valorDigitadoCentavos: 5000,
        valorRecebidoCentavos: 2000,
        restanteCentavos: 5000,
        ehDinheiro: false,
      }),
    ).toEqual({ valorCentavos: 5000 })
  })
})
