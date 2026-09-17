export const SETOR_IMPRESSAO = {
  BALCAO: 'BALCAO',
  PIZZA: 'PIZZA',
  JAPONESA: 'JAPONESA',
  CHINESA: 'CHINESA',
  COZINHA: 'COZINHA',
} as const

export type SetorImpressao = (typeof SETOR_IMPRESSAO)[keyof typeof SETOR_IMPRESSAO]

/** Setores configuráveis no PDV (4 impressoras físicas). */
export const SETORES_IMPRESSORA_CONFIG = [
  SETOR_IMPRESSAO.BALCAO,
  SETOR_IMPRESSAO.PIZZA,
  SETOR_IMPRESSAO.JAPONESA,
  SETOR_IMPRESSAO.CHINESA,
] as const

export type SetorImpressoraConfig = (typeof SETORES_IMPRESSORA_CONFIG)[number]

/** Inclui COZINHA apenas para legado/fallback interno — não aparece na UI. */
export const SETORES_IMPRESSAO = [
  ...SETORES_IMPRESSORA_CONFIG,
  SETOR_IMPRESSAO.COZINHA,
] as const

export const ROTULOS_SETOR_IMPRESSAO: Record<SetorImpressao, string> = {
  BALCAO: 'Balcão / Caixa',
  PIZZA: 'Pizza',
  JAPONESA: 'Japonesa',
  CHINESA: 'Chinesa',
  COZINHA: 'Cozinha',
}

export interface ImpressoraDetectada {
  nome: string
  porta: string | null
  status: string | null
  padrao: boolean
}

export interface PortaComDetectada {
  porta: string
  impressora: string | null
}

export interface ImpressorasSistemaResposta {
  impressoras: ImpressoraDetectada[]
  portasCom: PortaComDetectada[]
}

export interface ConfigImpressora {
  id: string
  setor: SetorImpressao
  nomeImpressora: string
  portaCom: string | null
}

export interface ConfigImpressoraEntrada {
  setor: SetorImpressao
  nomeImpressora: string
  portaCom?: string | null
}

export interface SalvarConfigImpressorasEntrada {
  configs: ConfigImpressoraEntrada[]
}

export interface AtualizarSetorCategoriaEntrada {
  categoriaId: string
  setorImpressao: SetorImpressao | null
}
