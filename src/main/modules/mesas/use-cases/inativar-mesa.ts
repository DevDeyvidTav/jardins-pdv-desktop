import type { InativarMesaEntrada, Mesa } from '@shared/types/mesa'
import { CODIGOS_ERRO_MESAS, ErroMesas } from '../errors/erros-mesas'
import type { MesaRepository } from '../repositories/mesa.repository'
import { criarMesaRepository } from '../repositories/mesa.repository'
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { registrarMesaSync } from '../../sincronizacao/services/registrar-cadastro-sync'

export function criarInativarMesa(repositorio: MesaRepository = criarMesaRepository()) {
  return function inativarMesa(entrada: InativarMesaEntrada): Mesa {
    const existente = repositorio.buscarPorId(entrada.mesaId)

    if (!existente) {
      throw new ErroMesas(CODIGOS_ERRO_MESAS.MESA_NAO_ENCONTRADA, 'Mesa nao encontrada.')
    }

    const mesa = repositorio.inativar(entrada.mesaId)
    registrarMesaSync(mesa, OPERACAO_SYNC.UPDATE)
    return mesa
  }
}

export const inativarMesa = criarInativarMesa()
