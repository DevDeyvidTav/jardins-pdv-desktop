import { describe, expect, it } from 'vitest'
import { listarImpressorasSistema } from '../../../src/main/modules/configuracoes/use-cases/listar-impressoras-sistema'

describe('listarImpressorasSistema', () => {
  it('parseia resposta do PowerShell com impressoras e portas COM', () => {
    const json = JSON.stringify({
      impressoras: [
        {
          nome: 'MP-4200 TH',
          porta: 'COM10',
          status: 'Normal',
          padrao: true,
        },
        {
          nome: 'MP-4200 TH (2)',
          porta: 'COM11',
          status: 'Normal',
          padrao: false,
        },
      ],
      portasCom: [
        { porta: 'COM10', impressora: 'MP-4200 TH' },
        { porta: 'COM11', impressora: 'MP-4200 TH (2)' },
        { porta: 'COM12', impressora: null },
      ],
    })

    const resultado = listarImpressorasSistema(() => json, {
      ...process.env,
      NODE_ENV: 'development',
    })

    expect(resultado.impressoras).toHaveLength(2)
    expect(resultado.impressoras[0]).toMatchObject({
      nome: 'MP-4200 TH',
      porta: 'COM10',
      padrao: true,
    })
    expect(resultado.portasCom).toHaveLength(3)
    expect(resultado.portasCom[2]).toEqual({ porta: 'COM12', impressora: null })
  })

  it('retorna vazio em ambiente de teste', () => {
    expect(listarImpressorasSistema(undefined, { NODE_ENV: 'test' })).toEqual({
      impressoras: [],
      portasCom: [],
    })
  })

  it('retorna vazio quando PowerShell falha', () => {
    expect(
      listarImpressorasSistema(
        () => {
          throw new Error('powershell indisponivel')
        },
        { NODE_ENV: 'development' },
      ),
    ).toEqual({
      impressoras: [],
      portasCom: [],
    })
  })
})
