import { afterEach, describe, expect, it } from 'vitest'
import {
  CODIGOS_ERRO_CAIXA,
  ErroCaixa,
} from '../../../src/main/modules/caixa/errors/erros-caixa'
import { criarRegistrarMovimentoCaixa } from '../../../src/main/modules/caixa/use-cases/registrar-movimento-caixa'
import { criarListarMovimentosCaixa } from '../../../src/main/modules/caixa/use-cases/listar-movimentos-caixa'
import { criarObterResumoCaixaAtual } from '../../../src/main/modules/caixa/use-cases/obter-resumo-caixa-atual'
import { TIPO_MOVIMENTO_CAIXA } from '../../../src/shared/types/movimento-caixa'
import { prepararCaixaAbertoTeste } from '../../helpers/caixa-teste'
import { prepararBancoTeste } from '../../helpers/banco-teste'

describe('registrarMovimentoCaixa', () => {
  let encerrarBanco: (() => void) | undefined

  afterEach(() => {
    encerrarBanco?.()
    encerrarBanco = undefined
  })

  it('registra suprimento com valor valido', async () => {
    const contexto = await prepararCaixaAbertoTeste(30000)
    encerrarBanco = contexto.encerrar

    const registrarMovimentoCaixa = criarRegistrarMovimentoCaixa()

    const movimento = registrarMovimentoCaixa({
      tipo: TIPO_MOVIMENTO_CAIXA.SUPRIMENTO,
      valorCentavos: 5000,
      descricao: 'Troco complementar',
    })

    expect(movimento.tipo).toBe(TIPO_MOVIMENTO_CAIXA.SUPRIMENTO)
    expect(movimento.valorCentavos).toBe(5000)
  })

  it('registra sangria com valor valido', async () => {
    const contexto = await prepararCaixaAbertoTeste()
    encerrarBanco = contexto.encerrar

    const registrarMovimentoCaixa = criarRegistrarMovimentoCaixa()

    const movimento = registrarMovimentoCaixa({
      tipo: TIPO_MOVIMENTO_CAIXA.SANGRIA,
      valorCentavos: 2000,
      descricao: 'Sangria para cofre',
    })

    expect(movimento.tipo).toBe(TIPO_MOVIMENTO_CAIXA.SANGRIA)
  })

  it('registra retirada com valor valido', async () => {
    const contexto = await prepararCaixaAbertoTeste()
    encerrarBanco = contexto.encerrar

    const registrarMovimentoCaixa = criarRegistrarMovimentoCaixa()

    const movimento = registrarMovimentoCaixa({
      tipo: TIPO_MOVIMENTO_CAIXA.RETIRADA,
      valorCentavos: 1500,
      descricao: 'Compra de insumos',
    })

    expect(movimento.tipo).toBe(TIPO_MOVIMENTO_CAIXA.RETIRADA)
  })

  it('impede movimento sem caixa aberto', async () => {
    const banco = await prepararBancoTeste()
    encerrarBanco = banco.encerrar

    const registrarMovimentoCaixa = criarRegistrarMovimentoCaixa()

    expect(() =>
      registrarMovimentoCaixa({
        tipo: TIPO_MOVIMENTO_CAIXA.SUPRIMENTO,
        valorCentavos: 1000,
      }),
    ).toThrowError(ErroCaixa)

    try {
      registrarMovimentoCaixa({
        tipo: TIPO_MOVIMENTO_CAIXA.SUPRIMENTO,
        valorCentavos: 1000,
      })
    } catch (erro) {
      expect((erro as ErroCaixa).codigo).toBe(CODIGOS_ERRO_CAIXA.CAIXA_NAO_ABERTO)
    }
  })

  it('impede movimento com valor zero', async () => {
    const contexto = await prepararCaixaAbertoTeste()
    encerrarBanco = contexto.encerrar

    const registrarMovimentoCaixa = criarRegistrarMovimentoCaixa()

    expect(() =>
      registrarMovimentoCaixa({
        tipo: TIPO_MOVIMENTO_CAIXA.SUPRIMENTO,
        valorCentavos: 0,
      }),
    ).toThrowError(ErroCaixa)
  })

  it('impede movimento com valor negativo', async () => {
    const contexto = await prepararCaixaAbertoTeste()
    encerrarBanco = contexto.encerrar

    const registrarMovimentoCaixa = criarRegistrarMovimentoCaixa()

    expect(() =>
      registrarMovimentoCaixa({
        tipo: TIPO_MOVIMENTO_CAIXA.SUPRIMENTO,
        valorCentavos: -500,
      }),
    ).toThrowError(ErroCaixa)
  })

  it('impede sangria sem descricao', async () => {
    const contexto = await prepararCaixaAbertoTeste()
    encerrarBanco = contexto.encerrar

    const registrarMovimentoCaixa = criarRegistrarMovimentoCaixa()

    try {
      registrarMovimentoCaixa({
        tipo: TIPO_MOVIMENTO_CAIXA.SANGRIA,
        valorCentavos: 1000,
      })
    } catch (erro) {
      expect((erro as ErroCaixa).codigo).toBe(
        CODIGOS_ERRO_CAIXA.DESCRICAO_OBRIGATORIA,
      )
    }
  })

  it('impede retirada sem descricao', async () => {
    const contexto = await prepararCaixaAbertoTeste()
    encerrarBanco = contexto.encerrar

    const registrarMovimentoCaixa = criarRegistrarMovimentoCaixa()

    try {
      registrarMovimentoCaixa({
        tipo: TIPO_MOVIMENTO_CAIXA.RETIRADA,
        valorCentavos: 1000,
      })
    } catch (erro) {
      expect((erro as ErroCaixa).codigo).toBe(
        CODIGOS_ERRO_CAIXA.DESCRICAO_OBRIGATORIA,
      )
    }
  })
})

