import { ipcMain } from 'electron'
import { z } from 'zod'
import { CANAIS_IPC } from '@shared/types/canais-ipc'
import { criarDocumentoFiscalRepository } from './repositories/documento-fiscal.repository'
import { imprimirDanfeNfce } from './use-cases/imprimir-danfe-nfce'

const obterDocumentoSchema = z.object({
  pedidoId: z.string().trim().min(1),
})

export function registrarHandlersFiscal(): void {
  ipcMain.handle(CANAIS_IPC.FISCAL_OBTER_DOCUMENTO, (_evento, entradaDesconhecida) => {
    const entrada = obterDocumentoSchema.parse(entradaDesconhecida)
    return criarDocumentoFiscalRepository().buscarPorPedidoId(entrada.pedidoId)
  })

  ipcMain.handle(CANAIS_IPC.FISCAL_IMPRIMIR_DANFE, async (_evento, entradaDesconhecida) => {
    const entrada = obterDocumentoSchema.parse(entradaDesconhecida)
    return imprimirDanfeNfce(entrada.pedidoId)
  })
}
