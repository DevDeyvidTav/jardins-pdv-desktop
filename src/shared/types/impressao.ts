export const TIPO_DOCUMENTO_IMPRESSAO = {
  CONTA: 'CONTA',
  COMANDA: 'COMANDA',
} as const

export type TipoDocumentoImpressao =
  (typeof TIPO_DOCUMENTO_IMPRESSAO)[keyof typeof TIPO_DOCUMENTO_IMPRESSAO]

export const SETOR_COZINHA = {
  PIZZA: 'PIZZA',
  JAPONESA: 'JAPONESA',
  CHINESA: 'CHINESA',
} as const

export type SetorCozinha = (typeof SETOR_COZINHA)[keyof typeof SETOR_COZINHA]

export const SETORES_COZINHA = [
  SETOR_COZINHA.PIZZA,
  SETOR_COZINHA.JAPONESA,
  SETOR_COZINHA.CHINESA,
] as const

export const SETOR_COMANDA = {
  ...SETOR_COZINHA,
  COZINHA: 'COZINHA',
} as const

export type SetorComanda = (typeof SETOR_COMANDA)[keyof typeof SETOR_COMANDA]

export interface ImprimirPedidoEntrada {
  pedidoId: string
}

export interface ImprimirAmostraEntrada {
  tipo: TipoDocumentoImpressao
  setor?: SetorCozinha
}

export interface ResultadoImpressaoAmostra {
  tipo: TipoDocumentoImpressao
  setor: SetorComanda | null
  linhas: string[]
  texto: string
  impresso: boolean
  aviso: string | null
}

export type ResultadoImpressao = ResultadoImpressaoAmostra

export interface ItemDocumentoImpressao {
  quantidade: number
  nome: string
  detalhes: string[]
  observacao: string | null
  precoUnitarioCentavos: number
  totalCentavos: number
  setor: SetorComanda
  cancelado: boolean
}

export interface PagamentoDocumentoImpressao {
  formaRotulo: string
  valorCentavos: number
}

export interface DocumentoContaImpressao {
  estabelecimento: string
  tipoPedido: 'MESA' | 'BALCAO' | 'DELIVERY'
  mesaNumero: number | null
  referencia: number
  emitidoEm: string
  itens: ItemDocumentoImpressao[]
  subtotalCentavos: number
  descontoItensCentavos: number
  descontoPedidoCentavos: number
  taxaEntregaCentavos: number
  totalCentavos: number
  valorPagoCentavos: number
  valorCortesiaCentavos: number
  valorRestanteCentavos: number
  pagamentos: PagamentoDocumentoImpressao[]
}

export interface DocumentoComandaImpressao {
  setor: SetorComanda
  tipoPedido: 'MESA' | 'BALCAO' | 'DELIVERY'
  mesaNumero: number | null
  referencia: number
  emitidoEm: string
  itens: ItemDocumentoImpressao[]
  via: '1a via' | 'REIMPRESSAO'
}
