import { ipcMain } from 'electron'
import { ZodError } from 'zod'
import { CANAIS_IPC } from '@shared/types/canais-ipc'
import { CODIGOS_ERRO_IMPRESSAO, ErroImpressao } from './errors/erros-impressao'
import { imprimirAmostraSchema, imprimirPedidoSchema } from './schemas/impressao.schema'
import { imprimirAmostra } from './use-cases/imprimir-amostra'
import {
  imprimirComandaPedido,
  imprimirContaPedido,
} from './use-cases/imprimir-pedido'

function tratarErroImpressao(erro: unknown): never {
  if (erro instanceof ErroImpressao) {
    throw erro
  }

  if (erro instanceof ZodError) {
    throw new ErroImpressao(
      CODIGOS_ERRO_IMPRESSAO.ENTRADA_INVALIDA,
      erro.issues[0]?.message ?? 'Entrada invalida.',
    )
  }

  throw erro
}

export function registrarHandlersImpressao(): void {
  ipcMain.handle(
    CANAIS_IPC.IMPRESSAO_IMPRIMIR_AMOSTRA,
    (_evento, entradaDesconhecida) => {
      try {
        const entrada = imprimirAmostraSchema.parse(entradaDesconhecida)
        return imprimirAmostra(entrada)
      } catch (erro) {
        tratarErroImpressao(erro)
      }
    },
  )

  ipcMain.handle(
    CANAIS_IPC.IMPRESSAO_IMPRIMIR_CONTA,
    (_evento, entradaDesconhecida) => {
      try {
        const entrada = imprimirPedidoSchema.parse(entradaDesconhecida)
        return imprimirContaPedido(entrada)
      } catch (erro) {
        tratarErroImpressao(erro)
      }
    },
  )

  ipcMain.handle(
    CANAIS_IPC.IMPRESSAO_IMPRIMIR_COMANDA,
    (_evento, entradaDesconhecida) => {
      try {
        const entrada = imprimirPedidoSchema.parse(entradaDesconhecida)
        return imprimirComandaPedido(entrada)
      } catch (erro) {
        tratarErroImpressao(erro)
      }
    },
  )
}
