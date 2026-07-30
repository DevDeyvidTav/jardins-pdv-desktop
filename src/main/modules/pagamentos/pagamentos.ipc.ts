import { ipcMain } from 'electron'
import { ZodError } from 'zod'
import { CANAIS_IPC } from '@shared/types/canais-ipc'
import { CODIGOS_ERRO_PEDIDOS, ErroPedidos } from '../pedidos/errors/erros-pedidos'
import {
  listarPagamentosPedidoSchema,
  registrarPagamentoPedidoSchema,
} from './schemas/pagamento-pedido.schema'
import { registrarPagamentoPedido } from './use-cases/registrar-pagamento-pedido'
import {
  listarPagamentosPedido,
  obterResumoPagamentoPedido,
} from './use-cases/consultas-pagamento-pedido'

function tratarErro(erro: unknown): never {
  if (erro instanceof ErroPedidos) throw erro
  if (erro instanceof ZodError) {
    throw new ErroPedidos(CODIGOS_ERRO_PEDIDOS.ENTRADA_INVALIDA, erro.issues[0]?.message ?? 'Entrada invalida.')
  }
  throw erro
}

export function registrarHandlersPagamentos(): void {
  ipcMain.handle(CANAIS_IPC.PAGAMENTOS_REGISTRAR_PEDIDO, (_evento, entrada) => {
    try {
      return registrarPagamentoPedido(registrarPagamentoPedidoSchema.parse(entrada))
    } catch (erro) {
      tratarErro(erro)
    }
  })
  ipcMain.handle(CANAIS_IPC.PAGAMENTOS_LISTAR_PEDIDO, (_evento, entrada) => {
    try {
      return listarPagamentosPedido(listarPagamentosPedidoSchema.parse(entrada))
    } catch (erro) {
      tratarErro(erro)
    }
  })
  ipcMain.handle(CANAIS_IPC.PAGAMENTOS_OBTER_RESUMO_PEDIDO, (_evento, entrada) => {
    try {
      return obterResumoPagamentoPedido(listarPagamentosPedidoSchema.parse(entrada))
    } catch (erro) {
      tratarErro(erro)
    }
  })
}
