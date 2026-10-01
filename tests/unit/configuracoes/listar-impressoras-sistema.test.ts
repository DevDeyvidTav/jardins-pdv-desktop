import { describe, expect, it } from 'vitest'
import {
  classificarDiagnosticosImpressora,
  listarImpressorasSistema,
} from '../../../src/main/modules/configuracoes/use-cases/listar-impressoras-sistema'

const RESPOSTA_VAZIA = {
  impressoras: [],
  portasCom: [],
  portasUsbLivres: [],
  dispositivos: [],
  diagnosticos: [],
}

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
      portasUsbLivres: [],
      dispositivos: [],
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
    expect(listarImpressorasSistema(undefined, { NODE_ENV: 'test' })).toEqual(
      RESPOSTA_VAZIA,
    )
  })

  it('retorna vazio quando PowerShell falha', () => {
    expect(
      listarImpressorasSistema(
        () => {
          throw new Error('powershell indisponivel')
        },
        { NODE_ENV: 'development' },
      ),
    ).toEqual(RESPOSTA_VAZIA)
  })

  it('tolera campos novos ausentes em resposta antiga do PowerShell', () => {
    const json = JSON.stringify({
      impressoras: [{ nome: 'MP-4200 TH', porta: 'COM10', status: 'Normal', padrao: true }],
      portasCom: [{ porta: 'COM10', impressora: 'MP-4200 TH' }],
    })

    const resultado = listarImpressorasSistema(() => json, {
      ...process.env,
      NODE_ENV: 'development',
    })

    expect(resultado.portasUsbLivres).toEqual([])
    expect(resultado.dispositivos).toEqual([])
    expect(resultado.diagnosticos).toEqual([])
  })
})

describe('classificarDiagnosticosImpressora', () => {
  it('aponta porta USB livre como impressora não instalada com ação de instalar genérica', () => {
    const diagnosticos = classificarDiagnosticosImpressora({
      impressoras: [
        { nome: 'MP-4200 TH', porta: 'USB001', status: 'Normal', padrao: true },
      ],
      portasCom: [],
      portasUsbLivres: ['USB002'],
      dispositivos: [],
    })

    expect(diagnosticos).toHaveLength(1)
    expect(diagnosticos[0]).toMatchObject({
      tipo: 'SEM_FILA_USB',
      acao: 'INSTALAR_GENERICA',
      porta: 'USB002',
    })
  })

  it('aponta dispositivo PnP com erro que não virou impressora instalada', () => {
    const diagnosticos = classificarDiagnosticosImpressora({
      impressoras: [],
      portasCom: [],
      portasUsbLivres: [],
      dispositivos: [
        { nome: 'USB Printing Support', classe: 'USB', status: 'Error' },
        { nome: 'MP-4200 TH', classe: 'Printer', status: 'OK' },
      ],
    })

    expect(diagnosticos).toHaveLength(1)
    expect(diagnosticos[0]).toMatchObject({
      tipo: 'DISPOSITIVO_COM_ERRO',
      acao: 'INSTALAR_GENERICA',
    })
    expect(diagnosticos[0].titulo).toContain('USB Printing Support')
  })

  it('ignora dispositivo com erro quando já existe impressora instalada com o mesmo nome', () => {
    const diagnosticos = classificarDiagnosticosImpressora({
      impressoras: [
        { nome: 'MP-4200 TH', porta: 'COM10', status: 'Error', padrao: false },
      ],
      portasCom: [{ porta: 'COM10', impressora: 'MP-4200 TH' }],
      portasUsbLivres: [],
      dispositivos: [{ nome: 'MP-4200 TH', classe: 'Printer', status: 'Error' }],
    })

    expect(diagnosticos).toEqual([])
  })

  it('aponta porta COM livre com ação de usar a porta direto', () => {
    const diagnosticos = classificarDiagnosticosImpressora({
      impressoras: [
        { nome: 'MP-4200 TH', porta: 'COM10', status: 'Normal', padrao: false },
      ],
      portasCom: [
        { porta: 'COM10', impressora: 'MP-4200 TH' },
        { porta: 'COM3', impressora: null },
      ],
      portasUsbLivres: [],
      dispositivos: [],
    })

    expect(diagnosticos).toHaveLength(1)
    expect(diagnosticos[0]).toMatchObject({
      tipo: 'PORTA_COM_LIVRE',
      acao: 'USAR_PORTA_COM',
      porta: 'COM3',
    })
  })

  it('orienta verificar conexão física quando nada é detectado', () => {
    const diagnosticos = classificarDiagnosticosImpressora({
      impressoras: [],
      portasCom: [],
      portasUsbLivres: [],
      dispositivos: [],
    })

    expect(diagnosticos).toHaveLength(1)
    expect(diagnosticos[0]).toMatchObject({
      tipo: 'NENHUMA_IMPRESSORA',
      acao: 'VERIFICAR_CONEXAO',
      porta: null,
    })
  })

  it('não gera diagnóstico quando há impressora instalada e nenhuma pendência', () => {
    const diagnosticos = classificarDiagnosticosImpressora({
      impressoras: [
        { nome: 'MP-4200 TH', porta: 'COM10', status: 'Normal', padrao: true },
      ],
      portasCom: [{ porta: 'COM10', impressora: 'MP-4200 TH' }],
      portasUsbLivres: [],
      dispositivos: [{ nome: 'MP-4200 TH', classe: 'Printer', status: 'OK' }],
    })

    expect(diagnosticos).toEqual([])
  })
})
