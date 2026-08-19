import { z } from 'zod'
import {
  SETOR_COZINHA,
  TIPO_DOCUMENTO_IMPRESSAO,
} from '@shared/types/impressao'

export const imprimirAmostraSchema = z
  .object({
    tipo: z.enum([TIPO_DOCUMENTO_IMPRESSAO.CONTA, TIPO_DOCUMENTO_IMPRESSAO.COMANDA]),
    setor: z
      .enum([SETOR_COZINHA.PIZZA, SETOR_COZINHA.JAPONESA, SETOR_COZINHA.CHINESA])
      .optional(),
  })
  .superRefine((entrada, contexto) => {
    if (entrada.tipo === TIPO_DOCUMENTO_IMPRESSAO.COMANDA && !entrada.setor) {
      contexto.addIssue({
        code: 'custom',
        message: 'Setor e obrigatorio para comanda.',
        path: ['setor'],
      })
    }
  })

export type ImprimirAmostraSchema = z.infer<typeof imprimirAmostraSchema>

export const imprimirPedidoSchema = z.object({
  pedidoId: z.string().trim().min(1, 'Pedido e obrigatorio.'),
})

export type ImprimirPedidoSchema = z.infer<typeof imprimirPedidoSchema>
