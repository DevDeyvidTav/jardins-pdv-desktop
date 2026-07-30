import { describe, expect, it } from 'vitest'
import { CANAIS_IPC } from '../../src/shared/types/canais-ipc'
import type { PdvApi } from '../../src/shared/types/pdv-api'

describe('contrato da API exposta pelo preload', () => {
  it('define canais IPC do sistema e do caixa', () => {
    expect(CANAIS_IPC.CAIXA_FECHAR_SESSAO).toBe('caixa:fechar-sessao')
    expect(CANAIS_IPC.CAIXA_OBTER_ULTIMA_SESSAO).toBe('caixa:obter-ultima-sessao')
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
    }

    expect(typeof api.caixa.fecharSessaoCaixa).toBe('function')
    expect(typeof api.caixa.obterUltimaSessaoCaixa).toBe('function')
  })
})
