import { ipcMain } from 'electron'
import { ZodError } from 'zod'
import { CANAIS_IPC } from '@shared/types/canais-ipc'
import {
  CODIGOS_ERRO_PRODUTOS,
  ErroProdutos,
} from '../produtos/errors/erros-produtos'
import { buscarCategoriasCatalogoSchema } from './schemas/categoria-catalogo.schema'
import { buscarCategoriasCatalogo } from './use-cases/buscar-categorias-catalogo'

function tratarErroCatalogo(erro: unknown): never {
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

export function registrarHandlersCatalogo(): void {
  ipcMain.handle(
    CANAIS_IPC.CATALOGO_BUSCAR_CATEGORIAS,
    (_evento, entradaDesconhecida) => {
      try {
        const entrada = buscarCategoriasCatalogoSchema.parse(entradaDesconhecida)
        return buscarCategoriasCatalogo(entrada)
      } catch (erro) {
        tratarErroCatalogo(erro)
      }
    },
  )
}
