import { z } from 'zod'
import { FORMA_PAGAMENTO, FORMAS_PAGAMENTO_PEDIDO } from '@shared/types/pagamento-pedido'

export const registrarPagamentoPedidoSchema = z.object({
  pedidoId: z.string().trim().min(1, 'Pedido e obrigatorio.'),
  formaPagamento: z.enum(FORMAS_PAGAMENTO_PEDIDO),
  valorCentavos: z
    .number()
    .int('Valor deve ser inteiro.')
    .positive('Valor do pagamento deve ser maior que zero.'),
  motivoCortesia: z
    .string()
    .trim()
    .min(1, 'Motivo da cortesia e obrigatorio.')
    .optional(),
}).superRefine((value, ctx) => {
  if (value.formaPagamento === FORMA_PAGAMENTO.CORTESIA) {
    if (!value.motivoCortesia || value.motivoCortesia.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['motivoCortesia'],
        message: 'Motivo da cortesia e obrigatorio.',
      })
    }
  }
})

export const listarPagamentosPedidoSchema = z.object({
  pedidoId: z.string().trim().min(1, 'Pedido e obrigatorio.'),
})
