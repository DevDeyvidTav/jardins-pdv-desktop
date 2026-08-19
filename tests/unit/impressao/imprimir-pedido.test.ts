import { describe, expect, it, vi } from 'vitest'
import { TIPO_DOCUMENTO_IMPRESSAO } from '../../../src/shared/types/impressao'
import { CODIGOS_ERRO_IMPRESSAO } from '../../../src/main/modules/impressao/errors/erros-impressao'
import { criarImprimirPedido } from '../../../src/main/modules/impressao/use-cases/imprimir-pedido'
import { CODIGOS_ERRO_PEDIDOS, ErroPedidos } from '../../../src/main/modules/pedidos/errors/erros-pedidos'

const agora = '2026-08-17T22:40:00.000Z'

const resumo = {
  pedido: {
    id: 'ped-1',
    referencia: 59,
    sessaoCaixaId: 'cx-1',
    mesaId: 'mesa-1',
    clienteId: null,
    mesaAgrupamentoId: null,
    tipo: 'MESA' as const,
    status: 'ABERTO' as const,
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
  },
  itens: [
    {
      id: 'item-1',
      pedidoId: 'ped-1',
      produtoId: 'prod-1',
      tipo: 'PRODUTO' as const,
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
  ],
  entrega: null,
  divisao: null,
}

describe('imprimirPedido', () => {
  it('imprime conta do pedido com precos', () => {
    const enviar = vi.fn()
    const imprimir = criarImprimirPedido(
      () => resumo,
      enviar,
      { buscarPorId: () => ({ numero: 1 }) } as never,
      { listarPorPedido: () => [] } as never,
    )

    const resultado = imprimir({ pedidoId: 'ped-1' }, TIPO_DOCUMENTO_IMPRESSAO.CONTA)

    expect(enviar).toHaveBeenCalledOnce()
    expect(resultado.impresso).toBe(true)
    expect(resultado.texto).toContain('CONTA')
    expect(resultado.texto).toContain('Combo 2')
    expect(resultado.texto).toContain('Mesa 1')
    expect(resultado.texto).toMatch(/50,00/)
  })

  it('imprime comanda sem precos', () => {
    const imprimir = criarImprimirPedido(
      () => resumo,
      vi.fn(),
      { buscarPorId: () => ({ numero: 1 }) } as never,
      { listarPorPedido: () => [] } as never,
    )

    const resultado = imprimir({ pedidoId: 'ped-1' }, TIPO_DOCUMENTO_IMPRESSAO.COMANDA)

    expect(resultado.texto).toContain('COZINHA')
    expect(resultado.texto).toContain('COMBO 2')
    expect(resultado.texto).not.toMatch(/R\$/)
  })

  it('falha sem itens ativos', () => {
    const imprimir = criarImprimirPedido(
      () => ({ ...resumo, itens: [] }),
      vi.fn(),
      { buscarPorId: () => null } as never,
      { listarPorPedido: () => [] } as never,
    )

    expect(() =>
      imprimir({ pedidoId: 'ped-1' }, TIPO_DOCUMENTO_IMPRESSAO.CONTA),
    ).toThrowError(/nao tem itens/)
  })

  it('converte pedido inexistente em erro de impressao', () => {
    const imprimir = criarImprimirPedido(
      () => {
        throw new ErroPedidos(CODIGOS_ERRO_PEDIDOS.PEDIDO_NAO_ENCONTRADO, 'Pedido nao encontrado.')
      },
      vi.fn(),
      { buscarPorId: () => null } as never,
      { listarPorPedido: () => [] } as never,
    )

    try {
      imprimir({ pedidoId: 'x' }, TIPO_DOCUMENTO_IMPRESSAO.CONTA)
      throw new Error('deveria ter falhado')
    } catch (erro) {
      expect(erro).toMatchObject({ codigo: CODIGOS_ERRO_IMPRESSAO.PEDIDO_NAO_ENCONTRADO })
    }
  })
})
