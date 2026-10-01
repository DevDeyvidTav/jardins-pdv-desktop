import { describe, expect, it } from 'vitest'
import {
  instalarImpressoraGenerica,
  interpretarResultadoInstalacaoGenerica,
} from '../../../src/main/modules/configuracoes/use-cases/instalar-impressora-generica'

describe('interpretarResultadoInstalacaoGenerica', () => {
  it('interpreta sucesso com nome e porta', () => {
    expect(interpretarResultadoInstalacaoGenerica('OK:Impressora Jardins|USB002')).toEqual({
      instalada: true,
      nomeImpressora: 'Impressora Jardins',
      porta: 'USB002',
      mensagem: 'Impressora "Impressora Jardins" instalada na USB002.',
    })
  })

  it('interpreta falha com mensagem', () => {
    const resultado = interpretarResultadoInstalacaoGenerica(
      'FAIL:Nenhuma porta USB livre.',
    )

    expect(resultado.instalada).toBe(false)
    expect(resultado.mensagem).toBe('Nenhuma porta USB livre.')
  })

  it('interpreta conteúdo vazio como falha desconhecida', () => {
    const resultado = interpretarResultadoInstalacaoGenerica('')

    expect(resultado.instalada).toBe(false)
    expect(resultado.mensagem).toContain('desconhecida')
  })
})

describe('instalarImpressoraGenerica', () => {
  it('não executa em ambiente de teste', () => {
    const resultado = instalarImpressoraGenerica({}, { env: { NODE_ENV: 'test' } })

    expect(resultado.instalada).toBe(false)
    expect(resultado.mensagem).toContain('ambiente de teste')
  })

  it('devolve sucesso quando o script elevado grava OK', () => {
    const resultado = instalarImpressoraGenerica(
      { porta: 'USB002' },
      {
        env: { NODE_ENV: 'development' },
        executar: () => undefined,
        lerResultado: () => 'OK:Impressora Jardins (2)|USB002',
      },
    )

    expect(resultado).toMatchObject({
      instalada: true,
      nomeImpressora: 'Impressora Jardins (2)',
      porta: 'USB002',
    })
  })

  it('explica cancelamento do UAC', () => {
    const resultado = instalarImpressoraGenerica(
      {},
      {
        env: { NODE_ENV: 'development' },
        executar: () => {
          throw new Error('The operation was canceled by the user')
        },
        lerResultado: () => '',
      },
    )

    expect(resultado.instalada).toBe(false)
    expect(resultado.mensagem).toContain('cancelada')
  })

  it('propaga FAIL gravado pelo script elevado', () => {
    const resultado = instalarImpressoraGenerica(
      {},
      {
        env: { NODE_ENV: 'development' },
        executar: () => undefined,
        lerResultado: () => 'FAIL:Acesso negado ao instalar driver.',
      },
    )

    expect(resultado.instalada).toBe(false)
    expect(resultado.mensagem).toBe('Acesso negado ao instalar driver.')
  })
})
