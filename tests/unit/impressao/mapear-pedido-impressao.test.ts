import { describe, expect, it } from 'vitest'
import { SETOR_COMANDA } from '../../../src/shared/types/impressao'
import type { Mesa } from '../../../src/shared/types/mesa'
import type { PagamentoPedido } from '../../../src/shared/types/pagamento-pedido'
import type { ResumoPedido } from '../../../src/shared/types/pedido'
import {
  mapearPedidoParaComanda,
  mapearPedidoParaConta,
} from '../../../src/main/modules/impressao/templates/mapear-pedido-impressao'

const agora = '2026-08-17T22:40:00.000Z'

function criarResumo(parcial: Partial<ResumoPedido['pedido']> = {}): ResumoPedido {
  return {
    pedido: {
      id: 'ped-1',
      referencia: 59,
      sessaoCaixaId: 'cx-1',
      mesaId: 'mesa-1',
      clienteId: null,
      mesaAgrupamentoId: null,
      tipo: 'MESA',
      status: 'ABERTO',
      subtotalCentavos: 5000,
      descontoCentavos: 0,
      descontoItensCentavos: 0,
      descontoPedidoCentavos: 0,
      taxaEntregaCentavos: 0,
      totalCentavos: 5000,
      valorPagoCentavos: 0,
      valorCortesiaCentavos: 0,
      valorRestanteCentavos: 5000,
      criadoEm: agora,
      atualizadoEm: agora,
      finalizadoEm: null,
      canceladoEm: null,
      motivoCancelamento: null,
      ...parcial,
    },
    itens: [
      {
        id: 'item-1',
        pedidoId: 'ped-1',
        produtoId: 'prod-1',
        tipo: 'PRODUTO',
        produtoNome: 'Combo 2',
        quantidade: 1,
        precoUnitarioCentavos: 5000,
        subtotalCentavos: 5000,
        descontoCentavos: 0,
        totalCentavos: 5000,
        observacao: null,
        criadoEm: agora,
        atualizadoEm: agora,
        canceladoEm: null,
        motivoCancelamento: null,
      },
      {
        id: 'item-2',
        pedidoId: 'ped-1',
        produtoId: 'prod-2',
        tipo: 'PRODUTO',
        produtoNome: 'Refrigerante lata',
        quantidade: 1,
        precoUnitarioCentavos: 600,
        subtotalCentavos: 600,
        descontoCentavos: 0,
        totalCentavos: 600,
        observacao: null,
        criadoEm: agora,
        atualizadoEm: agora,
        canceladoEm: agora,
        motivoCancelamento: 'erro',
      },
    ],
    entrega: null,
    divisao: null,
  }
}

const mesa: Mesa = {
  id: 'mesa-1',
  numero: 1,
  nome: '1',
  status: 'OCUPADA',
  ativo: true,
  criadoEm: agora,
  atualizadoEm: agora,
}

