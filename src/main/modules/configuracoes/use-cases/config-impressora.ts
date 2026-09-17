import type {
  ConfigImpressora,
  SalvarConfigImpressorasEntrada,
} from '@shared/types/config-impressora'
import { detectarPortaComAtual } from '../../impressao/infraestrutura/enviar-impressora'
import { criarConfigImpressoraRepository } from '../repositories/config-impressora.repository'

export function criarListarConfigImpressoras(
  repositorio = criarConfigImpressoraRepository(),
) {
  return function listarConfigImpressoras(): ConfigImpressora[] {
    return repositorio.listar()
  }
}

export function criarSalvarConfigImpressoras(
  repositorio = criarConfigImpressoraRepository(),
) {
  return function salvarConfigImpressoras(
    entrada: SalvarConfigImpressorasEntrada,
  ): ConfigImpressora[] {
    return repositorio.salvarTodas(
      entrada.configs.map((config) => {
        const nome = config.nomeImpressora.trim()
        const portaInformada = config.portaCom?.trim() || null
        const portaDetectada = portaInformada
          ? null
          : detectarPortaComAtual(nome)

        return {
          setor: config.setor,
          nomeImpressora: nome,
          portaCom: portaInformada ?? portaDetectada,
        }
      }),
    )
  }
}

export const listarConfigImpressoras = criarListarConfigImpressoras()
export const salvarConfigImpressoras = criarSalvarConfigImpressoras()
