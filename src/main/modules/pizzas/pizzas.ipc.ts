import { ipcMain } from 'electron'
import { ZodError } from 'zod'
import { CANAIS_IPC } from '@shared/types/canais-ipc'
import { ErroPedidos } from '../pedidos/errors/erros-pedidos'
import { CODIGOS_ERRO_PIZZAS, ErroPizzas } from './errors/erros-pizzas'
import {
  adicionarPizzaAoPedidoSchema,
  atualizarPizzaCategoriaSchema,
  atualizarPizzaSaborSchema,
  atualizarPizzaTamanhoSchema,
  criarPizzaCategoriaSchema,
  criarPizzaSaborSchema,
  criarPizzaTamanhoSchema,
  definirPrecoSaborPorTamanhoSchema,
  listarCategoriasDoSaborSchema,
  listarPizzaCategoriasSchema,
  listarPizzaSaboresSchema,
  listarPizzaTamanhosSchema,
  listarPrecosSaborSchema,
  montarPreviewPizzaSchema,
  obterPizzaPedidoItemSchema,
  vincularSaborCategoriaSchema,
} from './schemas/pizza.schema'
import { adicionarPizzaAoPedido } from './use-cases/adicionar-pizza-ao-pedido'
import {
  atualizarPizzaCategoria,
  criarPizzaCategoria,
  listarPizzaCategorias,
} from './use-cases/categorias-pizza'
import { montarPreviewPizza } from './use-cases/montar-preview-pizza'
import { obterPizzaPedidoItem } from './use-cases/obter-pizza-pedido-item'
import {
  atualizarPizzaSabor,
  criarPizzaSabor,
  definirPrecoSaborPorTamanho,
  listarCategoriasDoSabor,
  listarPizzaSabores,
  listarPrecosSabor,
  vincularSaborCategoria,
} from './use-cases/sabores-pizza'
import {
  atualizarPizzaTamanho,
  criarPizzaTamanho,
  listarPizzaTamanhos,
} from './use-cases/tamanhos-pizza'

function tratarErroPizzas(erro: unknown): never {
  if (erro instanceof ErroPizzas) {
    throw erro
  }

  if (erro instanceof ErroPedidos) {
    throw erro
  }

  if (erro instanceof ZodError) {
    throw new ErroPizzas(
      CODIGOS_ERRO_PIZZAS.ENTRADA_INVALIDA,
      erro.issues[0]?.message ?? 'Entrada invalida.',
    )
  }

  throw erro
}

export function registrarHandlersPizzas(): void {
  ipcMain.handle(CANAIS_IPC.PIZZAS_CRIAR_CATEGORIA, (_evento, entrada) => {
    try {
      return criarPizzaCategoria(criarPizzaCategoriaSchema.parse(entrada))
    } catch (erro) {
      tratarErroPizzas(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.PIZZAS_LISTAR_CATEGORIAS, (_evento, entrada) => {
    try {
      return listarPizzaCategorias(listarPizzaCategoriasSchema.parse(entrada))
    } catch (erro) {
      tratarErroPizzas(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.PIZZAS_ATUALIZAR_CATEGORIA, (_evento, entrada) => {
    try {
      return atualizarPizzaCategoria(atualizarPizzaCategoriaSchema.parse(entrada))
    } catch (erro) {
      tratarErroPizzas(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.PIZZAS_CRIAR_TAMANHO, (_evento, entrada) => {
    try {
      return criarPizzaTamanho(criarPizzaTamanhoSchema.parse(entrada))
    } catch (erro) {
      tratarErroPizzas(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.PIZZAS_LISTAR_TAMANHOS, (_evento, entrada) => {
    try {
      return listarPizzaTamanhos(listarPizzaTamanhosSchema.parse(entrada))
    } catch (erro) {
      tratarErroPizzas(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.PIZZAS_ATUALIZAR_TAMANHO, (_evento, entrada) => {
    try {
      return atualizarPizzaTamanho(atualizarPizzaTamanhoSchema.parse(entrada))
    } catch (erro) {
      tratarErroPizzas(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.PIZZAS_CRIAR_SABOR, (_evento, entrada) => {
    try {
      return criarPizzaSabor(criarPizzaSaborSchema.parse(entrada))
    } catch (erro) {
      tratarErroPizzas(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.PIZZAS_LISTAR_SABORES, (_evento, entrada) => {
    try {
      return listarPizzaSabores(listarPizzaSaboresSchema.parse(entrada))
    } catch (erro) {
      tratarErroPizzas(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.PIZZAS_ATUALIZAR_SABOR, (_evento, entrada) => {
    try {
      return atualizarPizzaSabor(atualizarPizzaSaborSchema.parse(entrada))
    } catch (erro) {
      tratarErroPizzas(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.PIZZAS_VINCULAR_SABOR_CATEGORIA, (_evento, entrada) => {
    try {
      return vincularSaborCategoria(vincularSaborCategoriaSchema.parse(entrada))
    } catch (erro) {
      tratarErroPizzas(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.PIZZAS_DEFINIR_PRECO, (_evento, entrada) => {
    try {
      return definirPrecoSaborPorTamanho(
        definirPrecoSaborPorTamanhoSchema.parse(entrada),
      )
    } catch (erro) {
      tratarErroPizzas(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.PIZZAS_LISTAR_PRECOS_SABOR, (_evento, entrada) => {
    try {
      return listarPrecosSabor(listarPrecosSaborSchema.parse(entrada))
    } catch (erro) {
      tratarErroPizzas(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.PIZZAS_LISTAR_CATEGORIAS_SABOR, (_evento, entrada) => {
    try {
      return listarCategoriasDoSabor(listarCategoriasDoSaborSchema.parse(entrada))
    } catch (erro) {
      tratarErroPizzas(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.PIZZAS_MONTAR_PREVIEW, (_evento, entrada) => {
    try {
      return montarPreviewPizza(montarPreviewPizzaSchema.parse(entrada))
    } catch (erro) {
      tratarErroPizzas(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.PEDIDOS_ADICIONAR_PIZZA, (_evento, entrada) => {
    try {
      return adicionarPizzaAoPedido(adicionarPizzaAoPedidoSchema.parse(entrada))
    } catch (erro) {
      tratarErroPizzas(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.PEDIDOS_OBTER_PIZZA_ITEM, (_evento, entrada) => {
    try {
      return obterPizzaPedidoItem(obterPizzaPedidoItemSchema.parse(entrada))
    } catch (erro) {
      tratarErroPizzas(erro)
    }
  })
}
