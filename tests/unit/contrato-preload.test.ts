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
      },
    }

    expect(typeof api.caixa.abrirSessaoCaixa).toBe('function')
    expect(typeof api.caixa.obterSessaoCaixaAberta).toBe('function')
  })
})
