import type { AtualizarMesaEntrada, Mesa } from '@shared/types/mesa'
import { CODIGOS_ERRO_MESAS, ErroMesas } from '../errors/erros-mesas'
import type { MesaRepository } from '../repositories/mesa.repository'
import { criarMesaRepository } from '../repositories/mesa.repository'

export function criarAtualizarMesa(repositorio: MesaRepository = criarMesaRepository()) {
  return function atualizarMesa(entrada: AtualizarMesaEntrada): Mesa {
    const existente = repositorio.buscarPorId(entrada.mesaId)

    if (!existente) {
      throw new ErroMesas(CODIGOS_ERRO_MESAS.MESA_NAO_ENCONTRADA, 'Mesa nao encontrada.')
    }

    if (entrada.nome !== undefined && entrada.nome.trim() === '') {
      throw new ErroMesas(CODIGOS_ERRO_MESAS.ENTRADA_INVALIDA, 'Nome da mesa e invalido.')
    }

    return repositorio.atualizar({
      mesaId: entrada.mesaId,
      numero: entrada.numero,
      nome: entrada.nome?.trim(),
    })
  }
}

export const atualizarMesa = criarAtualizarMesa()
