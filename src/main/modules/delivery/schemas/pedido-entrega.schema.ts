import { z } from 'zod'
import { STATUS_ENTREGA } from '@shared/types/pedido'

export const criarPedidoDeliverySchema = z.object({
  clienteNome: z
    .string()
    .trim()
    .min(2, 'Nome do cliente deve ter no minimo 2 caracteres.'),
  telefone: z.string().trim().optional(),
  observacao: z.string().trim().optional(),
  taxaEntregaCentavos: z
    .number()
    .int('Taxa de entrega deve ser um valor inteiro em centavos.')
    .min(0, 'Taxa de entrega deve ser maior ou igual a zero.')
    .optional(),
})

export const obterEntregaPorPedidoSchema = z.object({
  pedidoId: z.string().trim().min(1, 'Pedido e obrigatorio.'),
})

export const atualizarDadosEntregaSchema = z.object({
  pedidoId: z.string().trim().min(1, 'Pedido e obrigatorio.'),
  clienteNome: z
    .string()
    .trim()
    .min(2, 'Nome do cliente deve ter no minimo 2 caracteres.')
    .optional(),
  telefone: z.string().trim().nullable().optional(),
  observacao: z.string().trim().nullable().optional(),
})

export const atualizarTaxaEntregaSchema = z.object({
  pedidoId: z.string().trim().min(1, 'Pedido e obrigatorio.'),
  taxaEntregaCentavos: z
    .number()
    .int('Taxa de entrega deve ser um valor inteiro em centavos.')
    .min(0, 'Taxa de entrega deve ser maior ou igual a zero.'),
})

export const atualizarStatusEntregaSchema = z.object({
  pedidoId: z.string().trim().min(1, 'Pedido e obrigatorio.'),
  status: z.enum([
    STATUS_ENTREGA.AGUARDANDO_PREPARO,
    STATUS_ENTREGA.EM_PREPARO,
    STATUS_ENTREGA.SAIU_PARA_ENTREGA,
    STATUS_ENTREGA.ENTREGUE,
    STATUS_ENTREGA.CANCELADA,
  ]),
})

export const listarPedidosDeliveryAbertosSchema = z
  .object({
    status: z
      .enum([
        STATUS_ENTREGA.AGUARDANDO_PREPARO,
        STATUS_ENTREGA.EM_PREPARO,
        STATUS_ENTREGA.SAIU_PARA_ENTREGA,
        STATUS_ENTREGA.ENTREGUE,
        STATUS_ENTREGA.CANCELADA,
      ])
      .optional(),
  })
  .optional()

export const definirTaxaEntregaPadraoSchema = z.object({
  taxaEntregaPadraoCentavos: z
    .number()
    .int('Taxa de entrega deve ser um valor inteiro em centavos.')
    .min(0, 'Taxa de entrega deve ser maior ou igual a zero.'),
})
