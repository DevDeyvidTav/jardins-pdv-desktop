export const TIPO_PEDIDO = {
  MESA: 'MESA',
  BALCAO: 'BALCAO',
  DELIVERY: 'DELIVERY',
} as const

export type TipoPedido = (typeof TIPO_PEDIDO)[keyof typeof TIPO_PEDIDO]

export const STATUS_PEDIDO = {
  ABERTO: 'ABERTO',
  FINALIZADO: 'FINALIZADO',
  CANCELADO: 'CANCELADO',
} as const

export type StatusPedido = (typeof STATUS_PEDIDO)[keyof typeof STATUS_PEDIDO]

export interface Pedido {
  id: string
  sessaoCaixaId: string
  mesaId: string | null
  /** Agrupamento ativo vinculado ao pedido de mesa, se houver. */
  mesaAgrupamentoId: string | null
  tipo: TipoPedido
  status: StatusPedido
  subtotalCentavos: number
  /** @deprecated Use descontoPedidoCentavos + descontoItensCentavos. */
  descontoCentavos: number
  /** Soma dos subtotais brutos dos itens ativos. */
  descontoItensCentavos: number
  /** Desconto geral aplicado sobre o pedido. */
  descontoPedidoCentavos: number
  /** Taxa de entrega em centavos (apenas para pedidos DELIVERY). */
  taxaEntregaCentavos: number
  totalCentavos: number
  /** Soma dos pagamentos financeiros (dinheiro, cartao, pix). */
  valorPagoCentavos: number
  /** Soma das cortesias concedidas para o pedido. */
  valorCortesiaCentavos: number
  /** Valor restante a pagar considerando descontos, pagamentos e cortesias. */
  valorRestanteCentavos: number
  criadoEm: string
  atualizadoEm: string
  finalizadoEm: string | null
  canceladoEm: string | null
  motivoCancelamento: string | null
}

export interface PedidoItem {
  id: string
  pedidoId: string
  produtoId: string
  produtoNome: string
  quantidade: number
  precoUnitarioCentavos: number
  subtotalCentavos: number
  descontoCentavos: number
  totalCentavos: number
  observacao: string | null
  criadoEm: string
  atualizadoEm: string
  /** Preenchido quando o item e cancelado (soft delete). */
  canceladoEm: string | null
  motivoCancelamento: string | null
}

export function itemPedidoEstaAtivo(item: PedidoItem): boolean {
  return item.canceladoEm === null
}

export interface ResumoPedido {
  pedido: Pedido
  itens: PedidoItem[]
  entrega: PedidoEntrega | null
  /** Divisao ativa ou quitada mais recente; null se nunca houve. */
  divisao: import('./divisao-conta').ResumoDivisaoConta | null
}

export interface CriarPedidoMesaEntrada {
  mesaId: string
}

export interface ObterPedidoAbertoPorMesaEntrada {
  mesaId: string
}

export interface AdicionarItemPedidoEntrada {
  pedidoId: string
  produtoId: string
  quantidade: number
  /** Desconto em centavos aplicado apenas neste item. */
  descontoCentavos?: number
  observacao?: string
}

export interface AlterarQuantidadeItemPedidoEntrada {
  pedidoId: string
  itemId: string
  quantidade: number
}

export interface CancelarItemPedidoEntrada {
  pedidoId: string
  itemId: string
  motivoCancelamento: string
}

/** @deprecated Preferir CancelarItemPedidoEntrada */
export type RemoverItemPedidoEntrada = CancelarItemPedidoEntrada

export interface AplicarDescontoPedidoEntrada {
  pedidoId: string
  descontoCentavos: number
  motivoDesconto?: string
}

export interface ObterResumoPedidoEntrada {
  pedidoId: string
  /** Inclui itens cancelados — util para cupom detalhado e relatorios. */
  incluirItensCancelados?: boolean
}

export interface CancelarPedidoEntrada {
  pedidoId: string
  motivoCancelamento: string
}

export const FILTRO_STATUS_HISTORICO_PEDIDO = {
  TODOS: 'TODOS',
  FINALIZADO: 'FINALIZADO',
  CANCELADO: 'CANCELADO',
} as const

export type FiltroStatusHistoricoPedido =
  (typeof FILTRO_STATUS_HISTORICO_PEDIDO)[keyof typeof FILTRO_STATUS_HISTORICO_PEDIDO]

export interface ListarHistoricoPedidosEntrada {
  status?: FiltroStatusHistoricoPedido
  formaPagamento?: import('./pagamento-pedido').FormaPagamento | ''
}

export interface ItemHistoricoPedido {
  pedido: Pedido
  mesaNumero: number | null
  formasPagamento: import('./pagamento-pedido').FormaPagamento[]
  totalPagoCentavos: number
}
export const STATUS_ENTREGA = {
  AGUARDANDO_PREPARO: 'AGUARDANDO_PREPARO',
  EM_PREPARO: 'EM_PREPARO',
  SAIU_PARA_ENTREGA: 'SAIU_PARA_ENTREGA',
  ENTREGUE: 'ENTREGUE',
  CANCELADA: 'CANCELADA',
} as const

export type StatusEntrega = (typeof STATUS_ENTREGA)[keyof typeof STATUS_ENTREGA]

export interface PedidoEntrega {
  id: string
  pedidoId: string
  clienteNome: string
  telefone: string | null
  observacao: string | null
  status: StatusEntrega
  saiuParaEntregaEm: string | null
  entregueEm: string | null
  canceladoEm: string | null
  motivoCancelamento: string | null
  criadoEm: string
  atualizadoEm: string
}

export interface CriarPedidoDeliveryEntrada {
  clienteNome: string
  telefone?: string
  observacao?: string
  /** Se omitido, usa a taxa padrao configurada. */
  taxaEntregaCentavos?: number
}

export interface ObterEntregaPorPedidoEntrada {
  pedidoId: string
}

export interface AtualizarDadosEntregaEntrada {
  pedidoId: string
  clienteNome?: string
  telefone?: string | null
  observacao?: string | null
}

export interface AtualizarTaxaEntregaEntrada {
  pedidoId: string
  taxaEntregaCentavos: number
}

export interface AtualizarStatusEntregaEntrada {
  pedidoId: string
  status: StatusEntrega
}

export interface ListarPedidosDeliveryAbertosEntrada {
  /** Filtrar por status de entrega (opcional). */
  status?: StatusEntrega
}

export interface ItemDeliveryAberto {
  pedido: Pedido
  entrega: PedidoEntrega
}

export interface ObterTaxaEntregaPadraoResultado {
  taxaEntregaPadraoCentavos: number
}

export interface DefinirTaxaEntregaPadraoEntrada {
  taxaEntregaPadraoCentavos: number
}
