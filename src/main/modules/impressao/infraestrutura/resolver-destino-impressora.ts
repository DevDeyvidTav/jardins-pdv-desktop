import { SETOR_IMPRESSAO, type SetorImpressao } from '@shared/types/config-impressora'

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
  if (!config?.nomeImpressora.trim()) {
    return { tipo: 'NAO_CONFIGURADO' }
  }

  const nome = config.nomeImpressora.trim()
  const comSalva = normalizarPortaCom(config.portaCom)

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
