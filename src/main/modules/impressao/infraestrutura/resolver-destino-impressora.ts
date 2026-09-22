import { SETOR_IMPRESSAO, type SetorImpressao } from '@shared/types/config-impressora'

import { criarConfigImpressoraRepository } from '../../configuracoes/repositories/config-impressora.repository'

import {
  consultarPortNameImpressoraWindows,
  detectarPortaComAtual,
  listarPortasComWindows,
  normalizarPortaCom,
  obterNomeImpressoraLocal,
  obterPortaImpressoraLocal,
  portaImpressoraEhVirtual,
  resolverDestinoImpressao,
  resolverPortaComImpressora,
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

  const portName = consultarPortNameImpressoraWindows(nome)

  const comLive = normalizarPortaCom(portName)

  const comSalva = normalizarPortaCom(config.portaCom)



  if (comLive) {

    return {

      tipo: 'COM',

      porta: comLive,

      nomeImpressora: nome,

    }

  }



  // Bematech_USB e portas virtuais → COM direto (spooler trava com job Retained)

  if (portName && portaImpressoraEhVirtual(portName)) {

    return {

      tipo: 'COM',

      porta: resolverPortaComImpressora(
        nome,
        config.portaCom,
        env,
        detectarPortaComAtual,
        listarPortasComWindows,
      ),

      nomeImpressora: nome,

    }

  }



  if (portName) {

    return { tipo: 'SPOOLER', nome }

  }



  if (comSalva || env.PDV_IMPRESSORA_COM === '1') {

    return {

      tipo: 'COM',

      porta: resolverPortaComImpressora(
        nome,
        config.portaCom,
        env,
        detectarPortaComAtual,
        listarPortasComWindows,
      ),

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


