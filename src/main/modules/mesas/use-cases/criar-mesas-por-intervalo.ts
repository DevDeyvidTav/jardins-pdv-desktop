import type { CriarMesasPorIntervaloEntrada, Mesa } from '@shared/types/mesa'
import { CODIGOS_ERRO_MESAS, ErroMesas } from '../errors/erros-mesas'
import type { MesaRepository } from '../repositories/mesa.repository'
import { criarMesaRepository } from '../repositories/mesa.repository'
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { registrarMesaSync } from '../../sincronizacao/services/registrar-cadastro-sync'

export function criarCriarMesasPorIntervalo(
  repositorio: MesaRepository = criarMesaRepository(),
) {
  return function criarMesasPorIntervalo(
    entrada: CriarMesasPorIntervaloEntrada,
  ): Mesa[] {
    if (entrada.numeroInicial < 1 || entrada.numeroFinal < 1) {
      throw new ErroMesas(
        CODIGOS_ERRO_MESAS.NUMERO_OBRIGATORIO,
        'Numeros de mesa devem ser maiores que zero.',
      )
    }

    if (entrada.numeroFinal < entrada.numeroInicial) {
      throw new ErroMesas(
        CODIGOS_ERRO_MESAS.INTERVALO_INVALIDO,
        'Numero final deve ser maior ou igual ao numero inicial.',
      )
    }

    const mesasCriadas: Mesa[] = []

    for (let numero = entrada.numeroInicial; numero <= entrada.numeroFinal; numero++) {
      const existente = repositorio.buscarPorNumero(numero)

      if (existente) {
        continue
      }

      const mesa = repositorio.inserir({ numero })
      registrarMesaSync(mesa, OPERACAO_SYNC.CREATE)
      mesasCriadas.push(mesa)
    }

    return mesasCriadas
  }
}

export const criarMesasPorIntervalo = criarCriarMesasPorIntervalo()
