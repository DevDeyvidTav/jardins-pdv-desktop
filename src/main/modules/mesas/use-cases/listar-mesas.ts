import type { Mesa } from '@shared/types/mesa'
import type { MesaRepository } from '../repositories/mesa.repository'
import { criarMesaRepository } from '../repositories/mesa.repository'

export function criarListarMesas(repositorio: MesaRepository = criarMesaRepository()) {
  return function listarMesas(): Mesa[] {
    return repositorio.listar()
  }
}

export const listarMesas = criarListarMesas()
