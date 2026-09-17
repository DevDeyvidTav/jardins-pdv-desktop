import type {
  BuscarCategoriasCatalogoEntrada,
  CategoriaCatalogo,
} from '@shared/types/categoria-catalogo'
import {
  criarCatalogoCategoriaBuscaRepository,
  type CatalogoCategoriaBuscaRepository,
} from '../repositories/catalogo-categoria-busca.repository'

export function criarBuscarCategoriasCatalogo(
  repositorio: CatalogoCategoriaBuscaRepository = criarCatalogoCategoriaBuscaRepository(),
) {
  return function buscarCategoriasCatalogo(
    entrada?: BuscarCategoriasCatalogoEntrada,
  ): CategoriaCatalogo[] {
    return repositorio.buscar(entrada)
  }
}

export const buscarCategoriasCatalogo = criarBuscarCategoriasCatalogo()
