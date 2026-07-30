import { describe, expect, it } from 'vitest'
import { CANAIS_IPC } from '../../src/shared/types/canais-ipc'
import type { PdvApi } from '../../src/shared/types/pdv-api'

describe('contrato da API exposta pelo preload', () => {
  it('define canais IPC do sistema e do caixa', () => {
    expect(CANAIS_IPC.SISTEMA_OBTER_INFORMACOES).toBe(
      'sistema:obter-informacoes',
    )
    expect(CANAIS_IPC.CAIXA_ABRIR_SESSAO).toBe('caixa:abrir-sessao')
    expect(CANAIS_IPC.CAIXA_OBTER_SESSAO_ABERTA).toBe(
      'caixa:obter-sessao-aberta',
    )
    expect(CANAIS_IPC.CAIXA_REGISTRAR_MOVIMENTO).toBe('caixa:registrar-movimento')
    expect(CANAIS_IPC.CAIXA_LISTAR_MOVIMENTOS).toBe('caixa:listar-movimentos')
    expect(CANAIS_IPC.CAIXA_OBTER_RESUMO_ATUAL).toBe('caixa:obter-resumo-atual')
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
      },
    }

    expect(typeof api.caixa.registrarMovimentoCaixa).toBe('function')
    expect(typeof api.caixa.listarMovimentosCaixa).toBe('function')
    expect(typeof api.caixa.obterResumoCaixaAtual).toBe('function')
  })
})
