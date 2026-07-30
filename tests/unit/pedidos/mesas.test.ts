import { afterEach, describe, expect, it } from 'vitest'
import { CODIGOS_ERRO_MESAS, ErroMesas } from '../../../src/main/modules/mesas/errors/erros-mesas'
import { criarMesaRepository } from '../../../src/main/modules/mesas/repositories/mesa.repository'
import { criarCriarMesasPorIntervalo } from '../../../src/main/modules/mesas/use-cases/criar-mesas-por-intervalo'
import { criarListarMesas } from '../../../src/main/modules/mesas/use-cases/listar-mesas'
import { prepararBancoTeste } from '../../helpers/banco-teste'

describe('mesas', () => {
  let encerrarBanco: (() => void) | undefined

  afterEach(() => {
    encerrarBanco?.()
    encerrarBanco = undefined
  })

  it('cria mesas por intervalo', async () => {
    const banco = await prepararBancoTeste()
    encerrarBanco = banco.encerrar

    const criarMesasPorIntervalo = criarCriarMesasPorIntervalo()
    const mesas = criarMesasPorIntervalo({ numeroInicial: 1, numeroFinal: 3 })

    expect(mesas).toHaveLength(3)
    expect(mesas[0].numero).toBe(1)
    expect(mesas[0].nome).toBe('1')
    expect(mesas[0].ativo).toBe(true)
    expect(mesas[0].status).toBe('LIVRE')
  })

  it('lista mesas', async () => {
    const banco = await prepararBancoTeste()
    encerrarBanco = banco.encerrar

    const repositorio = criarMesaRepository()
    const criarMesasPorIntervalo = criarCriarMesasPorIntervalo(repositorio)
    const listarMesas = criarListarMesas(repositorio)

    criarMesasPorIntervalo({ numeroInicial: 1, numeroFinal: 2 })

    expect(listarMesas()).toHaveLength(2)
  })

  it('pula numeros ja existentes no intervalo', async () => {
    const banco = await prepararBancoTeste()
    encerrarBanco = banco.encerrar

    const repositorio = criarMesaRepository()
    const criarMesasPorIntervalo = criarCriarMesasPorIntervalo(repositorio)

    repositorio.inserir({ numero: 2 })
    const mesas = criarMesasPorIntervalo({ numeroInicial: 1, numeroFinal: 3 })

    expect(mesas).toHaveLength(2)
    expect(mesas.map((mesa) => mesa.numero)).toEqual([1, 3])
  })

  it('impede intervalo invalido', async () => {
    const banco = await prepararBancoTeste()
    encerrarBanco = banco.encerrar

    const criarMesasPorIntervalo = criarCriarMesasPorIntervalo()

    expect(() =>
      criarMesasPorIntervalo({ numeroInicial: 5, numeroFinal: 2 }),
    ).toThrow(ErroMesas)

    try {
      criarMesasPorIntervalo({ numeroInicial: 5, numeroFinal: 2 })
    } catch (erro) {
      expect((erro as ErroMesas).codigo).toBe(CODIGOS_ERRO_MESAS.INTERVALO_INVALIDO)
    }
  })
})
