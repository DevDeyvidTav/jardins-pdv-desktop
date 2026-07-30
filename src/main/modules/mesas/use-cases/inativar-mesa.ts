import type { InativarMesaEntrada, Mesa } from '@shared/types/mesa'
import { CODIGOS_ERRO_MESAS, ErroMesas } from '../errors/erros-mesas'
import type { MesaRepository } from '../repositories/mesa.repository'
import { criarMesaRepository } from '../repositories/mesa.repository'

export function criarInativarMesa(repositorio: MesaRepository = criarMesaRepository()) {
  return function inativarMesa(entrada: InativarMesaEntrada): Mesa {
    const existente = repositorio.buscarPorId(entrada.mesaId)

    if (!existente) {
      throw new ErroMesas(CODIGOS_ERRO_MESAS.MESA_NAO_ENCONTRADA, 'Mesa nao encontrada.')
    }

    return repositorio.inativar(entrada.mesaId)
  }
}

export const inativarMesa = criarInativarMesa()
