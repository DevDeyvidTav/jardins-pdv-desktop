import { z } from 'zod'
import { TIPO_USO_MESA } from '@shared/types/mesa'

const numeroMesaSchema = z
  .number()
  .int('Numero da mesa deve ser inteiro.')
  .min(1, 'Numero da mesa deve ser maior que zero.')

const tipoUsoMesaSchema = z.enum([
  TIPO_USO_MESA.COMUM,
  TIPO_USO_MESA.BALCAO,
  TIPO_USO_MESA.DELIVERY,
])

export const criarMesasPorIntervaloSchema = z
  .object({
    numeroInicial: numeroMesaSchema,
    numeroFinal: numeroMesaSchema,
    tipoUso: tipoUsoMesaSchema.optional().default(TIPO_USO_MESA.COMUM),
  })
  .refine((entrada) => entrada.numeroFinal >= entrada.numeroInicial, {
    message: 'Numero final deve ser maior ou igual ao numero inicial.',
    path: ['numeroFinal'],
  })

export const atualizarMesaSchema = z.object({
  mesaId: z.string().trim().min(1, 'Mesa e obrigatoria.'),
  numero: z.number().int().min(1).optional(),
  nome: z.string().trim().min(1).optional(),
  tipoUso: tipoUsoMesaSchema.optional(),
})

export const inativarMesaSchema = z.object({
  mesaId: z.string().trim().min(1, 'Mesa e obrigatoria.'),
})

export const excluirMesasPorIntervaloSchema = z
  .object({
    numeroInicial: numeroMesaSchema,
    numeroFinal: numeroMesaSchema,
    tipoUso: tipoUsoMesaSchema,
  })
  .refine((entrada) => entrada.numeroFinal >= entrada.numeroInicial, {
    message: 'Numero final deve ser maior ou igual ao numero inicial.',
    path: ['numeroFinal'],
  })
