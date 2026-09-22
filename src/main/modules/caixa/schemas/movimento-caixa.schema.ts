import { z } from 'zod'
import { TIPO_MOVIMENTO_CAIXA } from '@shared/types/movimento-caixa'

const tiposMovimento = [
  TIPO_MOVIMENTO_CAIXA.SUPRIMENTO,
  TIPO_MOVIMENTO_CAIXA.RETIRADA,
] as const

export const registrarMovimentoCaixaSchema = z
  .object({
    tipo: z.enum(tiposMovimento, {
      message: 'Tipo de movimento invalido.',
    }),
    valorCentavos: z
      .number()
      .int('Valor deve ser inteiro em centavos.')
      .positive('Valor deve ser maior que zero.'),
    descricao: z.string().trim().optional(),
  })
  .superRefine((entrada, contexto) => {
    if (entrada.tipo === TIPO_MOVIMENTO_CAIXA.RETIRADA && !entrada.descricao) {
      contexto.addIssue({
        code: 'custom',
        message: 'Descricao e obrigatoria para retirada.',
        path: ['descricao'],
      })
    }
  })

export type RegistrarMovimentoCaixaSchema = z.infer<
  typeof registrarMovimentoCaixaSchema
>
