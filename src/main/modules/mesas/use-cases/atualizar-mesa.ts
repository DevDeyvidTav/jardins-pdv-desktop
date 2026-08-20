import type { AtualizarMesaEntrada, Mesa } from '@shared/types/mesa'
import { CODIGOS_ERRO_MESAS, ErroMesas } from '../errors/erros-mesas'
import type { MesaRepository } from '../repositories/mesa.repository'
import { criarMesaRepository } from '../repositories/mesa.repository'
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { registrarMesaSync } from '../../sincronizacao/services/registrar-cadastro-sync'

export function criarAtualizarMesa(repositorio: MesaRepository = criarMesaRepository()) {
  return function atualizarMesa(entrada: AtualizarMesaEntrada): Mesa {
    const existente = repositorio.buscarPorId(entrada.mesaId)

    if (!existente) {
      throw new ErroMesas(CODIGOS_ERRO_MESAS.MESA_NAO_ENCONTRADA, 'Mesa nao encontrada.')
    }

    if (entrada.nome !== undefined && entrada.nome.trim() === '') {
      throw new ErroMesas(CODIGOS_ERRO_MESAS.ENTRADA_INVALIDA, 'Nome da mesa e invalido.')
    }

    const mesa = repositorio.atualizar({
      mesaId: entrada.mesaId,
      numero: entrada.numero,
      nome: entrada.nome?.trim(),
    })
    registrarMesaSync(mesa, OPERACAO_SYNC.UPDATE)
    return mesa
  }
}

export const atualizarMesa = criarAtualizarMesa()
