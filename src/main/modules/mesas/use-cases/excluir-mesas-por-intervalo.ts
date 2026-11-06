import type {
  ExcluirMesasPorIntervaloEntrada,
  ExcluirMesasPorIntervaloResultado,
} from '@shared/types/mesa'
import { STATUS_MESA } from '@shared/types/mesa'
import { ENTIDADE_SYNC, OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { CODIGOS_ERRO_MESAS, ErroMesas } from '../errors/erros-mesas'
import type { MesaRepository } from '../repositories/mesa.repository'
import { criarMesaRepository } from '../repositories/mesa.repository'
import { registrarCadastroSync } from '../../sincronizacao/services/registrar-cadastro-sync'

export function criarExcluirMesasPorIntervalo(
  repositorio: MesaRepository = criarMesaRepository(),
) {
  return function excluirMesasPorIntervalo(
    entrada: ExcluirMesasPorIntervaloEntrada,
  ): ExcluirMesasPorIntervaloResultado {
    const mesas = repositorio.listarPorIntervaloETipo(
      entrada.numeroInicial,
      entrada.numeroFinal,
      entrada.tipoUso,
    )

    if (mesas.length === 0) {
      throw new ErroMesas(
        CODIGOS_ERRO_MESAS.SEQUENCIA_MESAS_VAZIA,
        'Nenhuma mesa ativa encontrada nesse intervalo.',
      )
    }

    const bloqueada = mesas.find(
      (mesa) =>
        mesa.status === STATUS_MESA.OCUPADA ||
        mesa.status === STATUS_MESA.AGRUPADA ||
        repositorio.possuiPedidoAbertoVinculado(mesa.id),
    )

    if (bloqueada) {
      throw new ErroMesas(
        CODIGOS_ERRO_MESAS.MESA_POSSUI_PEDIDO_VINCULADO,
        `Nao e possivel apagar a sequencia: a posicao ${bloqueada.numero} ainda tem pedido aberto.`,
      )
    }

    for (const mesa of mesas) {
      repositorio.excluir(mesa.id)
      registrarCadastroSync(ENTIDADE_SYNC.MESA, mesa.id, OPERACAO_SYNC.CANCEL, {
        id: mesa.id,
        numero: mesa.numero,
        tipoUso: mesa.tipoUso,
      })
    }

    return { excluidas: mesas.length }
  }
}

export const excluirMesasPorIntervalo = criarExcluirMesasPorIntervalo()