describe('mapearPedidoParaConta', () => {
  it('monta conta com mesa, totais e sem item cancelado no papel', () => {
    const conta = mapearPedidoParaConta(criarResumo(), mesa, [])

    expect(conta.mesaNumero).toBe(1)
    expect(conta.referencia).toBe(59)
    expect(conta.totalCentavos).toBe(5000)
    expect(conta.itens[0]?.nome).toBe('Combo 2')
    expect(conta.itens[1]?.cancelado).toBe(true)
  })

  it('nao inclui itens com valor zero na conta', () => {
    const resumo = criarResumo()
    resumo.itens.push({
      id: 'item-3',
      pedidoId: 'ped-1',
      produtoId: 'prod-3',
      tipo: 'PRODUTO',
      produtoNome: 'Guardanapo extra',
      quantidade: 2,
      precoUnitarioCentavos: 0,
      subtotalCentavos: 0,
      descontoCentavos: 0,
      totalCentavos: 0,
      observacao: null,
      criadoEm: agora,
      atualizadoEm: agora,
      canceladoEm: null,
      motivoCancelamento: null,
    })

    const conta = mapearPedidoParaConta(resumo, mesa, [])
    expect(conta.itens.some((item) => item.nome === 'Guardanapo extra')).toBe(false)
    expect(conta.itens.some((item) => item.nome === 'Combo 2')).toBe(true)
  })

  it('inclui pagamentos confirmados', () => {
    const pagamento: PagamentoPedido = {
      id: 'pag-1',
      pedidoId: 'ped-1',
      sessaoCaixaId: 'cx-1',
      formaPagamento: 'DINHEIRO',
      valorCentavos: 5000,
      status: 'CONFIRMADO',
      pedidoDivisaoParteId: null,
      criadoEm: agora,
      atualizadoEm: agora,
      canceladoEm: null,
    }

    const conta = mapearPedidoParaConta(criarResumo(), mesa, [pagamento])
    expect(conta.pagamentos).toEqual([{ formaRotulo: 'Dinheiro', valorCentavos: 5000 }])
  })
})

describe('mapearPedidoParaComanda', () => {
  it('usa setor COZINHA quando ha produto comum', () => {
    const comanda = mapearPedidoParaComanda(criarResumo(), mesa)
    expect(comanda.setor).toBe(SETOR_COMANDA.COZINHA)
    expect(comanda.itens.some((item) => item.nome === 'Combo 2')).toBe(true)
  })

  it('mantem item com valor zero na comanda', () => {
    const resumo = criarResumo()
    resumo.itens.push({
      id: 'item-3',
      pedidoId: 'ped-1',
      produtoId: 'prod-3',
      tipo: 'PRODUTO',
      produtoNome: 'Guardanapo extra',
      quantidade: 2,
      precoUnitarioCentavos: 0,
      subtotalCentavos: 0,
      descontoCentavos: 0,
      totalCentavos: 0,
      observacao: null,
      criadoEm: agora,
      atualizadoEm: agora,
      canceladoEm: null,
      motivoCancelamento: null,
    })

    const comanda = mapearPedidoParaComanda(resumo, mesa)
    expect(comanda.itens.some((item) => item.nome === 'Guardanapo extra')).toBe(true)
  })

  it('usa setor PIZZA quando so ha pizza ativa', () => {
    const resumo = criarResumo()
    resumo.itens = [
      {
        id: 'item-pizza',
        pedidoId: 'ped-1',
        produtoId: null,
        tipo: 'PIZZA',
        produtoNome: 'Pizza G',
        quantidade: 1,
        precoUnitarioCentavos: 5500,
        subtotalCentavos: 5500,
        descontoCentavos: 0,
        totalCentavos: 5500,
        observacao: 'sem cebola',
        criadoEm: agora,
        atualizadoEm: agora,
        canceladoEm: null,
        motivoCancelamento: null,
        pizza: {
          id: 'ppi-1',
          pedidoItemId: 'item-pizza',
          pizzaCategoriaId: 'pc-1',
          pizzaTamanhoId: 'tam-g',
          regraPrecificacaoSnapshot: 'MAIOR_SABOR',
          valorCalculadoCentavos: 5500,
          observacao: 'sem cebola',
          categoriaNomeSnapshot: 'Tradicional',
          tamanhoNomeSnapshot: 'G',
          sabores: [
            {
              id: 's1',
              pizzaSaborId: 'ps-1',
              saborNomeSnapshot: 'Calabresa',
              valorSaborSnapshotCentavos: 5500,
              ordem: 1,
            },
          ],
        },
      },
    ]

    const comanda = mapearPedidoParaComanda(resumo, mesa)
    expect(comanda.setor).toBe(SETOR_COMANDA.PIZZA)
    expect(comanda.itens[0]?.nome).toBe('Pizza G')
    expect(comanda.itens[0]?.detalhes).toEqual(['Calabresa'])
  })
})
