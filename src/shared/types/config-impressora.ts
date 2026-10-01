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

/** Dispositivo de impressão visto pelo Gerenciador de Dispositivos (PnP). */
export interface DispositivoImpressaoDetectado {
  nome: string
  classe: string | null
  status: string | null
}

export const ACAO_DIAGNOSTICO_IMPRESSORA = {
  INSTALAR_GENERICA: 'INSTALAR_GENERICA',
  USAR_PORTA_COM: 'USAR_PORTA_COM',
  VERIFICAR_CONEXAO: 'VERIFICAR_CONEXAO',
} as const

export type AcaoDiagnosticoImpressora =
  (typeof ACAO_DIAGNOSTICO_IMPRESSORA)[keyof typeof ACAO_DIAGNOSTICO_IMPRESSORA]

export const TIPO_DIAGNOSTICO_IMPRESSORA = {
  /** Porta USB de impressão existe, mas nenhuma fila de impressão usa ela. */
  SEM_FILA_USB: 'SEM_FILA_USB',
  /** Dispositivo PnP de impressão com status de erro (driver quebrado/ausente). */
  DISPOSITIVO_COM_ERRO: 'DISPOSITIVO_COM_ERRO',
  /** Porta COM ativa sem impressora associada (térmica serial/USB). */
  PORTA_COM_LIVRE: 'PORTA_COM_LIVRE',
  /** Nada detectado em nenhuma fonte. */
  NENHUMA_IMPRESSORA: 'NENHUMA_IMPRESSORA',
} as const

export type TipoDiagnosticoImpressora =
  (typeof TIPO_DIAGNOSTICO_IMPRESSORA)[keyof typeof TIPO_DIAGNOSTICO_IMPRESSORA]

export interface DiagnosticoImpressora {
  tipo: TipoDiagnosticoImpressora
  titulo: string
  detalhe: string
  acao: AcaoDiagnosticoImpressora
  /** Porta alvo da ação (USB00x ou COMx), quando aplicável. */
  porta: string | null
}

export interface ImpressorasSistemaResposta {
  impressoras: ImpressoraDetectada[]
  portasCom: PortaComDetectada[]
  portasUsbLivres: string[]
  dispositivos: DispositivoImpressaoDetectado[]
  diagnosticos: DiagnosticoImpressora[]
}

export interface InstalarImpressoraGenericaEntrada {
  porta?: string | null
  nomeSugerido?: string | null
}

export interface ResultadoInstalacaoImpressoraGenerica {
  instalada: boolean
  nomeImpressora: string | null
  porta: string | null
  mensagem: string
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
