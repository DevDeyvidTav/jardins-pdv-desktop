import { SETOR_IMPRESSAO, type SetorImpressao } from '@shared/types/config-impressora'
import {
  normalizarEnderecoImpressora,
  normalizarMacImpressora,
} from '@shared/utils/endereco-impressora'

import { criarConfigImpressoraRepository } from '../../configuracoes/repositories/config-impressora.repository'

import {
  consultarPortNameImpressoraWindows,
  normalizarPortaCom,
  obterNomeImpressoraLocal,
  obterPortaImpressoraLocal,
  resolverDestinoImpressao,
  type DestinoImpressao,
} from './enviar-impressora'

export function resolverDestinoImpressoraPorSetor(
  setor: SetorImpressao,
  repositorio = criarConfigImpressoraRepository(),
  env: NodeJS.ProcessEnv = process.env,
): DestinoImpressao {
  const padrao = resolverDestinoImpressao(env)
  if (padrao.tipo === 'SIMULADO') {
    return padrao
  }

  const config = repositorio.buscarPorSetor(setor)
  const rede = normalizarEnderecoImpressora(config?.enderecoIp)
  if (!config?.nomeImpressora.trim() && !rede) {
    return { tipo: 'NAO_CONFIGURADO' }
  }

  const nome = config?.nomeImpressora.trim() || rede?.host || setor

  // IP da cozinha vence COM e o nome da NFC-e. O cupom sai na porta 9100.
  if (rede) {
    return {
      tipo: 'REDE',
      host: rede.host,
      porta: rede.porta,
      nomeImpressora: nome,
      mac: normalizarMacImpressora(config?.macRede),
      setor,
    }
  }

  const comSalva = normalizarPortaCom(config?.portaCom)

  // A COM do setor vence Get-Printer. No restaurante várias térmicas aparecem
  // com o mesmo nome (MP-4200 TH / NFC-e); a consulta devolve a porta da caixa
  // e as comandas da cozinha iam todas para a NFC-e.
  if (comSalva) {
    return {
      tipo: 'COM',
      porta: comSalva,
      nomeImpressora: nome,
    }
  }

  const portName = consultarPortNameImpressoraWindows(nome)
  const comLive = normalizarPortaCom(portName)
  if (comLive) {
    return {
      tipo: 'COM',
      porta: comLive,
      nomeImpressora: nome,
    }
  }

  return { tipo: 'SPOOLER', nome }
}

export function resolverDestinoConta(
  repositorio = criarConfigImpressoraRepository(),
  env: NodeJS.ProcessEnv = process.env,
): DestinoImpressao {
  return resolverDestinoImpressoraPorSetor(SETOR_IMPRESSAO.BALCAO, repositorio, env)
}

export function obterNomeImpressoraPadrao(env: NodeJS.ProcessEnv = process.env): string {
  return obterNomeImpressoraLocal(env)
}

export function obterPortaImpressoraPadrao(env: NodeJS.ProcessEnv = process.env): string {
  return obterPortaImpressoraLocal(env)
}
