import { describe, expect, it } from 'vitest'
import type { PedidoItem } from '../../../src/shared/types/pedido'
import {
  expandirLinhasSaborPizza,
  montarNomeLinhaSaborPizza,
  ratearCentavosProporcional,
  resolverSiglaTamanhoPizza,
} from '../../../src/shared/utils/linhas-sabor-pizza'

function itemPizza(parcial: Partial<PedidoItem> = {}): PedidoItem {
  const agora = '2026-10-17T12:00:00.000Z'
  return {
    id: 'item-1',
    pedidoId: 'ped-1',
    produtoId: null,
    tipo: 'PIZZA',
    produtoNome: 'Pizza G — Calabresa / Matuta',
    quantidade: 1,
    precoUnitarioCentavos: 5500,
    subtotalCentavos: 5500,
    descontoCentavos: 0,
    totalCentavos: 5500,
    observacao: null,
    criadoEm: agora,
    atualizadoEm: agora,
    canceladoEm: null,
    motivoCancelamento: null,
    fiscalNcm: '19059090',
    fiscalCfop: '5102',
    fiscalIcmsOrigem: 0,
    fiscalIcmsCsosn: '102',
    fiscalPisCst: '07',
    fiscalCofinsCst: '07',
    pizza: {
      id: 'ppi-1',
      pedidoItemId: 'item-1',
      pizzaCategoriaId: 'pc-1',
      pizzaTamanhoId: 'tam-g',
      regraPrecificacaoSnapshot: 'MAIOR_SABOR',
      valorCalculadoCentavos: 5500,
      observacao: null,
      categoriaNomeSnapshot: 'Tradicional',
      tamanhoNomeSnapshot: 'Grande',
      sabores: [
        {
          id: 's1',
          pizzaSaborId: 'ps-1',
          saborNomeSnapshot: 'Calabresa',
          valorSaborSnapshotCentavos: 5000,
          ordem: 1,
        },
        {
          id: 's2',
          pizzaSaborId: 'ps-2',
          saborNomeSnapshot: 'Matuta',
          valorSaborSnapshotCentavos: 5500,
          ordem: 2,
        },
      ],
    },
    ...parcial,
  }
}

describe('ratearCentavosProporcional', () => {
  it('distribui o total e o resto fica na ultima fatia', () => {
    expect(ratearCentavosProporcional(5500, [5000, 5500])).toEqual([2619, 2881])
    expect(ratearCentavosProporcional(5500, [5000, 5500]).reduce((a, b) => a + b, 0)).toBe(5500)
  })
})

describe('montarNomeLinhaSaborPizza', () => {
  it('usa fracao quando ha mais de um sabor', () => {
    expect(montarNomeLinhaSaborPizza('Calabresa', 'G', 2)).toBe('1/2 Calabresa G')
    expect(montarNomeLinhaSaborPizza('Matuta', 'G', 1)).toBe('Matuta G')
  })
})

describe('resolverSiglaTamanhoPizza', () => {
  it('prioriza a sigla do nome do produto e cai no snapshot', () => {
    expect(resolverSiglaTamanhoPizza({ tamanhoNomeSnapshot: 'Grande' }, 'Pizza G — X')).toBe('G')
    expect(
      resolverSiglaTamanhoPizza(
        { tamanhoNomeSnapshot: 'Grande' },
        '1/2 Calabresa G + 1/2 Matuta G',
      ),
    ).toBe('G')
    expect(resolverSiglaTamanhoPizza({ tamanhoNomeSnapshot: 'Grande' })).toBe('G')
    expect(resolverSiglaTamanhoPizza({ tamanhoNomeSnapshot: 'P' })).toBe('P')
  })
})

describe('expandirLinhasSaborPizza', () => {
  it('quebra a pizza em uma linha por sabor com valor proprio', () => {
    const linhas = expandirLinhasSaborPizza(itemPizza())
    expect(linhas).toEqual([
      { nome: '1/2 Calabresa G', valorCentavos: 2619 },
      { nome: '1/2 Matuta G', valorCentavos: 2881 },
    ])
  })

  it('retorna null para produto comum', () => {
    expect(
      expandirLinhasSaborPizza({
        ...itemPizza(),
        tipo: 'PRODUTO',
        produtoNome: 'Yakisoba',
        pizza: null,
      }),
    ).toBeNull()
  })
})
