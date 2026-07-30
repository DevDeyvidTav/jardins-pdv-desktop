import { z } from 'zod'

export const criarCategoriaProdutoSchema = z.object({
  nome: z.string().trim().min(1, 'Nome da categoria e obrigatorio.'),
  descricao: z.string().trim().optional(),
})

export const atualizarCategoriaProdutoSchema = z.object({
  categoriaId: z.string().trim().min(1, 'Categoria e obrigatoria.'),
  nome: z.string().trim().min(1, 'Nome da categoria e obrigatorio.').optional(),
  descricao: z.string().trim().nullable().optional(),
})

export const inativarCategoriaProdutoSchema = z.object({
  categoriaId: z.string().trim().min(1, 'Categoria e obrigatoria.'),
})

export const reativarCategoriaProdutoSchema = z.object({
  categoriaId: z.string().trim().min(1, 'Categoria e obrigatoria.'),
})

export const listarCategoriasProdutoSchema = z
  .object({
    apenasAtivas: z.boolean().optional(),
  })
  .optional()
