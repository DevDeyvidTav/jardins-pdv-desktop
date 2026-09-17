import { z } from 'zod'

export const buscarCategoriasCatalogoSchema = z
  .object({
    termo: z.string().trim().optional(),
    limite: z.number().int().min(1).max(100).optional(),
  })
  .optional()
