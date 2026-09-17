import { z } from 'zod'
import { REGRA_PRECIFICACAO_PIZZA } from '@shared/types/pizza'
import { centavosSaoValidos } from '@shared/utils/moeda'

const regraPrecificacaoSchema = z.enum([
  REGRA_PRECIFICACAO_PIZZA.MAIOR_SABOR,
  REGRA_PRECIFICACAO_PIZZA.MEDIA_SABORES,
])

const valorCentavosSchema = z
  .number()
  .int('Preco deve ser inteiro em centavos.')
  .refine(centavosSaoValidos, 'Preco nao pode ser negativo.')

export const criarPizzaCategoriaSchema = z.object({
  nome: z.string().trim().min(1, 'Nome da categoria e obrigatorio.'),
  descricao: z.string().trim().optional(),
  regraPrecificacao: regraPrecificacaoSchema.optional(),
  ordem: z.number().int().optional(),
})

export const atualizarPizzaCategoriaSchema = z.object({
  categoriaId: z.string().trim().min(1, 'Categoria e obrigatoria.'),
  nome: z.string().trim().min(1, 'Nome da categoria e obrigatorio.').optional(),
  descricao: z.string().trim().nullable().optional(),
  regraPrecificacao: regraPrecificacaoSchema.optional(),
  ativa: z.boolean().optional(),
  ordem: z.number().int().optional(),
})

export const listarPizzaCategoriasSchema = z
  .object({
    apenasAtivas: z.boolean().optional(),
  })
  .optional()

export const criarPizzaTamanhoSchema = z.object({
  nome: z.string().trim().min(1, 'Nome do tamanho e obrigatorio.'),
  sigla: z.string().trim().min(1, 'Sigla do tamanho e obrigatoria.'),
  maximoSabores: z.number().int().min(1, 'Maximo de sabores deve ser pelo menos 1.'),
  ordem: z.number().int().optional(),
})

export const atualizarPizzaTamanhoSchema = z.object({
  tamanhoId: z.string().trim().min(1, 'Tamanho e obrigatorio.'),
  nome: z.string().trim().min(1, 'Nome do tamanho e obrigatorio.').optional(),
  sigla: z.string().trim().min(1, 'Sigla do tamanho e obrigatoria.').optional(),
  maximoSabores: z
    .number()
    .int()
    .min(1, 'Maximo de sabores deve ser pelo menos 1.')
    .optional(),
  ativa: z.boolean().optional(),
  ordem: z.number().int().optional(),
})

export const listarPizzaTamanhosSchema = z
  .object({
    apenasAtivas: z.boolean().optional(),
  })
  .optional()

export const criarPizzaSaborSchema = z.object({
  nome: z.string().trim().min(1, 'Nome do sabor e obrigatorio.'),
  descricao: z.string().trim().optional(),
  ordem: z.number().int().optional(),
})

export const atualizarPizzaSaborSchema = z.object({
  saborId: z.string().trim().min(1, 'Sabor e obrigatorio.'),
  nome: z.string().trim().min(1, 'Nome do sabor e obrigatorio.').optional(),
  descricao: z.string().trim().nullable().optional(),
  ativa: z.boolean().optional(),
  ordem: z.number().int().optional(),
})

export const listarPizzaSaboresSchema = z
  .object({
    apenasAtivos: z.boolean().optional(),
    categoriaId: z.string().trim().min(1).optional(),
  })
  .optional()

export const vincularSaborCategoriaSchema = z.object({
  categoriaId: z.string().trim().min(1, 'Categoria e obrigatoria.'),
  saborId: z.string().trim().min(1, 'Sabor e obrigatorio.'),
  ativo: z.boolean().optional(),
})

export const definirPrecoSaborPorTamanhoSchema = z.object({
  saborId: z.string().trim().min(1, 'Sabor e obrigatorio.'),
  tamanhoId: z.string().trim().min(1, 'Tamanho e obrigatorio.'),
  valorCentavos: valorCentavosSchema,
})

export const listarPrecosSaborSchema = z.object({
  saborId: z.string().trim().min(1, 'Sabor e obrigatorio.'),
  apenasAtivos: z.boolean().optional(),
})

export const listarCategoriasDoSaborSchema = z.object({
  saborId: z.string().trim().min(1, 'Sabor e obrigatorio.'),
})

export const montarPreviewPizzaSchema = z.object({
  categoriaId: z.string().trim().min(1, 'Categoria e obrigatoria.').optional(),
  tamanhoId: z.string().trim().min(1, 'Tamanho e obrigatorio.'),
  saborIds: z.array(z.string().trim().min(1)),
})

export const adicionarPizzaAoPedidoSchema = z.object({
  pedidoId: z.string().trim().min(1, 'Pedido e obrigatorio.'),
  categoriaId: z.string().trim().min(1, 'Categoria e obrigatoria.').optional(),
  tamanhoId: z.string().trim().min(1, 'Tamanho e obrigatorio.'),
  saborIds: z.array(z.string().trim().min(1)),
  observacao: z.string().trim().optional(),
})

export const obterPizzaPedidoItemSchema = z.object({
  pedidoItemId: z.string().trim().min(1, 'Item do pedido e obrigatorio.'),
})
