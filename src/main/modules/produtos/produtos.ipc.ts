import { ipcMain } from 'electron'
import { ZodError } from 'zod'
import { CANAIS_IPC } from '@shared/types/canais-ipc'
import {
  CODIGOS_ERRO_PRODUTOS,
  ErroProdutos,
} from './errors/erros-produtos'
import {
  atualizarCategoriaProdutoSchema,
  criarCategoriaProdutoSchema,
  inativarCategoriaProdutoSchema,
  listarCategoriasProdutoSchema,
  reativarCategoriaProdutoSchema,
} from './schemas/categoria-produto.schema'
import {
  atualizarProdutoSchema,
  buscarProdutosSchema,
  criarProdutoSchema,
  inativarProdutoSchema,
  listarProdutosSchema,
  obterProdutoPorIdSchema,
  reativarProdutoSchema,
} from './schemas/produto.schema'
import { atualizarCategoriaProduto } from './use-cases/atualizar-categoria-produto'
import { criarCategoriaProduto } from './use-cases/criar-categoria-produto'
import { criarProduto } from './use-cases/criar-produto'
import { inativarCategoriaProduto } from './use-cases/inativar-categoria-produto'
import { inativarProduto } from './use-cases/inativar-produto'
import { reativarCategoriaProduto } from './use-cases/reativar-categoria-produto'
import { reativarProduto } from './use-cases/reativar-produto'
import { listarCategoriasProduto } from './use-cases/listar-categorias-produto'
import { listarProdutos } from './use-cases/listar-produtos'
import { buscarProdutos } from './use-cases/buscar-produtos'
import { atualizarProduto } from './use-cases/atualizar-produto'
import { obterProdutoPorId } from './use-cases/obter-produto-por-id'

function tratarErroProdutos(erro: unknown): never {
  if (erro instanceof ErroProdutos) {
    throw erro
  }

  if (erro instanceof ZodError) {
    throw new ErroProdutos(
      CODIGOS_ERRO_PRODUTOS.ENTRADA_INVALIDA,
      erro.issues[0]?.message ?? 'Entrada invalida.',
    )
  }

  throw erro
}

export function registrarHandlersProdutos(): void {
  ipcMain.handle(
    CANAIS_IPC.PRODUTOS_CRIAR_CATEGORIA,
    (_evento, entradaDesconhecida) => {
      try {
        const entrada = criarCategoriaProdutoSchema.parse(entradaDesconhecida)
        return criarCategoriaProduto(entrada)
      } catch (erro) {
        tratarErroProdutos(erro)
      }
    },
  )

  ipcMain.handle(
    CANAIS_IPC.PRODUTOS_LISTAR_CATEGORIAS,
    (_evento, entradaDesconhecida) => {
      try {
        const entrada = listarCategoriasProdutoSchema.parse(entradaDesconhecida)
        return listarCategoriasProduto(entrada)
      } catch (erro) {
        tratarErroProdutos(erro)
      }
    },
  )

  ipcMain.handle(
    CANAIS_IPC.PRODUTOS_ATUALIZAR_CATEGORIA,
    (_evento, entradaDesconhecida) => {
      try {
        const entrada = atualizarCategoriaProdutoSchema.parse(entradaDesconhecida)
        return atualizarCategoriaProduto(entrada)
      } catch (erro) {
        tratarErroProdutos(erro)
      }
    },
  )

  ipcMain.handle(
    CANAIS_IPC.PRODUTOS_INATIVAR_CATEGORIA,
    (_evento, entradaDesconhecida) => {
      try {
        const entrada = inativarCategoriaProdutoSchema.parse(entradaDesconhecida)
        return inativarCategoriaProduto(entrada)
      } catch (erro) {
        tratarErroProdutos(erro)
      }
    },
  )

  ipcMain.handle(
    CANAIS_IPC.PRODUTOS_REATIVAR_CATEGORIA,
    (_evento, entradaDesconhecida) => {
      try {
        const entrada = reativarCategoriaProdutoSchema.parse(entradaDesconhecida)
        return reativarCategoriaProduto(entrada)
      } catch (erro) {
        tratarErroProdutos(erro)
      }
    },
  )

  ipcMain.handle(CANAIS_IPC.PRODUTOS_CRIAR_PRODUTO, (_evento, entradaDesconhecida) => {
    try {
      const entrada = criarProdutoSchema.parse(entradaDesconhecida)
      return criarProduto(entrada)
    } catch (erro) {
      tratarErroProdutos(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.PRODUTOS_LISTAR_PRODUTOS, (_evento, entradaDesconhecida) => {
    try {
      const entrada = listarProdutosSchema.parse(entradaDesconhecida)
      return listarProdutos(entrada)
    } catch (erro) {
      tratarErroProdutos(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.PRODUTOS_BUSCAR_PRODUTOS, (_evento, entradaDesconhecida) => {
    try {
      const entrada = buscarProdutosSchema.parse(entradaDesconhecida)
      return buscarProdutos(entrada)
    } catch (erro) {
      tratarErroProdutos(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.PRODUTOS_ATUALIZAR_PRODUTO, (_evento, entradaDesconhecida) => {
    try {
      const entrada = atualizarProdutoSchema.parse(entradaDesconhecida)
      return atualizarProduto(entrada)
    } catch (erro) {
      tratarErroProdutos(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.PRODUTOS_INATIVAR_PRODUTO, (_evento, entradaDesconhecida) => {
    try {
      const entrada = inativarProdutoSchema.parse(entradaDesconhecida)
      return inativarProduto(entrada)
    } catch (erro) {
      tratarErroProdutos(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.PRODUTOS_REATIVAR_PRODUTO, (_evento, entradaDesconhecida) => {
    try {
      const entrada = reativarProdutoSchema.parse(entradaDesconhecida)
      return reativarProduto(entrada)
    } catch (erro) {
      tratarErroProdutos(erro)
    }
  })

  ipcMain.handle(
    CANAIS_IPC.PRODUTOS_OBTER_PRODUTO_POR_ID,
    (_evento, entradaDesconhecida) => {
      try {
        const entrada = obterProdutoPorIdSchema.parse(entradaDesconhecida)
        return obterProdutoPorId(entrada)
      } catch (erro) {
        tratarErroProdutos(erro)
      }
    },
  )
}
