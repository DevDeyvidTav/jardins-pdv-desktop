import { z } from 'zod'
import { FORMA_PAGAMENTO } from '@shared/types/pagamento-pedido'

export const registrarPagamentoPedidoSchema = z.object({
  pedidoId: z.string().trim().min(1, 'Pedido e obrigatorio.'),
  formaPagamento: z.enum([
    FORMA_PAGAMENTO.DINHEIRO,
    FORMA_PAGAMENTO.CARTAO_CREDITO,
    FORMA_PAGAMENTO.CARTAO_DEBITO,
    FORMA_PAGAMENTO.PIX,
    FORMA_PAGAMENTO.CORTESIA,
  ]),
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
