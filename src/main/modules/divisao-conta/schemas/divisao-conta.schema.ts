import { z } from 'zod'
import { FORMA_PAGAMENTO, FORMAS_PAGAMENTO_PEDIDO } from '@shared/types/pagamento-pedido'

export const criarDivisaoContaSchema = z.object({
  pedidoId: z.string().uuid('pedidoId invalido.'),
  partes: z
    .array(
      z.object({
        identificacao: z.string().trim().min(1, 'Identificacao da parte e obrigatoria.'),
        valorDefinidoCentavos: z
          .number()
          .int('Valor da parte deve ser inteiro.')
          .positive('Valor da parte deve ser maior que zero.'),
      }),
    )
    .min(2, 'Divisao precisa de duas ou mais partes.'),
})

export const obterResumoDivisaoContaSchema = z.object({
  pedidoId: z.string().uuid('pedidoId invalido.'),
})

export const registrarPagamentoParteDivisaoSchema = z
  .object({
    pedidoId: z.string().uuid('pedidoId invalido.'),
    parteId: z.string().uuid('parteId invalido.'),
    formaPagamento: z.enum(FORMAS_PAGAMENTO_PEDIDO),
    valorCentavos: z
      .number()
      .int('Valor deve ser inteiro.')
      .positive('Valor do pagamento deve ser maior que zero.'),
    motivoCortesia: z.string().trim().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.formaPagamento === FORMA_PAGAMENTO.CORTESIA &&
      (!value.motivoCortesia || value.motivoCortesia.trim().length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['motivoCortesia'],
        message: 'Motivo da cortesia e obrigatorio.',
      })
    }
  })

export const cancelarDivisaoContaSchema = z.object({
  pedidoId: z.string().uuid('pedidoId invalido.'),
  motivo: z.string().trim().min(1).max(500).optional(),
})

export const listarHistoricoDivisaoContaSchema = z.object({
  pedidoId: z.string().uuid('pedidoId invalido.'),
})
