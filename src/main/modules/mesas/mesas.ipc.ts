import { ipcMain } from 'electron'
import { ZodError } from 'zod'
import { CANAIS_IPC } from '@shared/types/canais-ipc'
import { CODIGOS_ERRO_MESAS, ErroMesas } from './errors/erros-mesas'
import {
  atualizarMesaSchema,
  criarMesasPorIntervaloSchema,
  inativarMesaSchema,
} from './schemas/mesa.schema'
import { atualizarMesa } from './use-cases/atualizar-mesa'
import { criarMesasPorIntervalo } from './use-cases/criar-mesas-por-intervalo'
import { inativarMesa } from './use-cases/inativar-mesa'
import { listarMesas } from './use-cases/listar-mesas'

function tratarErroMesas(erro: unknown): never {
  if (erro instanceof ErroMesas) {
    throw erro
  }

  if (erro instanceof ZodError) {
    throw new ErroMesas(
      CODIGOS_ERRO_MESAS.ENTRADA_INVALIDA,
      erro.issues[0]?.message ?? 'Entrada invalida.',
    )
  }

  throw erro
}

export function registrarHandlersMesas(): void {
  ipcMain.handle(CANAIS_IPC.MESAS_CRIAR_INTERVALO, (_evento, entradaDesconhecida) => {
    try {
      return criarMesasPorIntervalo(criarMesasPorIntervaloSchema.parse(entradaDesconhecida))
    } catch (erro) {
      tratarErroMesas(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.MESAS_LISTAR, () => listarMesas())

  ipcMain.handle(CANAIS_IPC.MESAS_ATUALIZAR, (_evento, entradaDesconhecida) => {
    try {
      return atualizarMesa(atualizarMesaSchema.parse(entradaDesconhecida))
    } catch (erro) {
      tratarErroMesas(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.MESAS_INATIVAR, (_evento, entradaDesconhecida) => {
    try {
      return inativarMesa(inativarMesaSchema.parse(entradaDesconhecida))
    } catch (erro) {
      tratarErroMesas(erro)
    }
  })
}
