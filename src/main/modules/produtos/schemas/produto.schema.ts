import { z } from 'zod'
import { centavosSaoValidos } from '@shared/utils/moeda'

const precoCentavosSchema = z
  .number()
  .int('Preco deve ser inteiro em centavos.')
  .refine(centavosSaoValidos, 'Preco nao pode ser negativo.')

export const criarProdutoSchema = z.object({
  categoriaId: z.string().trim().min(1, 'Categoria e obrigatoria.'),
  nome: z.string().trim().min(1, 'Nome do produto e obrigatorio.'),
  descricao: z.string().trim().optional(),
  precoCentavos: precoCentavosSchema,
})

export const atualizarProdutoSchema = z.object({
  produtoId: z.string().trim().min(1, 'Produto e obrigatorio.'),
  categoriaId: z.string().trim().min(1, 'Categoria e obrigatoria.').optional(),
  nome: z.string().trim().min(1, 'Nome do produto e obrigatorio.').optional(),
  descricao: z.string().trim().nullable().optional(),
  precoCentavos: precoCentavosSchema.optional(),
})

export const listarProdutosSchema = z
  .object({
    categoriaId: z.string().trim().min(1).optional(),
    apenasAtivos: z.boolean().optional(),
  })
  .optional()

export const buscarProdutosSchema = z.object({
  termo: z.string().trim(),
  categoriaId: z.string().trim().min(1).optional(),
  apenasAtivos: z.boolean().optional(),
})

export const inativarProdutoSchema = z.object({
  produtoId: z.string().trim().min(1, 'Produto e obrigatorio.'),
})

export const reativarProdutoSchema = z.object({
  produtoId: z.string().trim().min(1, 'Produto e obrigatorio.'),
})

export const obterProdutoPorIdSchema = z.object({
  produtoId: z.string().trim().min(1, 'Produto e obrigatorio.'),
})
