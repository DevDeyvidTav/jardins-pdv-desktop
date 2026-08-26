import { describe, expect, it } from 'vitest'
import { FORMA_PAGAMENTO } from '../../../src/shared/types/pagamento-pedido'
import {
  cancelarDivisaoContaSchema,
  criarDivisaoContaSchema,
  listarHistoricoDivisaoContaSchema,
  obterResumoDivisaoContaSchema,
  registrarPagamentoParteDivisaoSchema,
} from '../../../src/main/modules/divisao-conta/schemas/divisao-conta.schema'

const PEDIDO_ID = '11111111-1111-4111-8111-111111111111'
const PARTE_ID = '22222222-2222-4222-8222-222222222222'

describe('divisao-conta.schema', () => {
  it('valida criacao com duas partes validas', () => {
    const resultado = criarDivisaoContaSchema.parse({
      pedidoId: PEDIDO_ID,
      partes: [
        { identificacao: 'Joao', valorDefinidoCentavos: 5000 },
        { identificacao: 'Maria', valorDefinidoCentavos: 5000 },
      ],
    })
    expect(resultado.partes).toHaveLength(2)
  })

  it('impede divisao com menos de duas partes', () => {
    expect(() =>
      criarDivisaoContaSchema.parse({
        pedidoId: PEDIDO_ID,
        partes: [{ identificacao: 'So', valorDefinidoCentavos: 1000 }],
      }),
    ).toThrow()
  })

  it('impede valor de parte zero ou negativo', () => {
    expect(() =>
      criarDivisaoContaSchema.parse({
        pedidoId: PEDIDO_ID,
        partes: [
          { identificacao: 'A', valorDefinidoCentavos: 0 },
          { identificacao: 'B', valorDefinidoCentavos: 1000 },
        ],
      }),
    ).toThrow()

    expect(() =>
      criarDivisaoContaSchema.parse({
        pedidoId: PEDIDO_ID,
        partes: [
          { identificacao: 'A', valorDefinidoCentavos: -1 },
          { identificacao: 'B', valorDefinidoCentavos: 1001 },
        ],
      }),
    ).toThrow()
  })

  it('impede identificacao vazia', () => {
    expect(() =>
      criarDivisaoContaSchema.parse({
        pedidoId: PEDIDO_ID,
        partes: [
          { identificacao: '   ', valorDefinidoCentavos: 500 },
          { identificacao: 'B', valorDefinidoCentavos: 500 },
        ],
      }),
    ).toThrow()
  })

  it('valida obter resumo, cancelar e listar historico', () => {
    expect(obterResumoDivisaoContaSchema.parse({ pedidoId: PEDIDO_ID }).pedidoId).toBe(PEDIDO_ID)
    expect(
      cancelarDivisaoContaSchema.parse({ pedidoId: PEDIDO_ID, motivo: 'desistiu' }).motivo,
    ).toBe('desistiu')
    expect(listarHistoricoDivisaoContaSchema.parse({ pedidoId: PEDIDO_ID }).pedidoId).toBe(
      PEDIDO_ID,
    )
  })

  it('valida pagamento de parte e exige motivo de cortesia', () => {
    const ok = registrarPagamentoParteDivisaoSchema.parse({
      pedidoId: PEDIDO_ID,
      parteId: PARTE_ID,
      formaPagamento: FORMA_PAGAMENTO.PIX_MAQUINETA,
      valorCentavos: 1000,
    })
    expect(ok.valorCentavos).toBe(1000)

    expect(() =>
      registrarPagamentoParteDivisaoSchema.parse({
        pedidoId: PEDIDO_ID,
        parteId: PARTE_ID,
        formaPagamento: FORMA_PAGAMENTO.CORTESIA,
        valorCentavos: 1000,
      }),
    ).toThrow()

    const cortesia = registrarPagamentoParteDivisaoSchema.parse({
      pedidoId: PEDIDO_ID,
      parteId: PARTE_ID,
      formaPagamento: FORMA_PAGAMENTO.CORTESIA,
      valorCentavos: 1000,
      motivoCortesia: 'Cortesia',
    })
    expect(cortesia.motivoCortesia).toBe('Cortesia')
  })

  it('impede valor recebido menor que o pagamento em dinheiro', () => {
    expect(() =>
      registrarPagamentoParteDivisaoSchema.parse({
        pedidoId: PEDIDO_ID,
        parteId: PARTE_ID,
        formaPagamento: FORMA_PAGAMENTO.DINHEIRO,
        valorCentavos: 1000,
        valorRecebidoCentavos: 500,
      }),
    ).toThrow(/recebido/)
  })

  it('impede pedidoId invalido', () => {
    expect(() =>
      criarDivisaoContaSchema.parse({
        pedidoId: 'nao-uuid',
        partes: [
          { identificacao: 'A', valorDefinidoCentavos: 1 },
          { identificacao: 'B', valorDefinidoCentavos: 1 },
        ],
      }),
    ).toThrow()
  })
})
