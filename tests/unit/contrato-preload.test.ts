import { describe, expect, it } from 'vitest'
import { CANAIS_IPC } from '../../src/shared/types/canais-ipc'
import type { PdvApi } from '../../src/shared/types/pdv-api'

const PEDIDO_BASE = {
  id: 'ped-1',
  sessaoCaixaId: '1',
  mesaId: 'mesa-1' as string | null,
  mesaAgrupamentoId: null as string | null,
  tipo: 'MESA' as const,
  status: 'ABERTO' as const,
  subtotalCentavos: 0,
  descontoCentavos: 0,
  descontoItensCentavos: 0,
  descontoPedidoCentavos: 0,
  taxaEntregaCentavos: 0,
  totalCentavos: 0,
  valorPagoCentavos: 0,
  valorCortesiaCentavos: 0,
  valorRestanteCentavos: 0,
  criadoEm: new Date().toISOString(),
  atualizadoEm: new Date().toISOString(),
  finalizadoEm: null,
  canceladoEm: null,
  motivoCancelamento: null,
}

const RESUMO_BASE = { pedido: PEDIDO_BASE, itens: [], entrega: null }

describe('contrato da API exposta pelo preload', () => {
  it('define canais IPC do sistema, caixa e produtos', () => {
    expect(CANAIS_IPC.CAIXA_FECHAR_SESSAO).toBe('caixa:fechar-sessao')
    expect(CANAIS_IPC.PRODUTOS_CRIAR_PRODUTO).toBe('produtos:criar-produto')
    expect(CANAIS_IPC.PRODUTOS_BUSCAR_PRODUTOS).toBe('produtos:buscar-produtos')
    expect(CANAIS_IPC.DELIVERY_CRIAR_PEDIDO).toBe('delivery:criar-pedido')
  })

  it('mantem formato esperado da API window.pdv', () => {
    const api: PdvApi = {
      sistema: {
        obterInformacoes: async () => ({
          nomeAplicacao: 'PDV Jardins',
          versao: '0.1.0',
          bancoLocalInicializado: true,
          electronAtivo: true,
        }),
      },
      caixa: {
        abrirSessaoCaixa: async () => ({
          id: '1',
          operadorId: 'local',
          operadorNome: 'Operador Local',
          saldoInicialCentavos: 30000,
          status: 'ABERTO',
          abertoEm: new Date().toISOString(),
          fechadoEm: null,
          saldoFinalInformadoCentavos: null,
          saldoFinalEsperadoCentavos: null,
          diferencaCentavos: null,
          observacaoFechamento: null,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        obterSessaoCaixaAberta: async () => null,
        registrarMovimentoCaixa: async () => ({
          id: 'm1',
          sessaoCaixaId: '1',
          tipo: 'SUPRIMENTO',
          valorCentavos: 5000,
          descricao: null,
          origem: 'MANUAL',
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        listarMovimentosCaixa: async () => [],
        obterResumoCaixaAtual: async () => null,
        fecharSessaoCaixa: async () => ({
          id: '1',
          operadorId: 'local',
          operadorNome: 'Operador Local',
          saldoInicialCentavos: 30000,
          status: 'FECHADO',
          abertoEm: new Date().toISOString(),
          fechadoEm: new Date().toISOString(),
          saldoFinalInformadoCentavos: 30000,
          saldoFinalEsperadoCentavos: 30000,
          diferencaCentavos: 0,
          observacaoFechamento: null,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        obterUltimaSessaoCaixa: async () => null,
      },
      produtos: {
        criarCategoria: async () => ({
          id: 'cat-1',
          nome: 'Bebidas',
          descricao: null,
          ativo: true,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        listarCategorias: async () => [],
        atualizarCategoria: async () => ({
          id: 'cat-1',
          nome: 'Bebidas',
          descricao: null,
          ativo: true,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        inativarCategoria: async () => ({
          id: 'cat-1',
          nome: 'Bebidas',
          descricao: null,
          ativo: false,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        reativarCategoria: async () => ({
          id: 'cat-1',
          nome: 'Bebidas',
          descricao: null,
          ativo: true,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        excluirCategoria: async () => undefined,
        criarProduto: async () => ({
          id: 'prod-1',
          categoriaId: 'cat-1',
          nome: 'Coca-Cola lata',
          descricao: null,
          precoCentavos: 600,
          ativo: true,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        listarProdutos: async () => [],
        buscarProdutos: async () => [],
        atualizarProduto: async () => ({
          id: 'prod-1',
          categoriaId: 'cat-1',
          nome: 'Coca-Cola lata',
          descricao: null,
          precoCentavos: 600,
          ativo: true,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        inativarProduto: async () => ({
          id: 'prod-1',
          categoriaId: 'cat-1',
          nome: 'Coca-Cola lata',
          descricao: null,
          precoCentavos: 600,
          ativo: false,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        reativarProduto: async () => ({
          id: 'prod-1',
          categoriaId: 'cat-1',
          nome: 'Coca-Cola lata',
          descricao: null,
          precoCentavos: 600,
          ativo: true,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        excluirProduto: async () => undefined,
        obterProdutoPorId: async () => ({
          id: 'prod-1',
          categoriaId: 'cat-1',
          nome: 'Coca-Cola lata',
          descricao: null,
          precoCentavos: 600,
          ativo: true,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
      },
      mesas: {
        criarMesasPorIntervalo: async () => [
          {
            id: 'mesa-1',
            numero: 1,
            nome: '1',
            status: 'LIVRE',
            ativo: true,
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString(),
          },
        ],
        listarMesas: async () => [],
        atualizarMesa: async () => ({
          id: 'mesa-1',
          numero: 1,
          nome: 'Salao',
          status: 'LIVRE',
          ativo: true,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        inativarMesa: async () => ({
          id: 'mesa-1',
          numero: 1,
          nome: 'Salao',
          status: 'INATIVA',
          ativo: false,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        transferirPedido: async () => ({
          pedidoId: 'ped-1',
          mesaOrigem: { id: 'mesa-1', numero: 1 },
          mesaDestino: { id: 'mesa-2', numero: 2 },
        }),
        agruparPedido: async () => ({
          pedidoId: 'ped-1',
          agrupamentoId: 'agr-1',
          mesaPrincipal: { id: 'mesa-1', numero: 1 },
          mesas: [
            { id: 'mesa-1', numero: 1, ehPrincipal: true },
            { id: 'mesa-2', numero: 2, ehPrincipal: false },
          ],
        }),
        encerrarAgrupamento: async () => ({
          id: 'agr-1',
          pedidoId: 'ped-1',
          mesaPrincipalId: 'mesa-1',
          status: 'ENCERRADO' as const,
          criadoEm: new Date().toISOString(),
          encerradoEm: new Date().toISOString(),
          motivoEncerramento: 'ENCERRAMENTO_MANUAL',
        }),
        obterAgrupamentoPedido: async () => null,
        listarHistoricoMesa: async () => [],
      },
      pedidos: {
        criarPedidoMesa: async () => PEDIDO_BASE,
        criarPedidoBalcao: async () => ({
          ...PEDIDO_BASE,
          id: 'ped-2',
          mesaId: null,
          tipo: 'BALCAO' as const,
        }),
        obterPedidoAbertoPorMesa: async () => null,
        listarPedidosAbertos: async () => [],
        adicionarItemPedido: async () => ({ ...RESUMO_BASE, pedido: { ...PEDIDO_BASE, subtotalCentavos: 600, totalCentavos: 600, valorRestanteCentavos: 600 } }),
        alterarQuantidadeItemPedido: async () => ({ ...RESUMO_BASE, pedido: { ...PEDIDO_BASE, subtotalCentavos: 1200, totalCentavos: 1200, valorRestanteCentavos: 1200 } }),
        cancelarItemPedido: async () => RESUMO_BASE,
        removerItemPedido: async () => RESUMO_BASE,
        obterResumoPedido: async () => RESUMO_BASE,
        aplicarDescontoPedido: async () => RESUMO_BASE,
        cancelarPedido: async () => ({
          ...PEDIDO_BASE,
          status: 'CANCELADO' as const,
          canceladoEm: new Date().toISOString(),
        }),
        listarHistoricoPedidos: async () => [],
        listarHistoricoMovimentacaoMesa: async () => [],
      },
      pagamentos: {
        registrarPagamentoPedido: async () => ({
          pedidoId: 'ped-1',
          totalPedidoCentavos: 0,
          totalPagoCentavos: 0,
          valorRestanteCentavos: 0,
          pagamentos: [],
        }),
        listarPagamentosPedido: async () => [],
        obterResumoPagamentoPedido: async () => ({
          pedidoId: 'ped-1',
          totalPedidoCentavos: 0,
          totalPagoCentavos: 0,
          valorRestanteCentavos: 0,
          pagamentos: [],
        }),
      },
      delivery: {
        criarPedidoDelivery: async () => ({ ...RESUMO_BASE, pedido: { ...PEDIDO_BASE, tipo: 'DELIVERY' as const, mesaId: null, taxaEntregaCentavos: 700, totalCentavos: 700, valorRestanteCentavos: 700 } }),
        obterEntrega: async () => ({
          id: 'ent-1',
          pedidoId: 'ped-1',
          clienteNome: 'Cliente',
          telefone: '81999999999',
          observacao: null,
          status: 'AGUARDANDO_PREPARO' as const,
          saiuParaEntregaEm: null,
          entregueEm: null,
          canceladoEm: null,
          motivoCancelamento: null,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        atualizarDadosEntrega: async () => ({
          id: 'ent-1',
          pedidoId: 'ped-1',
          clienteNome: 'Cliente Novo',
          telefone: '81999999999',
          observacao: 'Obs',
          status: 'AGUARDANDO_PREPARO' as const,
          saiuParaEntregaEm: null,
          entregueEm: null,
          canceladoEm: null,
          motivoCancelamento: null,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        atualizarTaxaEntrega: async () => RESUMO_BASE,
        atualizarStatusEntrega: async () => ({
          id: 'ent-1',
          pedidoId: 'ped-1',
          clienteNome: 'Cliente',
          telefone: '81999999999',
          observacao: null,
          status: 'EM_PREPARO' as const,
          saiuParaEntregaEm: null,
          entregueEm: null,
          canceladoEm: null,
          motivoCancelamento: null,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        listarDeliveryAbertos: async () => [],
        obterTaxaEntregaPadrao: async () => ({ taxaEntregaPadraoCentavos: 0 }),
        definirTaxaEntregaPadrao: async () => ({ taxaEntregaPadraoCentavos: 500 }),
      },
    }

    expect(typeof api.caixa.fecharSessaoCaixa).toBe('function')
    expect(typeof api.produtos.criarProduto).toBe('function')
    expect(typeof api.mesas.listarMesas).toBe('function')
    expect(typeof api.mesas.transferirPedido).toBe('function')
    expect(typeof api.mesas.agruparPedido).toBe('function')
    expect(typeof api.mesas.encerrarAgrupamento).toBe('function')
    expect(typeof api.mesas.obterAgrupamentoPedido).toBe('function')
    expect(typeof api.mesas.listarHistoricoMesa).toBe('function')
    expect(typeof api.pedidos.criarPedidoMesa).toBe('function')
    expect(typeof api.pedidos.adicionarItemPedido).toBe('function')
    expect(typeof api.pedidos.listarHistoricoMovimentacaoMesa).toBe('function')
    expect(typeof api.pagamentos.registrarPagamentoPedido).toBe('function')
    expect(typeof api.delivery.criarPedidoDelivery).toBe('function')
    expect(typeof api.delivery.atualizarStatusEntrega).toBe('function')
  })
})
