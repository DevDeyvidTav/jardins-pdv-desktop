import { describe, expect, it } from 'vitest'
import { CANAIS_IPC } from '../../src/shared/types/canais-ipc'
import type { InformacoesSistema, PdvApi } from '../../src/shared/types/informacoes-sistema'

describe('contrato da API exposta pelo preload', () => {
  it('define canal IPC para obter informacoes do sistema', () => {
    expect(CANAIS_IPC.SISTEMA_OBTER_INFORMACOES).toBe(
      'sistema:obter-informacoes',
    )
  })

  it('mantem formato esperado de InformacoesSistema', () => {
    const exemplo: InformacoesSistema = {
      nomeAplicacao: 'PDV Restaurante',
      versao: '0.1.0',
      bancoLocalInicializado: true,
      electronAtivo: true,
    }

    expect(exemplo.nomeAplicacao).toBe('PDV Restaurante')
    expect(exemplo.bancoLocalInicializado).toBe(true)
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
    }

    expect(typeof api.sistema.obterInformacoes).toBe('function')
  })
})
