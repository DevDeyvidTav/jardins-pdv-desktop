import { ipcMain } from 'electron'
import { ZodError } from 'zod'
import { CANAIS_IPC } from '@shared/types/canais-ipc'
import { CODIGOS_ERRO_CLIENTES, ErroClientes } from './errors/erros-clientes'
import {
  atualizarClienteSchema,
  criarClienteSchema,
  inativarClienteSchema,
  listarClientesSchema,
  listarContasTalaoSchema,
  obterClienteSchema,
  obterContaTalaoSchema,
  reativarClienteSchema,
  registrarBaixaTalaoSchema,
  vincularClientePedidoSchema,
} from './schemas/cliente.schema'
import { criarCliente } from './use-cases/criar-cliente'
import {
  atualizarCliente,
  inativarCliente,
  listarClientes,
  obterCliente,
  reativarCliente,
} from './use-cases/consultar-atualizar-cliente'
import { vincularClientePedido } from './use-cases/vincular-cliente-pedido'
import {
  listarContasTalao,
  obterContaTalao,
  registrarBaixaTalao,
} from './use-cases/conta-talao'

function tratarErroClientes(erro: unknown): never {
  if (erro instanceof ErroClientes) {
    throw erro
  }
  if (erro instanceof ZodError) {
    throw new ErroClientes(
      CODIGOS_ERRO_CLIENTES.ENTRADA_INVALIDA,
      erro.issues[0]?.message ?? 'Entrada invalida.',
    )
  }
  throw erro
}

export function registrarHandlersClientes(): void {
  ipcMain.handle(CANAIS_IPC.CLIENTES_CRIAR, (_evento, entrada) => {
    try {
      return criarCliente(criarClienteSchema.parse(entrada))
    } catch (erro) {
      tratarErroClientes(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.CLIENTES_LISTAR, (_evento, entrada) => {
    try {
      return listarClientes(listarClientesSchema.parse(entrada) ?? {})
    } catch (erro) {
      tratarErroClientes(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.CLIENTES_OBTER, (_evento, entrada) => {
    try {
      return obterCliente(obterClienteSchema.parse(entrada))
    } catch (erro) {
      tratarErroClientes(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.CLIENTES_ATUALIZAR, (_evento, entrada) => {
    try {
      return atualizarCliente(atualizarClienteSchema.parse(entrada))
    } catch (erro) {
      tratarErroClientes(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.CLIENTES_INATIVAR, (_evento, entrada) => {
    try {
      return inativarCliente(inativarClienteSchema.parse(entrada))
    } catch (erro) {
      tratarErroClientes(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.CLIENTES_REATIVAR, (_evento, entrada) => {
    try {
      return reativarCliente(reativarClienteSchema.parse(entrada))
    } catch (erro) {
      tratarErroClientes(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.CLIENTES_VINCULAR_PEDIDO, (_evento, entrada) => {
    try {
      return vincularClientePedido(vincularClientePedidoSchema.parse(entrada))
    } catch (erro) {
      tratarErroClientes(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.TALAO_OBTER_CONTA, (_evento, entrada) => {
    try {
      return obterContaTalao(obterContaTalaoSchema.parse(entrada))
    } catch (erro) {
      tratarErroClientes(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.TALAO_LISTAR_CONTAS, (_evento, entrada) => {
    try {
      return listarContasTalao(listarContasTalaoSchema.parse(entrada) ?? {})
    } catch (erro) {
      tratarErroClientes(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.TALAO_REGISTRAR_BAIXA, (_evento, entrada) => {
    try {
      return registrarBaixaTalao(registrarBaixaTalaoSchema.parse(entrada))
    } catch (erro) {
      tratarErroClientes(erro)
    }
  })
}
