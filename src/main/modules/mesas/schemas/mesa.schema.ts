import { z } from 'zod'

const numeroMesaSchema = z
  .number()
  .int('Numero da mesa deve ser inteiro.')
  .min(1, 'Numero da mesa deve ser maior que zero.')

export const criarMesasPorIntervaloSchema = z
  .object({
    numeroInicial: numeroMesaSchema,
    numeroFinal: numeroMesaSchema,
  })
  .refine((entrada) => entrada.numeroFinal >= entrada.numeroInicial, {
    message: 'Numero final deve ser maior ou igual ao numero inicial.',
    path: ['numeroFinal'],
  })

export const atualizarMesaSchema = z.object({
  mesaId: z.string().trim().min(1, 'Mesa e obrigatoria.'),
  numero: z.number().int().min(1).optional(),
  nome: z.string().trim().min(1).optional(),
})

export const inativarMesaSchema = z.object({
  mesaId: z.string().trim().min(1, 'Mesa e obrigatoria.'),
})