describe('listarMovimentosCaixa', () => {
  let encerrarBanco: (() => void) | undefined

  afterEach(() => {
    encerrarBanco?.()
    encerrarBanco = undefined
  })

  it('lista movimentos da sessao aberta', async () => {
    const contexto = await prepararCaixaAbertoTeste()
    encerrarBanco = contexto.encerrar

    const registrarMovimentoCaixa = criarRegistrarMovimentoCaixa()
    const listarMovimentosCaixa = criarListarMovimentosCaixa()

    registrarMovimentoCaixa({
      tipo: TIPO_MOVIMENTO_CAIXA.SUPRIMENTO,
      valorCentavos: 5000,
    })

    registrarMovimentoCaixa({
      tipo: TIPO_MOVIMENTO_CAIXA.SANGRIA,
      valorCentavos: 2000,
      descricao: 'Sangria teste',
    })

    const movimentos = listarMovimentosCaixa()

    expect(movimentos).toHaveLength(2)
    expect(movimentos[0]?.tipo).toBe(TIPO_MOVIMENTO_CAIXA.SUPRIMENTO)
    expect(movimentos[1]?.tipo).toBe(TIPO_MOVIMENTO_CAIXA.SANGRIA)
  })

  it('retorna lista vazia sem caixa aberto', async () => {
    const banco = await prepararBancoTeste()
    encerrarBanco = banco.encerrar

    const listarMovimentosCaixa = criarListarMovimentosCaixa()

    expect(listarMovimentosCaixa()).toEqual([])
  })
})

describe('obterResumoCaixaAtual', () => {
  let encerrarBanco: (() => void) | undefined

  afterEach(() => {
    encerrarBanco?.()
    encerrarBanco = undefined
  })

  it('calcula resumo do caixa corretamente', async () => {
    const contexto = await prepararCaixaAbertoTeste(30000)
    encerrarBanco = contexto.encerrar

    const registrarMovimentoCaixa = criarRegistrarMovimentoCaixa()
    const obterResumoCaixaAtual = criarObterResumoCaixaAtual()

    registrarMovimentoCaixa({
      tipo: TIPO_MOVIMENTO_CAIXA.SUPRIMENTO,
      valorCentavos: 5000,
    })

    registrarMovimentoCaixa({
      tipo: TIPO_MOVIMENTO_CAIXA.SANGRIA,
      valorCentavos: 2000,
      descricao: 'Sangria',
    })

    registrarMovimentoCaixa({
      tipo: TIPO_MOVIMENTO_CAIXA.RETIRADA,
      valorCentavos: 1000,
      descricao: 'Retirada',
    })

    const resumo = obterResumoCaixaAtual()

    expect(resumo).not.toBeNull()
    expect(resumo?.saldoInicialCentavos).toBe(30000)
    expect(resumo?.totalSuprimentosCentavos).toBe(5000)
    expect(resumo?.totalSangriasCentavos).toBe(2000)
    expect(resumo?.totalRetiradasCentavos).toBe(1000)
    expect(resumo?.saldoAtualCentavos).toBe(32000)
  })

  it('retorna null sem caixa aberto', async () => {
    const banco = await prepararBancoTeste()
    encerrarBanco = banco.encerrar

    const obterResumoCaixaAtual = criarObterResumoCaixaAtual()

    expect(obterResumoCaixaAtual()).toBeNull()
  })
})
