import { afterEach, describe, expect, it } from 'vitest'
import {
  CODIGOS_ERRO_CAIXA,
  ErroCaixa,
} from '../../../src/main/modules/caixa/errors/erros-caixa'
import { criarAbrirSessaoCaixa } from '../../../src/main/modules/caixa/use-cases/abrir-sessao-caixa'
import { criarSessaoCaixaRepository } from '../../../src/main/modules/caixa/repositories/sessao-caixa.repository'
import { prepararBancoTeste } from '../../helpers/banco-teste'

describe('abrirSessaoCaixa', () => {
  let encerrarBanco: (() => void) | undefined

  afterEach(() => {
    encerrarBanco?.()
    encerrarBanco = undefined
  })

  it('abre caixa com saldo inicial valido', async () => {
    const banco = await prepararBancoTeste()
    encerrarBanco = banco.encerrar

    const repositorio = criarSessaoCaixaRepository()
    const abrirSessaoCaixa = criarAbrirSessaoCaixa(repositorio)

    const sessao = abrirSessaoCaixa({
      operadorId: 'local',
      operadorNome: 'Operador Local',
      saldoInicialCentavos: 30000,
    })

    expect(sessao.status).toBe('ABERTO')
    expect(sessao.saldoInicialCentavos).toBe(30000)
    expect(sessao.operadorNome).toBe('Operador Local')
  })

  it('impede abertura com saldo negativo', async () => {
    const banco = await prepararBancoTeste()
    encerrarBanco = banco.encerrar

    const abrirSessaoCaixa = criarAbrirSessaoCaixa()

    expect(() =>
      abrirSessaoCaixa({
        operadorId: 'local',
        operadorNome: 'Operador Local',
        saldoInicialCentavos: -1,
      }),
    ).toThrowError(ErroCaixa)

    try {
      abrirSessaoCaixa({
        operadorId: 'local',
        operadorNome: 'Operador Local',
        saldoInicialCentavos: -1,
      })
    } catch (erro) {
      expect((erro as ErroCaixa).codigo).toBe(
        CODIGOS_ERRO_CAIXA.SALDO_INICIAL_INVALIDO,
      )
    }
  })

  it('impede abertura se ja existir caixa aberto', async () => {
    const banco = await prepararBancoTeste()
    encerrarBanco = banco.encerrar

    const abrirSessaoCaixa = criarAbrirSessaoCaixa()

    abrirSessaoCaixa({
      operadorId: 'local',
      operadorNome: 'Operador Local',
      saldoInicialCentavos: 10000,
    })

    try {
      abrirSessaoCaixa({
        operadorId: 'local',
        operadorNome: 'Operador Local',
        saldoInicialCentavos: 20000,
      })
    } catch (erro) {
      expect(erro).toBeInstanceOf(ErroCaixa)
      expect((erro as ErroCaixa).codigo).toBe(CODIGOS_ERRO_CAIXA.CAIXA_JA_ABERTO)
    }
  })
})
