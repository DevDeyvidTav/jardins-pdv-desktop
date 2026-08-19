import { afterEach, describe, expect, it } from 'vitest'
import {
  CODIGOS_ERRO_CAIXA,
  ErroCaixa,
} from '../../../src/main/modules/caixa/errors/erros-caixa'
import { criarFecharSessaoCaixa } from '../../../src/main/modules/caixa/use-cases/fechar-sessao-caixa'
import { criarObterUltimaSessaoCaixa } from '../../../src/main/modules/caixa/use-cases/obter-ultima-sessao-caixa'
import { criarRegistrarMovimentoCaixa } from '../../../src/main/modules/caixa/use-cases/registrar-movimento-caixa'
import { STATUS_SESSAO_CAIXA } from '../../../src/shared/types/sessao-caixa'
import { TIPO_MOVIMENTO_CAIXA } from '../../../src/shared/types/movimento-caixa'
import { prepararCaixaAbertoTeste } from '../../helpers/caixa-teste'
import { prepararBancoTeste } from '../../helpers/banco-teste'
import { prepararAmbientePedidos } from '../../helpers/pedido-teste'

describe('fecharSessaoCaixa', () => {
  let encerrarBanco: (() => void) | undefined

  afterEach(() => {
    encerrarBanco?.()
    encerrarBanco = undefined
  })

  it('fecha caixa com valor contado igual ao esperado', async () => {
    const contexto = await prepararCaixaAbertoTeste(30000)
    encerrarBanco = contexto.encerrar

    const fecharSessaoCaixa = criarFecharSessaoCaixa()

    const sessaoFechada = fecharSessaoCaixa({
      saldoFinalInformadoCentavos: 30000,
    })

    expect(sessaoFechada.status).toBe(STATUS_SESSAO_CAIXA.FECHADO)
    expect(sessaoFechada.saldoFinalEsperadoCentavos).toBe(30000)
    expect(sessaoFechada.saldoFinalInformadoCentavos).toBe(30000)
    expect(sessaoFechada.diferencaCentavos).toBe(0)
    expect(sessaoFechada.fechadoEm).not.toBeNull()
  })

  it('fecha caixa com sobra', async () => {
    const contexto = await prepararCaixaAbertoTeste(30000)
    encerrarBanco = contexto.encerrar

    const registrarMovimentoCaixa = criarRegistrarMovimentoCaixa()
    registrarMovimentoCaixa({
      tipo: TIPO_MOVIMENTO_CAIXA.SUPRIMENTO,
      valorCentavos: 5000,
    })

    const fecharSessaoCaixa = criarFecharSessaoCaixa()
    const sessaoFechada = fecharSessaoCaixa({
      saldoFinalInformadoCentavos: 36000,
    })

    expect(sessaoFechada.saldoFinalEsperadoCentavos).toBe(35000)
    expect(sessaoFechada.diferencaCentavos).toBe(1000)
  })

  it('fecha caixa com falta', async () => {
    const contexto = await prepararCaixaAbertoTeste(30000)
    encerrarBanco = contexto.encerrar

    const registrarMovimentoCaixa = criarRegistrarMovimentoCaixa()
    registrarMovimentoCaixa({
      tipo: TIPO_MOVIMENTO_CAIXA.SANGRIA,
      valorCentavos: 2000,
      descricao: 'Sangria',
    })

    const fecharSessaoCaixa = criarFecharSessaoCaixa()
    const sessaoFechada = fecharSessaoCaixa({
      saldoFinalInformadoCentavos: 27000,
    })

    expect(sessaoFechada.saldoFinalEsperadoCentavos).toBe(28000)
    expect(sessaoFechada.diferencaCentavos).toBe(-1000)
  })

  it('impede fechamento sem caixa aberto', async () => {
    const banco = await prepararBancoTeste()
    encerrarBanco = banco.encerrar

    const fecharSessaoCaixa = criarFecharSessaoCaixa()

    expect(() =>
      fecharSessaoCaixa({ saldoFinalInformadoCentavos: 1000 }),
    ).toThrowError(ErroCaixa)
  })

  it('impede fechamento com valor negativo', async () => {
    const contexto = await prepararCaixaAbertoTeste()
    encerrarBanco = contexto.encerrar

    const fecharSessaoCaixa = criarFecharSessaoCaixa()

    try {
      fecharSessaoCaixa({ saldoFinalInformadoCentavos: -1 })
    } catch (erro) {
      expect((erro as ErroCaixa).codigo).toBe(
        CODIGOS_ERRO_CAIXA.SALDO_FINAL_INVALIDO,
      )
    }
  })

  it('impede fechar caixa ja fechado', async () => {
    const contexto = await prepararCaixaAbertoTeste()
    encerrarBanco = contexto.encerrar

    const fecharSessaoCaixa = criarFecharSessaoCaixa()

    fecharSessaoCaixa({ saldoFinalInformadoCentavos: 30000 })

    try {
      fecharSessaoCaixa({ saldoFinalInformadoCentavos: 30000 })
    } catch (erro) {
      expect((erro as ErroCaixa).codigo).toBe(CODIGOS_ERRO_CAIXA.CAIXA_NAO_ABERTO)
    }
  })

  it('persiste observacao de fechamento', async () => {
    const contexto = await prepararCaixaAbertoTeste()
    encerrarBanco = contexto.encerrar

    const fecharSessaoCaixa = criarFecharSessaoCaixa()
    const obterUltimaSessaoCaixa = criarObterUltimaSessaoCaixa()

    fecharSessaoCaixa({
      saldoFinalInformadoCentavos: 30000,
      observacaoFechamento: 'Conferido pelo operador',
    })

    const ultima = obterUltimaSessaoCaixa()

    expect(ultima?.observacaoFechamento).toBe('Conferido pelo operador')
    expect(ultima?.status).toBe(STATUS_SESSAO_CAIXA.FECHADO)
  })

  it('impede fechamento com pedidos abertos da sessao', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrarBanco = ambiente.encerrar

    ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })

    const fecharSessaoCaixa = criarFecharSessaoCaixa()

    try {
      fecharSessaoCaixa({ saldoFinalInformadoCentavos: 30000 })
      expect.unreachable('deveria bloquear fechamento')
    } catch (erro) {
      expect((erro as ErroCaixa).codigo).toBe(
        CODIGOS_ERRO_CAIXA.PEDIDOS_ABERTOS_NO_FECHAMENTO,
      )
      expect((erro as ErroCaixa).message).toMatch(/1 pedido aberto/i)
    }
  })

  it('impede novo movimento apos fechamento', async () => {
    const contexto = await prepararCaixaAbertoTeste()
    encerrarBanco = contexto.encerrar

    const fecharSessaoCaixa = criarFecharSessaoCaixa()
    const registrarMovimentoCaixa = criarRegistrarMovimentoCaixa()

    fecharSessaoCaixa({ saldoFinalInformadoCentavos: 30000 })

    expect(() =>
      registrarMovimentoCaixa({
        tipo: TIPO_MOVIMENTO_CAIXA.SUPRIMENTO,
        valorCentavos: 1000,
      }),
    ).toThrowError(ErroCaixa)
  })
})
