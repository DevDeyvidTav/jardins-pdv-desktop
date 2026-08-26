import { describe, expect, it } from 'vitest'
import { FORMA_PAGAMENTO } from '../../src/shared/types/pagamento-pedido'
import {
  arredondarParaMoedaMinima,
  calcularTrocoDinheiro,
  cedulasAtalhoParaRecebido,
  mensagemErroValorRecebidoDinheiro,
  MENSAGEM_VALOR_RECEBIDO_INSUFICIENTE,
  resolverCamposTrocoDinheiro,
  valorLiquidoCaixaDinheiro,
} from '../../src/shared/utils/troco-dinheiro'

describe('troco em dinheiro', () => {
  it('arredonda para a menor moeda de 5 centavos', () => {
    expect(arredondarParaMoedaMinima(0)).toBe(0)
    expect(arredondarParaMoedaMinima(1)).toBe(0)
    expect(arredondarParaMoedaMinima(2)).toBe(0)
    expect(arredondarParaMoedaMinima(3)).toBe(5)
    expect(arredondarParaMoedaMinima(1653)).toBe(1655)
    expect(arredondarParaMoedaMinima(1652)).toBe(1650)
  })

  it('calcula troco com arredondamento de moeda', () => {
    expect(calcularTrocoDinheiro(8347, 10000)).toBe(1655)
    expect(calcularTrocoDinheiro(1200, 1200)).toBe(0)
    expect(calcularTrocoDinheiro(5000, 10000)).toBe(5000)
  })

  it('usa pagamento exato quando o recebido e omitido', () => {
    expect(
      resolverCamposTrocoDinheiro({
        formaPagamento: FORMA_PAGAMENTO.DINHEIRO,
        valorCentavos: 8347,
      }),
    ).toEqual({ valorRecebidoCentavos: 8347, trocoCentavos: 0 })
  })

  it('nao registra troco em formas que nao sao dinheiro', () => {
    expect(
      resolverCamposTrocoDinheiro({
        formaPagamento: FORMA_PAGAMENTO.PIX_MAQUINETA,
        valorCentavos: 8347,
        valorRecebidoCentavos: 10000,
      }),
    ).toEqual({ valorRecebidoCentavos: null, trocoCentavos: 0 })
  })

  it('rejeita recebido menor que o valor aplicado', () => {
    expect(
      mensagemErroValorRecebidoDinheiro(FORMA_PAGAMENTO.DINHEIRO, 5000, 4000),
    ).toBe(MENSAGEM_VALOR_RECEBIDO_INSUFICIENTE)
    expect(
      mensagemErroValorRecebidoDinheiro(FORMA_PAGAMENTO.PIX_MAQUINETA, 5000, 4000),
    ).toBeNull()
  })

  it('liquido no caixa e recebido menos troco', () => {
    expect(valorLiquidoCaixaDinheiro(8347, 10000, 1655)).toBe(8345)
    expect(valorLiquidoCaixaDinheiro(1200, null, 0)).toBe(1200)
  })

  it('sugere cedulas maiores ou iguais ao valor', () => {
    expect(cedulasAtalhoParaRecebido(8347)).toEqual([10000, 20000])
    expect(cedulasAtalhoParaRecebido(2000)).toEqual([2000, 5000, 10000, 20000])
  })
})
