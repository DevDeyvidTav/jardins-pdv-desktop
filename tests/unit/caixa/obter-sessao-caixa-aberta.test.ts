import { afterEach, describe, expect, it } from 'vitest'
import { criarAbrirSessaoCaixa } from '../../../src/main/modules/caixa/use-cases/abrir-sessao-caixa'
import { criarObterSessaoCaixaAberta } from '../../../src/main/modules/caixa/use-cases/obter-sessao-caixa-aberta'
import { prepararBancoTeste } from '../../helpers/banco-teste'

describe('obterSessaoCaixaAberta', () => {
  let encerrarBanco: (() => void) | undefined

  afterEach(() => {
    encerrarBanco?.()
    encerrarBanco = undefined
  })

  it('retorna null quando nao houver caixa aberto', async () => {
    const banco = await prepararBancoTeste()
    encerrarBanco = banco.encerrar

    const obterSessaoCaixaAberta = criarObterSessaoCaixaAberta()

    expect(obterSessaoCaixaAberta()).toBeNull()
  })

  it('retorna sessao aberta existente', async () => {
    const banco = await prepararBancoTeste()
    encerrarBanco = banco.encerrar

    const abrirSessaoCaixa = criarAbrirSessaoCaixa()
    const obterSessaoCaixaAberta = criarObterSessaoCaixaAberta()

    const criada = abrirSessaoCaixa({
      operadorId: 'local',
      operadorNome: 'Operador Local',
      saldoInicialCentavos: 45000,
    })

    const encontrada = obterSessaoCaixaAberta()

    expect(encontrada).not.toBeNull()
    expect(encontrada?.id).toBe(criada.id)
    expect(encontrada?.saldoInicialCentavos).toBe(45000)
  })
})
