import { z, type RefinementCtx } from 'zod'
import { FORMA_PAGAMENTO, FORMAS_PAGAMENTO_PEDIDO } from '@shared/types/pagamento-pedido'
import { MENSAGEM_VALOR_RECEBIDO_INSUFICIENTE } from '@shared/utils/troco-dinheiro'

export const valorRecebidoCentavosSchema = z
  .number()
  .int('Valor recebido deve ser inteiro.')
  .nonnegative('Valor recebido nao pode ser negativo.')
  .optional()

export function refinarTrocoDinheiro(
  value: {
    formaPagamento: string
    valorCentavos: number
    valorRecebidoCentavos?: number
  },
  ctx: RefinementCtx,
): void {
  if (value.formaPagamento !== FORMA_PAGAMENTO.DINHEIRO) {
    return
  }

  if (
    value.valorRecebidoCentavos != null &&
    value.valorRecebidoCentavos < value.valorCentavos
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['valorRecebidoCentavos'],
      message: MENSAGEM_VALOR_RECEBIDO_INSUFICIENTE,
    })
  }
}

export const registrarPagamentoPedidoSchema = z.object({
  pedidoId: z.string().trim().min(1, 'Pedido e obrigatorio.'),
  formaPagamento: z.enum(FORMAS_PAGAMENTO_PEDIDO),
  valorCentavos: z
    .number()
    .int('Valor deve ser inteiro.')
    .positive('Valor do pagamento deve ser maior que zero.'),
  valorRecebidoCentavos: valorRecebidoCentavosSchema,
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

  refinarTrocoDinheiro(value, ctx)
})

export const listarPagamentosPedidoSchema = z.object({
  pedidoId: z.string().trim().min(1, 'Pedido e obrigatorio.'),
})
