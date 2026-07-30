import { ipcMain } from 'electron'
import { ZodError } from 'zod'
import { CANAIS_IPC } from '@shared/types/canais-ipc'
import {
  CODIGOS_ERRO_CAIXA,
  ErroCaixa,
} from './errors/erros-caixa'
import { abrirSessaoCaixaSchema } from './schemas/caixa.schema'
import { abrirSessaoCaixa } from './use-cases/abrir-sessao-caixa'
import { obterSessaoCaixaAberta } from './use-cases/obter-sessao-caixa-aberta'

function tratarErroCaixa(erro: unknown): never {
  if (erro instanceof ErroCaixa) {
    throw erro
  }

  if (erro instanceof ZodError) {
    throw new ErroCaixa(
      CODIGOS_ERRO_CAIXA.ENTRADA_INVALIDA,
      erro.issues[0]?.message ?? 'Entrada invalida.',
    )
  }

  throw erro
}

export function registrarHandlersCaixa(): void {
  ipcMain.handle(CANAIS_IPC.CAIXA_ABRIR_SESSAO, (_evento, entradaDesconhecida) => {
    try {
      const entrada = abrirSessaoCaixaSchema.parse(entradaDesconhecida)
      return abrirSessaoCaixa(entrada)
    } catch (erro) {
      tratarErroCaixa(erro)
    }
  })

  ipcMain.handle(CANAIS_IPC.CAIXA_OBTER_SESSAO_ABERTA, () => {
    return obterSessaoCaixaAberta()
  })
}
