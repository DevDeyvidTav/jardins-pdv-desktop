import { z } from 'zod'
import { MOTIVO_ENCERRAMENTO_AGRUPAMENTO } from '@shared/types/mesa'

export const transferirPedidoMesaSchema = z.object({
  pedidoId: z.string().uuid('pedidoId invalido.'),
  mesaDestinoId: z.string().uuid('mesaDestinoId invalido.'),
  motivo: z.string().trim().min(1).max(500).optional(),
})

export const agruparMesasPedidoSchema = z.object({
  pedidoId: z.string().uuid('pedidoId invalido.'),
  mesaIds: z
    .array(z.string().uuid('mesaId invalido.'))
    .min(2, 'Informe ao menos duas mesas para agrupamento.'),
  motivo: z.string().trim().min(1).max(500).optional(),
})

export const encerrarAgrupamentoMesaSchema = z.object({
  pedidoId: z.string().uuid('pedidoId invalido.'),
  motivo: z.enum([
    MOTIVO_ENCERRAMENTO_AGRUPAMENTO.PEDIDO_FINALIZADO,
    MOTIVO_ENCERRAMENTO_AGRUPAMENTO.PEDIDO_CANCELADO,
    MOTIVO_ENCERRAMENTO_AGRUPAMENTO.ENCERRAMENTO_MANUAL,
  ]),
  observacao: z.string().trim().min(1).max(500).optional(),
})

export const obterAgrupamentoPedidoSchema = z.object({
  pedidoId: z.string().uuid('pedidoId invalido.'),
})

export const listarHistoricoMesaSchema = z.object({
  mesaId: z.string().uuid('mesaId invalido.'),
})

export const listarHistoricoPedidoMesaSchema = z.object({
  pedidoId: z.string().uuid('pedidoId invalido.'),
})
