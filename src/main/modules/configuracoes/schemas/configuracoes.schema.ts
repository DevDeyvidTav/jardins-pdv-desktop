import { z } from 'zod'
import { SETOR_IMPRESSAO } from '@shared/types/config-impressora'
import { TAMANHO_PIN_OPERADOR } from '@shared/types/operador'

const setorImpressaoSchema = z.enum([
  SETOR_IMPRESSAO.BALCAO,
  SETOR_IMPRESSAO.PIZZA,
  SETOR_IMPRESSAO.JAPONESA,
  SETOR_IMPRESSAO.CHINESA,
  SETOR_IMPRESSAO.COZINHA,
])

export const configImpressoraEntradaSchema = z.object({
  setor: setorImpressaoSchema,
  nomeImpressora: z.string().trim().min(1, 'Nome da impressora e obrigatorio.'),
  portaCom: z.string().trim().nullable().optional(),
})

export const salvarConfigImpressorasSchema = z.object({
  configs: z.array(configImpressoraEntradaSchema),
})

export const atualizarSetorCategoriaSchema = z.object({
  categoriaId: z.string().uuid('Categoria invalida.'),
  setorImpressao: setorImpressaoSchema.nullable(),
})

const pinOperadorSchema = z
  .string()
  .trim()
  .regex(
    new RegExp(`^\\d{${TAMANHO_PIN_OPERADOR}}$`),
    `PIN deve ter exatamente ${TAMANHO_PIN_OPERADOR} digitos numericos.`,
  )

export const salvarOperadorSchema = z.object({
  operadorId: z.string().trim().min(1, 'Operador invalido.'),
  pin: pinOperadorSchema,
})

export const autenticarOperadorSchema = z.object({
  operadorId: z.string().trim().min(1, 'Selecione um usuario.'),
  pin: pinOperadorSchema,
})
