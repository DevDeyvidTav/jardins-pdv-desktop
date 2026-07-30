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
  observacao: z.string().trim().optional(),
})

export const alterarQuantidadeItemPedidoSchema = z.object({
  pedidoId: z.string().trim().min(1, 'Pedido e obrigatorio.'),
  itemId: z.string().trim().min(1, 'Item e obrigatorio.'),
  quantidade: quantidadeSchema,
})

export const removerItemPedidoSchema = z.object({
  pedidoId: z.string().trim().min(1, 'Pedido e obrigatorio.'),
  itemId: z.string().trim().min(1, 'Item e obrigatorio.'),
})

export const obterResumoPedidoSchema = z.object({
  pedidoId: z.string().trim().min(1, 'Pedido e obrigatorio.'),
})

export const cancelarPedidoSchema = z.object({
  pedidoId: z.string().trim().min(1, 'Pedido e obrigatorio.'),
})
