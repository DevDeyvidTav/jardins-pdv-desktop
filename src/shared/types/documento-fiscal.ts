export const STATUS_DOCUMENTO_FISCAL = {
  PENDENTE: 'PENDENTE',
  PROCESSANDO: 'PROCESSANDO',
  AUTORIZADO: 'AUTORIZADO',
  REJEITADO: 'REJEITADO',
  CANCELADO: 'CANCELADO',
  CONTINGENCIA: 'CONTINGENCIA',
} as const

export type StatusDocumentoFiscal =
  (typeof STATUS_DOCUMENTO_FISCAL)[keyof typeof STATUS_DOCUMENTO_FISCAL]

export interface DocumentoFiscalLocal {
  id: string
  pedidoId: string
  tipo: string
  status: StatusDocumentoFiscal
  numero: number | null
  serie: number | null
  chaveAcesso: string | null
  protocoloAutorizacao: string | null
  qrCode: string | null
  xmlUrl: string | null
  danfeUrl: string | null
  valorTotal: string
  codigoRejeicao: string | null
  mensagemRejeicao: string | null
  impressoEm: string | null
  autorizadoEm: string | null
  canceladoEm: string | null
  atualizadoEm: string
  criadoEm: string
}

export interface DocumentoFiscalInbox {
  id: string
  pedidoId: string
  tipo: string
  status: StatusDocumentoFiscal
  numero: number | null
  serie: number | null
  chaveAcesso: string | null
  protocoloAutorizacao: string | null
  qrCode: string | null
  xmlUrl: string | null
  danfeUrl: string | null
  valorTotal: string
  codigoRejeicao: string | null
  mensagemRejeicao: string | null
  autorizadoEm: string | null
  canceladoEm: string | null
  atualizadoEm: string
  criadoEm: string
}

export interface AtualizarSolicitacaoFiscalEntrada {
  pedidoId: string
  fiscalSolicitado: boolean
  fiscalCpfDestinatario?: string | null
}

export interface ImprimirDanfeNfceEntrada {
  pedidoId: string
}

export const ROTULO_STATUS_DOCUMENTO_FISCAL: Record<StatusDocumentoFiscal, string> = {
  PENDENTE: 'Aguardando',
  PROCESSANDO: 'Processando',
  AUTORIZADO: 'Autorizada',
  REJEITADO: 'Rejeitada',
  CANCELADO: 'Cancelada',
  CONTINGENCIA: 'Contingência',
}
