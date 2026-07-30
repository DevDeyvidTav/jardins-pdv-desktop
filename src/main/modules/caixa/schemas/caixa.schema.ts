import { z } from 'zod'
import { centavosSaoValidos } from '@shared/utils/moeda'

export const abrirSessaoCaixaSchema = z.object({
  operadorId: z.string().trim().min(1, 'Operador e obrigatorio.'),
  operadorNome: z.string().trim().min(1, 'Nome do operador e obrigatorio.'),
  saldoInicialCentavos: z
    .number()
    .int('Saldo inicial deve ser inteiro em centavos.')
    .refine(centavosSaoValidos, 'Saldo inicial nao pode ser negativo.'),
})

export type AbrirSessaoCaixaSchema = z.infer<typeof abrirSessaoCaixaSchema>
