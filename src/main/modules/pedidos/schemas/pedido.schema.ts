import { z } from 'zod'

const quantidadeSchema = z
  .number()
  .int('Quantidade deve ser inteira.')
  .positive('Quantidade deve ser maior que zero.')

export const criarPedidoMesaSchema = z.object({
  mesaId: z.string().trim().min(1, 'Mesa e obrigatoria.'),
})

export const obterPedidoAbertoPorMesaSchema = z.object({
  mesaId: z.string().trim().min(1, 'Mesa e obrigatoria.'),
})

export const adicionarItemPedidoSchema = z.object({
  pedidoId: z.string().trim().min(1, 'Pedido e obrigatorio.'),
  produtoId: z.string().trim().min(1, 'Produto e obrigatorio.'),
  quantidade: quantidadeSchema,
  descontoCentavos: z
    .number()
    .int('Desconto deve ser inteiro.')
    .min(0, 'Desconto do item deve ser maior ou igual a zero.')
    .optional(),
  observacao: z.string().trim().optional(),
})

export const alterarQuantidadeItemPedidoSchema = z.object({
  pedidoId: z.string().trim().min(1, 'Pedido e obrigatorio.'),
  itemId: z.string().trim().min(1, 'Item e obrigatorio.'),
  quantidade: quantidadeSchema,
})

const motivoCancelamentoSchema = z
  .string()
  .trim()
  .min(1, 'Motivo do cancelamento e obrigatorio.')
  .max(500, 'Motivo do cancelamento deve ter no maximo 500 caracteres.')

export const cancelarItemPedidoSchema = z.object({
  pedidoId: z.string().trim().min(1, 'Pedido e obrigatorio.'),
  itemId: z.string().trim().min(1, 'Item e obrigatorio.'),
  motivoCancelamento: motivoCancelamentoSchema,
})

export const removerItemPedidoSchema = cancelarItemPedidoSchema

export const aplicarDescontoPedidoSchema = z
  .object({
    pedidoId: z.string().trim().min(1, 'Pedido e obrigatorio.'),
    descontoCentavos: z
      .number()
      .int('Desconto deve ser inteiro.')
      .min(0, 'Desconto deve ser maior ou igual a zero.'),
    motivoDesconto: z.string().trim().optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.descontoCentavos > 0 &&
      (!value.motivoDesconto || value.motivoDesconto.trim().length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['motivoDesconto'],
        message: 'Motivo do desconto e obrigatorio.',
      })
    }
  })

export const obterResumoPedidoSchema = z.object({
  pedidoId: z.string().trim().min(1, 'Pedido e obrigatorio.'),
  incluirItensCancelados: z.boolean().optional(),
})

export const cancelarPedidoSchema = z.object({
  pedidoId: z.string().trim().min(1, 'Pedido e obrigatorio.'),
  motivoCancelamento: motivoCancelamentoSchema,
})

export const atualizarSolicitacaoFiscalSchema = z.object({
  pedidoId: z.string().trim().min(1, 'Pedido e obrigatorio.'),
  fiscalSolicitado: z.boolean(),
  fiscalCpfDestinatario: z.string().trim().max(14).nullable().optional(),
})

export const listarHistoricoPedidosSchema = z.object({
  status: z.enum(['TODOS', 'FINALIZADO', 'CANCELADO']).optional(),
  formaPagamento: z
    .enum([
      '',
      'DINHEIRO',
      'CARTAO_CREDITO',
      'CARTAO_DEBITO',
      'PIX_MAQUINETA',
      'PIX_CNPJ',
      'TALAO',
      'CORTESIA',
    ])
    .optional(),
})
