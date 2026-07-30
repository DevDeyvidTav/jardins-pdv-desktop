import { describe, expect, it } from 'vitest'
import { CANAIS_IPC } from '../../src/shared/types/canais-ipc'
import type { PdvApi } from '../../src/shared/types/pdv-api'

describe('contrato da API exposta pelo preload', () => {
  it('define canais IPC do sistema, caixa e produtos', () => {
    expect(CANAIS_IPC.CAIXA_FECHAR_SESSAO).toBe('caixa:fechar-sessao')
    expect(CANAIS_IPC.PRODUTOS_CRIAR_PRODUTO).toBe('produtos:criar-produto')
    expect(CANAIS_IPC.PRODUTOS_BUSCAR_PRODUTOS).toBe('produtos:buscar-produtos')
  })

  it('mantem formato esperado da API window.pdv', () => {
    const api: PdvApi = {
      sistema: {
        obterInformacoes: async () => ({
          nomeAplicacao: 'PDV Restaurante',
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
    }

    expect(typeof api.caixa.fecharSessaoCaixa).toBe('function')
    expect(typeof api.produtos.criarProduto).toBe('function')
    expect(typeof api.produtos.buscarProdutos).toBe('function')
    expect(typeof api.produtos.reativarCategoria).toBe('function')
    expect(typeof api.produtos.reativarProduto).toBe('function')
  })
})
