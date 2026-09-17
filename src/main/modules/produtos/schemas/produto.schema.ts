import { z } from 'zod'
import { centavosSaoValidos } from '@shared/utils/moeda'

const precoCentavosSchema = z
  .number()
  .int('Preco deve ser inteiro em centavos.')
  .refine(centavosSaoValidos, 'Preco nao pode ser negativo.')

const codigoNumericoSchema = (tamanho: number, rotulo: string) =>
  z
    .string()
    .trim()
    .regex(new RegExp(`^\\d{${tamanho}}$`), `${rotulo} deve ter ${tamanho} digitos.`)
    .optional()
    .nullable()

const dadosFiscaisProdutoSchema = {
  fiscalNcm: codigoNumericoSchema(8, 'NCM'),
  fiscalCest: codigoNumericoSchema(7, 'CEST'),
  fiscalCfop: z
    .string()
    .trim()
    .regex(/^\d{4}$/, 'CFOP deve ter 4 digitos.')
    .optional(),
  fiscalIcmsOrigem: z.number().int().min(0).max(8).optional(),
  fiscalIcmsCsosn: z
    .string()
    .trim()
    .regex(/^\d{3}$/, 'CSOSN deve ter 3 digitos.')
    .optional(),
  fiscalPisCst: z
    .string()
    .trim()
    .regex(/^\d{2}$/, 'CST PIS deve ter 2 digitos.')
    .optional(),
  fiscalCofinsCst: z
    .string()
    .trim()
    .regex(/^\d{2}$/, 'CST COFINS deve ter 2 digitos.')
    .optional(),
  fiscalAliquotaNacional: z
    .number()
    .min(0, 'Aliquota nao pode ser negativa.')
    .max(100, 'Aliquota nao pode passar de 100%.')
    .nullable()
    .optional(),
}

export const criarProdutoSchema = z.object({
  categoriaId: z.string().trim().min(1, 'Categoria e obrigatoria.'),
  nome: z.string().trim().min(1, 'Nome do produto e obrigatorio.'),
  descricao: z.string().trim().optional(),
  precoCentavos: precoCentavosSchema,
  ...dadosFiscaisProdutoSchema,
})

export const atualizarProdutoSchema = z.object({
  produtoId: z.string().trim().min(1, 'Produto e obrigatorio.'),
  categoriaId: z.string().trim().min(1, 'Categoria e obrigatoria.').optional(),
  nome: z.string().trim().min(1, 'Nome do produto e obrigatorio.').optional(),
  descricao: z.string().trim().nullable().optional(),
  precoCentavos: precoCentavosSchema.optional(),
  ...dadosFiscaisProdutoSchema,
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

export const excluirProdutoSchema = z.object({
  produtoId: z.string().trim().min(1, 'Produto e obrigatorio.'),
})

export const obterProdutoPorIdSchema = z.object({
  produtoId: z.string().trim().min(1, 'Produto e obrigatorio.'),
})
