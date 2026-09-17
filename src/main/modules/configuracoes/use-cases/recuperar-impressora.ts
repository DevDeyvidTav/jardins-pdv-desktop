import { recuperarImpressoraWindows } from '../../impressao/infraestrutura/enviar-impressora'
import { criarConfigImpressoraRepository } from '../repositories/config-impressora.repository'

export interface StatusRecuperacaoImpressora {
  nome: string
  status: string | null
  jobCount: number | null
}

export function recuperarImpressoraSetor(
  nomeImpressora: string,
): StatusRecuperacaoImpressora {
  const nome = nomeImpressora.trim()
  if (!nome) {
    throw new Error('Informe o nome da impressora.')
  }

  const status = recuperarImpressoraWindows(nome)

  return {
    nome,
    status: status?.printerStatus ?? null,
    jobCount: status?.jobCount ?? null,
  }
}

export function recuperarImpressorasConfiguradas(
  repositorio = criarConfigImpressoraRepository(),
): StatusRecuperacaoImpressora[] {
  const configs = repositorio.listar()
  const nomes = [
    ...new Set(configs.map((config) => config.nomeImpressora.trim()).filter(Boolean)),
  ]

  return nomes.map((nome) => recuperarImpressoraSetor(nome))
}
