import { z } from 'zod'
import { centavosSaoValidos } from '@shared/utils/moeda'

export const fecharSessaoCaixaSchema = z.object({
  saldoFinalInformadoCentavos: z
    .number()
    .int('Saldo final informado deve ser inteiro em centavos.')
    .refine(centavosSaoValidos, 'Saldo final informado nao pode ser negativo.'),
  observacaoFechamento: z.string().trim().optional(),
})

export type FecharSessaoCaixaSchema = z.infer<typeof fecharSessaoCaixaSchema>
