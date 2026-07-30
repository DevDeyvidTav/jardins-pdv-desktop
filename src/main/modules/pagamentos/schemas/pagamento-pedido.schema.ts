import { z } from 'zod'
import { FORMA_PAGAMENTO } from '@shared/types/pagamento-pedido'

const pagamentoInformadoSchema = z.object({
  formaPagamento: z.enum([
    FORMA_PAGAMENTO.DINHEIRO,
    FORMA_PAGAMENTO.CARTAO_CREDITO,
    FORMA_PAGAMENTO.CARTAO_DEBITO,
    FORMA_PAGAMENTO.PIX,
  ]),
  valorCentavos: z.number().int().positive('Valor do pagamento deve ser maior que zero.'),
})

export const registrarPagamentoPedidoSchema = z.object({
  pedidoId: z.string().trim().min(1, 'Pedido e obrigatorio.'),
  pagamentos: z.array(pagamentoInformadoSchema).min(1, 'Informe ao menos um pagamento.'),
})

export const listarPagamentosPedidoSchema = z.object({
  pedidoId: z.string().trim().min(1, 'Pedido e obrigatorio.'),
})
