export const STATUS_MESA = {
  LIVRE: 'LIVRE',
  OCUPADA: 'OCUPADA',
  AGRUPADA: 'AGRUPADA',
  INATIVA: 'INATIVA',
} as const

export type StatusMesa = (typeof STATUS_MESA)[keyof typeof STATUS_MESA]

/** Uso operacional da “mesa” no grid — balcão/delivery não agrupam nem transferem. */
export const TIPO_USO_MESA = {
  COMUM: 'COMUM',
  BALCAO: 'BALCAO',
  DELIVERY: 'DELIVERY',
} as const

export type TipoUsoMesa = (typeof TIPO_USO_MESA)[keyof typeof TIPO_USO_MESA]

export interface Mesa {
  id: string
  numero: number
  nome: string
  status: StatusMesa
  tipoUso: TipoUsoMesa
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
}

export interface CriarMesasPorIntervaloEntrada {
  numeroInicial: number
  numeroFinal: number
  tipoUso?: TipoUsoMesa
}

export interface AtualizarMesaEntrada {
  mesaId: string
  numero?: number
  nome?: string
  tipoUso?: TipoUsoMesa
}

export interface InativarMesaEntrada {
  mesaId: string
}

export interface ExcluirMesasPorIntervaloEntrada {
  numeroInicial: number
  numeroFinal: number
  tipoUso: TipoUsoMesa
}

export interface ExcluirMesasPorIntervaloResultado {
  excluidas: number
}

export interface SequenciaMesas {
  tipoUso: TipoUsoMesa
  numeroInicial: number
  numeroFinal: number
  quantidade: number
  mesaIds: string[]
}

export const STATUS_AGRUPAMENTO_MESA = {
  ATIVO: 'ATIVO',
  ENCERRADO: 'ENCERRADO',
} as const

export type StatusAgrupamentoMesa =
  (typeof STATUS_AGRUPAMENTO_MESA)[keyof typeof STATUS_AGRUPAMENTO_MESA]

export const TIPO_MOVIMENTACAO_MESA = {
  PEDIDO_ABERTO_NA_MESA: 'PEDIDO_ABERTO_NA_MESA',
  PEDIDO_TRANSFERIDO: 'PEDIDO_TRANSFERIDO',
  MESAS_AGRUPADAS: 'MESAS_AGRUPADAS',
  AGRUPAMENTO_ENCERRADO: 'AGRUPAMENTO_ENCERRADO',
  PEDIDO_FINALIZADO: 'PEDIDO_FINALIZADO',
  PEDIDO_CANCELADO: 'PEDIDO_CANCELADO',
} as const

export type TipoMovimentacaoMesa =
  (typeof TIPO_MOVIMENTACAO_MESA)[keyof typeof TIPO_MOVIMENTACAO_MESA]

export const MOTIVO_ENCERRAMENTO_AGRUPAMENTO = {
  PEDIDO_FINALIZADO: 'PEDIDO_FINALIZADO',
  PEDIDO_CANCELADO: 'PEDIDO_CANCELADO',
  ENCERRAMENTO_MANUAL: 'ENCERRAMENTO_MANUAL',
} as const

export type MotivoEncerramentoAgrupamento =
  (typeof MOTIVO_ENCERRAMENTO_AGRUPAMENTO)[keyof typeof MOTIVO_ENCERRAMENTO_AGRUPAMENTO]

export interface MesaAgrupamento {
  id: string
  pedidoId: string
  mesaPrincipalId: string
  status: StatusAgrupamentoMesa
  criadoEm: string
  encerradoEm: string | null
  motivoEncerramento: string | null
}

export interface MesaAgrupada {
  id: string
  mesaAgrupamentoId: string
  mesaId: string
  ehPrincipal: boolean
  adicionadaEm: string
  removidaEm: string | null
}

export interface PedidoMesaMovimentacao {
  id: string
  pedidoId: string
  tipo: TipoMovimentacaoMesa
  mesaOrigemId: string | null
  mesaDestinoId: string | null
  mesaAgrupamentoId: string | null
  dadosAntesJson: string
  dadosDepoisJson: string
  motivo: string | null
  operadorId: string | null
  criadoEm: string
}

export interface TransferirPedidoMesaEntrada {
  pedidoId: string
  mesaDestinoId: string
  motivo: string
}

export interface AgruparMesasPedidoEntrada {
  pedidoId: string
  mesaIds: string[]
  motivo?: string
}

export interface EncerrarAgrupamentoMesaEntrada {
  pedidoId: string
  motivo: MotivoEncerramentoAgrupamento
  observacao?: string
}

export interface ObterAgrupamentoPedidoEntrada {
  pedidoId: string
}

export interface ListarHistoricoMesaEntrada {
  mesaId: string
}

export interface ListarHistoricoPedidoMesaEntrada {
  pedidoId: string
}

export interface ResumoMesaAgrupamento {
  agrupamento: {
    id: string
    status: StatusAgrupamentoMesa
    criadoEm: string
    encerradoEm: string | null
  }
  pedidoId: string
  mesaPrincipal: {
    id: string
    numero: number
  }
  mesas: Array<{
    id: string
    numero: number
    ehPrincipal: boolean
    status: string
    adicionadaEm: string
    removidaEm: string | null
  }>
}

export interface TransferirPedidoMesaResultado {
  pedidoId: string
  mesaOrigem: { id: string; numero: number }
  mesaDestino: { id: string; numero: number }
}

export interface AgruparMesasPedidoResultado {
  pedidoId: string
  agrupamentoId: string
  mesaPrincipal: { id: string; numero: number }
  mesas: Array<{ id: string; numero: number; ehPrincipal: boolean }>
}
