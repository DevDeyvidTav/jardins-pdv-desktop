import { ipcMain } from 'electron'
import { ZodError } from 'zod'
import { CANAIS_IPC } from '@shared/types/canais-ipc'
import { CODIGOS_ERRO_PEDIDOS, ErroPedidos } from './errors/erros-pedidos'
import { ErroPizzas } from '../pizzas/errors/erros-pizzas'
import {
  adicionarItemPedidoSchema,
  alterarQuantidadeItemPedidoSchema,
  aplicarDescontoPedidoSchema,
  cancelarPedidoSchema,
  criarPedidoMesaSchema,
  obterPedidoAbertoPorMesaSchema,
  obterResumoPedidoSchema,
  cancelarItemPedidoSchema,
  removerItemPedidoSchema,
  listarHistoricoPedidosSchema,
  atualizarSolicitacaoFiscalSchema,
} from './schemas/pedido.schema'
import { adicionarItemPedido } from './use-cases/adicionar-item-pedido'
import { alterarQuantidadeItemPedido } from './use-cases/alterar-quantidade-item-pedido'
import { aplicarDescontoPedido } from './use-cases/aplicar-desconto-pedido'
import { cancelarPedido } from './use-cases/cancelar-pedido'
import { criarPedidoBalcao } from './use-cases/criar-pedido-balcao'
import { criarPedidoMesa } from './use-cases/criar-pedido-mesa'
import {
  listarPedidosAbertos,
  obterPedidoAbertoPorMesa,
  obterResumoPedido,
} from './use-cases/consultas-pedido'
import { cancelarItemPedido } from './use-cases/cancelar-item-pedido'
import { listarHistoricoPedidos } from './use-cases/listar-historico-pedidos'
import { atualizarSolicitacaoFiscal } from './use-cases/atualizar-solicitacao-fiscal'
import { listarHistoricoPedidoMesa } from '../mesas/use-cases/encerrar-e-historico-mesas'
import { listarHistoricoPedidoMesaSchema } from '../mesas/schemas/mesa-agrupamento.schema'

function tratarErroPedidos(erro: unknown): never {
  if (erro instanceof ErroPedidos) {
    throw erro
  }

  if (erro instanceof ErroPizzas) {
    throw erro
  }

  if (erro instanceof ZodError) {
    throw new ErroPedidos(
      CODIGOS_ERRO_PEDIDOS.ENTRADA_INVALIDA,
      erro.issues[0]?.message ?? 'Entrada invalida.',
    )
  }

  throw erro
}

export function registrarHandlersPedidos(): void {
  ipcMain.handle(CANAIS_IPC.PEDIDOS_CRIAR_PEDIDO_MESA, (_evento, entradaDesconhecida) => {
    try {
      return criarPedidoMesa(criarPedidoMesaSchema.parse(entradaDesconhecida))
    } catch (erro) {
      tratarErroPedidos(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.PEDIDOS_CRIAR_PEDIDO_BALCAO, () => {
    try {
      return criarPedidoBalcao()
    } catch (erro) {
      tratarErroPedidos(erro)
    }
  })

  ipcMain.handle(
    CANAIS_IPC.PEDIDOS_OBTER_PEDIDO_ABERTO_POR_MESA,
    (_evento, entradaDesconhecida) => {
      try {
        return obterPedidoAbertoPorMesa(
          obterPedidoAbertoPorMesaSchema.parse(entradaDesconhecida),
        )
      } catch (erro) {
        tratarErroPedidos(erro)
      }
    },
  )

  ipcMain.handle(CANAIS_IPC.PEDIDOS_LISTAR_PEDIDOS_ABERTOS, () => listarPedidosAbertos())

  ipcMain.handle(CANAIS_IPC.PEDIDOS_ADICIONAR_ITEM, (_evento, entradaDesconhecida) => {
    try {
      return adicionarItemPedido(adicionarItemPedidoSchema.parse(entradaDesconhecida))
    } catch (erro) {
      tratarErroPedidos(erro)
    }
  })

  ipcMain.handle(
    CANAIS_IPC.PEDIDOS_ALTERAR_QUANTIDADE_ITEM,
    (_evento, entradaDesconhecida) => {
      try {
        return alterarQuantidadeItemPedido(
          alterarQuantidadeItemPedidoSchema.parse(entradaDesconhecida),
        )
      } catch (erro) {
        tratarErroPedidos(erro)
      }
    },
  )

  ipcMain.handle(CANAIS_IPC.PEDIDOS_REMOVER_ITEM, (_evento, entradaDesconhecida) => {
    try {
      return cancelarItemPedido(cancelarItemPedidoSchema.parse(entradaDesconhecida))
    } catch (erro) {
      tratarErroPedidos(erro)
    }
  })

  ipcMain.handle(
    CANAIS_IPC.PEDIDOS_APLICAR_DESCONTO,
    (_evento, entradaDesconhecida) => {
      try {
        return aplicarDescontoPedido(
          aplicarDescontoPedidoSchema.parse(entradaDesconhecida),
        )
      } catch (erro) {
        tratarErroPedidos(erro)
      }
    },
  )

  ipcMain.handle(CANAIS_IPC.PEDIDOS_OBTER_RESUMO, (_evento, entradaDesconhecida) => {
    try {
      return obterResumoPedido(obterResumoPedidoSchema.parse(entradaDesconhecida))
    } catch (erro) {
      tratarErroPedidos(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.PEDIDOS_CANCELAR, (_evento, entradaDesconhecida) => {
    try {
      return cancelarPedido(cancelarPedidoSchema.parse(entradaDesconhecida))
    } catch (erro) {
      tratarErroPedidos(erro)
    }
  })

  ipcMain.handle(
    CANAIS_IPC.PEDIDOS_ATUALIZAR_SOLICITACAO_FISCAL,
    (_evento, entradaDesconhecida) => {
      try {
        return atualizarSolicitacaoFiscal(
          atualizarSolicitacaoFiscalSchema.parse(entradaDesconhecida),
        )
      } catch (erro) {
        tratarErroPedidos(erro)
      }
    },
  )

  ipcMain.handle(CANAIS_IPC.PEDIDOS_LISTAR_HISTORICO, (_evento, entradaDesconhecida) => {
    try {
      return listarHistoricoPedidos(
        listarHistoricoPedidosSchema.parse(entradaDesconhecida ?? {}),
      )
    } catch (erro) {
      tratarErroPedidos(erro)
    }
  })

  ipcMain.handle(
    CANAIS_IPC.PEDIDOS_LISTAR_HISTORICO_MOVIMENTACAO,
    (_evento, entradaDesconhecida) => {
      try {
        return listarHistoricoPedidoMesa(
          listarHistoricoPedidoMesaSchema.parse(entradaDesconhecida),
        )
      } catch (erro) {
        tratarErroPedidos(erro)
      }
    },
  )
}
