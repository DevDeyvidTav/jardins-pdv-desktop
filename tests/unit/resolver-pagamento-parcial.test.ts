import { describe, expect, it } from 'vitest'
import {
  resolverPagamentoParcial,
  resolverValorDinheiro,
} from '../../src/shared/utils/resolver-pagamento-parcial'

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

  it('abate so o restante e devolve troco quando o dinheiro passa do total', () => {
    expect(
      resolverValorDinheiro({
        valorDigitadoCentavos: 5000,
        restanteCentavos: 4600,
      }),
    ).toEqual({
      valorCentavos: 4600,
      valorRecebidoCentavos: 5000,
      trocoCentavos: 400,
    })
  })

  it('aceita dinheiro menor que o restante como parcial sem troco', () => {
    expect(
      resolverValorDinheiro({
        valorDigitadoCentavos: 2000,
        restanteCentavos: 4600,
      }),
    ).toEqual({ valorCentavos: 2000, trocoCentavos: 0 })
  })

  it('quita sem troco quando o dinheiro e igual ao restante', () => {
    expect(
      resolverValorDinheiro({
        valorDigitadoCentavos: 4600,
        restanteCentavos: 4600,
      }),
    ).toEqual({ valorCentavos: 4600, trocoCentavos: 0 })
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
