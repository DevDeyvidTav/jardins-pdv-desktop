import { z } from 'zod'
import {
  FORMAS_PAGAMENTO_BAIXA_TALAO,
} from '@shared/types/pagamento-pedido'

export const criarClienteSchema = z.object({
  nome: z.string().trim().min(2, 'Nome do cliente deve ter no minimo 2 caracteres.').max(120),
  telefone: z.string().trim().max(30).optional(),
  documento: z.string().trim().max(30).optional(),
  endereco: z.string().trim().max(500).optional(),
  liberaTalao: z.boolean().optional(),
})

export const atualizarClienteSchema = z.object({
  clienteId: z.string().uuid('clienteId invalido.'),
  nome: z.string().trim().min(2, 'Nome do cliente deve ter no minimo 2 caracteres.').max(120),
  telefone: z.string().trim().max(30).nullable().optional(),
  documento: z.string().trim().max(30).nullable().optional(),
  endereco: z.string().trim().max(500).nullable().optional(),
  liberaTalao: z.boolean(),
})

export const obterClienteSchema = z.object({
  clienteId: z.string().uuid('clienteId invalido.'),
})

export const listarClientesSchema = z
  .object({
    apenasAtivos: z.boolean().optional(),
    apenasComTalao: z.boolean().optional(),
    termo: z.string().optional(),
  })
  .optional()

export const inativarClienteSchema = obterClienteSchema
export const reativarClienteSchema = obterClienteSchema

export const vincularClientePedidoSchema = z.object({
  pedidoId: z.string().uuid('pedidoId invalido.'),
  clienteId: z.string().uuid('clienteId invalido.').nullable(),
})

export const obterContaTalaoSchema = z.object({
  clienteId: z.string().uuid('clienteId invalido.'),
  competencia: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Competencia deve estar no formato YYYY-MM.')
    .optional(),
})

export const listarContasTalaoSchema = z
  .object({
    competencia: z
      .string()
      .regex(/^\d{4}-\d{2}$/, 'Competencia deve estar no formato YYYY-MM.')
      .optional(),
    apenasComSaldo: z.boolean().optional(),
  })
  .optional()

export const registrarBaixaTalaoSchema = z.object({
  clienteId: z.string().uuid('clienteId invalido.'),
  formaPagamento: z.enum(FORMAS_PAGAMENTO_BAIXA_TALAO),
  valorCentavos: z
    .number()
    .int('Valor deve ser inteiro.')
    .positive('Valor da baixa deve ser maior que zero.'),
  competencia: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Competencia deve estar no formato YYYY-MM.')
    .optional(),
  observacao: z.string().trim().max(500).optional(),
})
