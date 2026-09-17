import { ipcMain } from 'electron'
import { ZodError } from 'zod'
import { CANAIS_IPC } from '@shared/types/canais-ipc'
import { ErroDelivery, CODIGOS_ERRO_DELIVERY } from './errors/erros-delivery'
import { ErroConfiguracoes } from '../configuracoes/errors/erros-configuracoes'
import {
  criarPedidoDeliverySchema,
  obterEntregaPorPedidoSchema,
  atualizarDadosEntregaSchema,
  atualizarTaxaEntregaSchema,
  atualizarStatusEntregaSchema,
  listarPedidosDeliveryAbertosSchema,
  definirTaxaEntregaPadraoSchema,
} from './schemas/pedido-entrega.schema'
import { criarPedidoDelivery } from './use-cases/criar-pedido-delivery'
import { obterEntregaPorPedido } from './use-cases/obter-entrega-por-pedido'
import { atualizarDadosEntrega } from './use-cases/atualizar-dados-entrega'
import { atualizarTaxaEntrega } from './use-cases/atualizar-taxa-entrega'
import { atualizarStatusEntrega } from './use-cases/atualizar-status-entrega'
import { listarPedidosDeliveryAbertos } from './use-cases/listar-pedidos-delivery-abertos'
import {
  definirTaxaEntregaPadrao,
  obterTaxaEntregaPadrao,
} from './use-cases/taxa-entrega-padrao'

function tratarErroDelivery(erro: unknown): never {
  if (erro instanceof ErroConfiguracoes) {
    throw erro
  }

  if (erro instanceof ErroDelivery) {
    throw erro
  }
  if (erro instanceof ZodError) {
    throw new ErroDelivery(
      CODIGOS_ERRO_DELIVERY.ENTRADA_INVALIDA,
      erro.issues[0]?.message ?? 'Entrada invalida.',
    )
  }
  throw erro
}

export function registrarHandlersDelivery(): void {
  ipcMain.handle(CANAIS_IPC.DELIVERY_CRIAR_PEDIDO, (_evento, entrada) => {
    try {
      return criarPedidoDelivery(criarPedidoDeliverySchema.parse(entrada))
    } catch (erro) {
      tratarErroDelivery(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.DELIVERY_OBTER_ENTREGA, (_evento, entrada) => {
    try {
      return obterEntregaPorPedido(obterEntregaPorPedidoSchema.parse(entrada))
    } catch (erro) {
      tratarErroDelivery(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.DELIVERY_ATUALIZAR_DADOS_ENTREGA, (_evento, entrada) => {
    try {
      return atualizarDadosEntrega(atualizarDadosEntregaSchema.parse(entrada))
    } catch (erro) {
      tratarErroDelivery(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.DELIVERY_ATUALIZAR_TAXA_ENTREGA, (_evento, entrada) => {
    try {
      return atualizarTaxaEntrega(atualizarTaxaEntregaSchema.parse(entrada))
    } catch (erro) {
      tratarErroDelivery(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.DELIVERY_ATUALIZAR_STATUS_ENTREGA, (_evento, entrada) => {
    try {
      return atualizarStatusEntrega(atualizarStatusEntregaSchema.parse(entrada))
    } catch (erro) {
      tratarErroDelivery(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.DELIVERY_LISTAR_ABERTOS, (_evento, entrada) => {
    try {
      const parsed = listarPedidosDeliveryAbertosSchema?.parse(entrada ?? {}) ?? {}
      return listarPedidosDeliveryAbertos(parsed)
    } catch (erro) {
      tratarErroDelivery(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.DELIVERY_OBTER_TAXA_PADRAO, () => {
    try {
      return obterTaxaEntregaPadrao()
    } catch (erro) {
      tratarErroDelivery(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.DELIVERY_DEFINIR_TAXA_PADRAO, (_evento, entrada) => {
    try {
      return definirTaxaEntregaPadrao(definirTaxaEntregaPadraoSchema.parse(entrada))
    } catch (erro) {
      tratarErroDelivery(erro)
    }
  })
}
