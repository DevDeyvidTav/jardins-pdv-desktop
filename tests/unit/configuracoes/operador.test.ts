import { afterEach, describe, expect, it } from 'vitest'

import { prepararBancoTeste } from '../../helpers/banco-teste'

import { inicializarBancoLocal, encerrarBancoLocal } from '../../../src/main/database/inicializar-banco'

import {

  autenticarOperador,

  garantirOperadorPadrao,

  garantirPinsOperadoresLegado,

  listarOperadores,

  salvarOperador,

} from '../../../src/main/modules/configuracoes/use-cases/operador'

import { OPERADORES_PADRAO } from '../../../src/shared/constants/operador-padrao'

import { PERFIL_OPERADOR } from '../../../src/shared/types/operador'

import {

  hashPinOperador,

  pinEstaHasheado,

  verificarPinOperador,

} from '../../../src/main/modules/configuracoes/util/hash-pin-operador'

import {

  definirSessaoOperador,

  limparSessaoOperador,

} from '../../../src/main/modules/configuracoes/services/contexto-sessao-operador'



describe('operador', () => {

  let encerrar: (() => void) | undefined

  const nodeEnvAnterior = process.env.NODE_ENV



  afterEach(() => {

    process.env.NODE_ENV = nodeEnvAnterior

    limparSessaoOperador()

    encerrar?.()

    encerrarBancoLocal()

  })



  async function preparar() {

    const banco = await prepararBancoTeste()

    encerrar = banco.encerrar

    await inicializarBancoLocal(banco.caminhoBanco)

    return banco

  }



  it('hash e verificacao de PIN com scrypt', () => {

    const hash = hashPinOperador('147147')

    expect(pinEstaHasheado(hash)).toBe(true)

    expect(verificarPinOperador('147147', hash)).toBe(true)

    expect(verificarPinOperador('000000', hash)).toBe(false)

  })



  it('cria usuarios padrao na primeira inicializacao', async () => {

    process.env.NODE_ENV = 'development'

    await preparar()

    const conexao = (await import('../../../src/main/database/inicializar-banco')).obterConexaoBancoLocal()

    garantirOperadorPadrao(conexao)



    const operadores = listarOperadores()

    expect(operadores).toHaveLength(3)

    expect(operadores.map((item) => item.operadorNome).sort()).toEqual([

      'Nathalia',

      'Passira',

      'Welida',

    ])

  })



  it('autentica cada usuario pelo nome e PIN e define perfil', async () => {

    process.env.NODE_ENV = 'development'

    await preparar()

    const conexao = (await import('../../../src/main/database/inicializar-banco')).obterConexaoBancoLocal()

    garantirOperadorPadrao(conexao)



    const passira = autenticarOperador({

      operadorNome: OPERADORES_PADRAO[0].nome,

      pin: OPERADORES_PADRAO[0].pin,

    })

    expect(passira.operadorNome).toBe('Passira')

    expect(passira.perfil).toBe(PERFIL_OPERADOR.OPERADOR)



    const nathalia = autenticarOperador({

      operadorNome: 'nathalia',

      pin: OPERADORES_PADRAO[2].pin,

    })

    expect(nathalia.operadorNome).toBe('Nathalia')

    expect(nathalia.perfil).toBe(PERFIL_OPERADOR.ADMIN)



    expect(() =>

      autenticarOperador({

        operadorNome: OPERADORES_PADRAO[0].nome,

        pin: '999999',

      }),

    ).toThrow(/PIN invalido/)



    expect(() =>

      autenticarOperador({

        operadorNome: OPERADORES_PADRAO[1].nome,

        pin: OPERADORES_PADRAO[0].pin,

      }),

    ).toThrow(/PIN invalido/)



    expect(() =>

      autenticarOperador({

        operadorNome: 'Inexistente',

        pin: OPERADORES_PADRAO[0].pin,

      }),

    ).toThrow(/Usuario nao encontrado/)

  })



  it('migra PINs legados de 3 digitos para 6 na inicializacao', async () => {
    process.env.NODE_ENV = 'development'

    await preparar()

    const conexao = (await import('../../../src/main/database/inicializar-banco')).obterConexaoBancoLocal()
    const repositorio = (
      await import('../../../src/main/modules/configuracoes/repositories/operador-usuario.repository')
    ).criarOperadorUsuarioRepository(conexao)

    repositorio.atualizarPin(OPERADORES_PADRAO[0].id, hashPinOperador('147'))

    garantirPinsOperadoresLegado(conexao)

    expect(() =>
      autenticarOperador({
        operadorNome: OPERADORES_PADRAO[0].nome,
        pin: '147',
      }),
    ).toThrow(/PIN invalido/)

    const passira = autenticarOperador({
      operadorNome: OPERADORES_PADRAO[0].nome,
      pin: OPERADORES_PADRAO[0].pin,
    })

    expect(passira.operadorNome).toBe('Passira')
  })

  it('somente admin pode atualizar PIN', async () => {

    process.env.NODE_ENV = 'development'

    await preparar()

    const conexao = (await import('../../../src/main/database/inicializar-banco')).obterConexaoBancoLocal()

    garantirOperadorPadrao(conexao)



    definirSessaoOperador(

      autenticarOperador({

        operadorNome: OPERADORES_PADRAO[0].nome,

        pin: OPERADORES_PADRAO[0].pin,

      }),

    )

    expect(() =>

      salvarOperador({

        operadorId: OPERADORES_PADRAO[0].id,

        pin: '111111',

      }),

    ).toThrow(/permissao/)



    definirSessaoOperador(

      autenticarOperador({

        operadorNome: OPERADORES_PADRAO[2].nome,

        pin: OPERADORES_PADRAO[2].pin,

      }),

    )

    salvarOperador({

      operadorId: OPERADORES_PADRAO[0].id,

      pin: '111111',

    })



    limparSessaoOperador()

    const passira = autenticarOperador({

      operadorNome: OPERADORES_PADRAO[0].nome,

      pin: '111111',

    })

    expect(passira.operadorNome).toBe('Passira')

  })

})


