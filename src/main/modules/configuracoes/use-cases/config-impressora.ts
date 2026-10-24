import type {
  ConfigImpressora,
  SalvarConfigImpressorasEntrada,
} from '@shared/types/config-impressora'
import {
  formatarEnderecoImpressora,
  normalizarEnderecoImpressora,
} from '@shared/utils/endereco-impressora'
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
        const rede = normalizarEnderecoImpressora(config.enderecoIp)
        const nomeInformado = config.nomeImpressora.trim()
        const nome = nomeInformado || (rede ? rede.host : '')
        const portaInformada = rede ? null : config.portaCom?.trim() || null
        const portaDetectada =
          portaInformada || rede ? null : detectarPortaComAtual(nome)

        return {
          setor: config.setor,
          nomeImpressora: nome,
          portaCom: portaInformada ?? portaDetectada,
          enderecoIp: rede ? formatarEnderecoImpressora(rede) : null,
        }
      }),
    )
  }
}

export const listarConfigImpressoras = criarListarConfigImpressoras()
export const salvarConfigImpressoras = criarSalvarConfigImpressoras()
