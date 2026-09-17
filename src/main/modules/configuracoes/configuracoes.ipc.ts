import { ipcMain } from 'electron'

import { ZodError } from 'zod'

import { CANAIS_IPC } from '@shared/types/canais-ipc'

import { PERMISSAO_PDV } from '@shared/types/operador'

import {

  CODIGOS_ERRO_CONFIGURACOES,

  ErroConfiguracoes,

} from './errors/erros-configuracoes'

import {

  atualizarSetorCategoriaSchema,

  autenticarOperadorSchema,

  salvarConfigImpressorasSchema,

  salvarOperadorSchema,

} from './schemas/configuracoes.schema'

import { executarComPermissao } from './util/assert-permissao-ipc'

import { atualizarSetorCategoria } from './use-cases/atualizar-setor-categoria'

import {

  listarConfigImpressoras,

  salvarConfigImpressoras,

} from './use-cases/config-impressora'

import { listarImpressorasSistema } from './use-cases/listar-impressoras-sistema'

import { recuperarImpressorasConfiguradas } from './use-cases/recuperar-impressora'

import { obterInfoSyncConfig } from './use-cases/obter-info-sync'

import {

  autenticarOperador,

  listarOperadores,

  listarOperadoresEntrada,

  obterOperadorConfigurado,

  salvarOperador,

} from './use-cases/operador'



function tratarErroConfiguracoes(erro: unknown): never {

  if (erro instanceof ErroConfiguracoes) {

    throw erro

  }



  if (erro instanceof ZodError) {

    throw new ErroConfiguracoes(

      CODIGOS_ERRO_CONFIGURACOES.ENTRADA_INVALIDA,

      erro.issues[0]?.message ?? 'Entrada invalida.',

    )

  }



  throw erro

}



export function registrarHandlersConfiguracoes(): void {

  ipcMain.handle(CANAIS_IPC.CONFIG_LISTAR_IMPRESSORAS, () => {

    try {

      return executarComPermissao(PERMISSAO_PDV.CONFIGURACOES, () => listarConfigImpressoras())

    } catch (erro) {

      tratarErroConfiguracoes(erro)

    }

  })



  ipcMain.handle(CANAIS_IPC.CONFIG_LISTAR_IMPRESSORAS_SISTEMA, () => {

    try {

      return executarComPermissao(PERMISSAO_PDV.CONFIGURACOES, () => listarImpressorasSistema())

    } catch (erro) {

      tratarErroConfiguracoes(erro)

    }

  })



  ipcMain.handle(CANAIS_IPC.CONFIG_RECUPERAR_IMPRESSORAS, () => {

    try {

      return executarComPermissao(PERMISSAO_PDV.CONFIGURACOES, () =>

        recuperarImpressorasConfiguradas(),

      )

    } catch (erro) {

      tratarErroConfiguracoes(erro)

    }

  })



  ipcMain.handle(CANAIS_IPC.CONFIG_SALVAR_IMPRESSORAS, (_evento, entrada) => {

    try {

      return executarComPermissao(PERMISSAO_PDV.CONFIGURACOES, () =>

        salvarConfigImpressoras(salvarConfigImpressorasSchema.parse(entrada)),

      )

    } catch (erro) {

      tratarErroConfiguracoes(erro)

    }

  })



  ipcMain.handle(CANAIS_IPC.CONFIG_ATUALIZAR_SETOR_CATEGORIA, (_evento, entrada) => {

    try {

      return executarComPermissao(PERMISSAO_PDV.CONFIGURACOES, () =>

        atualizarSetorCategoria(atualizarSetorCategoriaSchema.parse(entrada)),

      )

    } catch (erro) {

      tratarErroConfiguracoes(erro)

    }

  })



  ipcMain.handle(CANAIS_IPC.CONFIG_OBTER_OPERADOR, () => {

    try {

      return obterOperadorConfigurado()

    } catch (erro) {

      tratarErroConfiguracoes(erro)

    }

  })



  ipcMain.handle(CANAIS_IPC.CONFIG_LISTAR_OPERADORES_ENTRADA, () => {

    try {

      return listarOperadoresEntrada()

    } catch (erro) {

      tratarErroConfiguracoes(erro)

    }

  })



  ipcMain.handle(CANAIS_IPC.CONFIG_LISTAR_OPERADORES, () => {

    try {

      return executarComPermissao(PERMISSAO_PDV.CONFIGURACOES, () => listarOperadores())

    } catch (erro) {

      tratarErroConfiguracoes(erro)

    }

  })



  ipcMain.handle(CANAIS_IPC.CONFIG_SALVAR_OPERADOR, (_evento, entrada) => {

    try {

      return salvarOperador(salvarOperadorSchema.parse(entrada))

    } catch (erro) {

      tratarErroConfiguracoes(erro)

    }

  })



  ipcMain.handle(CANAIS_IPC.CONFIG_AUTENTICAR_OPERADOR, (_evento, entrada) => {

    try {

      return autenticarOperador(autenticarOperadorSchema.parse(entrada))

    } catch (erro) {

      tratarErroConfiguracoes(erro)

    }

  })



  ipcMain.handle(CANAIS_IPC.CONFIG_OBTER_INFO_SYNC, () => {

    try {

      return executarComPermissao(PERMISSAO_PDV.CONFIGURACOES, () => obterInfoSyncConfig())

    } catch (erro) {

      tratarErroConfiguracoes(erro)

    }

  })

}


