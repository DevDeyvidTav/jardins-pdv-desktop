import { ipcMain } from 'electron'
import { ZodError } from 'zod'
import { CANAIS_IPC } from '@shared/types/canais-ipc'
import { CODIGOS_ERRO_DIVISAO_CONTA, ErroDivisaoConta } from './errors/erros-divisao-conta'
import {
  cancelarDivisaoContaSchema,
  criarDivisaoContaSchema,
  listarHistoricoDivisaoContaSchema,
  obterResumoDivisaoContaSchema,
  registrarPagamentoParteDivisaoSchema,
} from './schemas/divisao-conta.schema'
import { criarDivisaoConta } from './use-cases/criar-divisao-conta'
import {
  cancelarDivisaoConta,
  listarHistoricoDivisaoConta,
  obterResumoDivisaoConta,
} from './use-cases/consultar-cancelar-divisao'
import { registrarPagamentoParteDivisao } from './use-cases/registrar-pagamento-parte-divisao'
import { ErroPedidos } from '../pedidos/errors/erros-pedidos'

function tratarErro(erro: unknown): never {
  if (erro instanceof ErroDivisaoConta) throw erro
  if (erro instanceof ErroPedidos) throw erro
  if (erro instanceof ZodError) {
    throw new ErroDivisaoConta(
      CODIGOS_ERRO_DIVISAO_CONTA.ENTRADA_INVALIDA,
      erro.issues[0]?.message ?? 'Entrada invalida.',
    )
  }
  throw erro
}

export function registrarHandlersDivisaoConta(): void {
  ipcMain.handle(CANAIS_IPC.DIVISAO_CONTA_CRIAR, (_evento, entrada) => {
    try {
      return criarDivisaoConta(criarDivisaoContaSchema.parse(entrada))
    } catch (erro) {
      tratarErro(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.DIVISAO_CONTA_OBTER_RESUMO, (_evento, entrada) => {
    try {
      return obterResumoDivisaoConta(obterResumoDivisaoContaSchema.parse(entrada))
    } catch (erro) {
      tratarErro(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.DIVISAO_CONTA_REGISTRAR_PAGAMENTO_PARTE, (_evento, entrada) => {
    try {
      return registrarPagamentoParteDivisao(
        registrarPagamentoParteDivisaoSchema.parse(entrada),
      )
    } catch (erro) {
      tratarErro(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.DIVISAO_CONTA_CANCELAR, (_evento, entrada) => {
    try {
      return cancelarDivisaoConta(cancelarDivisaoContaSchema.parse(entrada))
    } catch (erro) {
      tratarErro(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.DIVISAO_CONTA_LISTAR_HISTORICO, (_evento, entrada) => {
    try {
      return listarHistoricoDivisaoConta(listarHistoricoDivisaoContaSchema.parse(entrada))
    } catch (erro) {
      tratarErro(erro)
    }
  })
}
