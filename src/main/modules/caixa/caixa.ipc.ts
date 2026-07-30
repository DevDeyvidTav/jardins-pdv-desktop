import { ipcMain } from 'electron'
import { ZodError } from 'zod'
import { CANAIS_IPC } from '@shared/types/canais-ipc'
import {
  CODIGOS_ERRO_CAIXA,
  ErroCaixa,
} from './errors/erros-caixa'
import { abrirSessaoCaixaSchema } from './schemas/caixa.schema'
import { fecharSessaoCaixaSchema } from './schemas/fechamento-caixa.schema'
import { registrarMovimentoCaixaSchema } from './schemas/movimento-caixa.schema'
import { abrirSessaoCaixa } from './use-cases/abrir-sessao-caixa'
import { fecharSessaoCaixa } from './use-cases/fechar-sessao-caixa'
import { listarMovimentosCaixa } from './use-cases/listar-movimentos-caixa'
import { obterResumoCaixaAtual } from './use-cases/obter-resumo-caixa-atual'
import { obterSessaoCaixaAberta } from './use-cases/obter-sessao-caixa-aberta'
import { obterUltimaSessaoCaixa } from './use-cases/obter-ultima-sessao-caixa'
import { registrarMovimentoCaixa } from './use-cases/registrar-movimento-caixa'

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

  ipcMain.handle(
    CANAIS_IPC.CAIXA_REGISTRAR_MOVIMENTO,
    (_evento, entradaDesconhecida) => {
      try {
        const entrada = registrarMovimentoCaixaSchema.parse(entradaDesconhecida)
        return registrarMovimentoCaixa(entrada)
      } catch (erro) {
        tratarErroCaixa(erro)
      }
    },
  )

  ipcMain.handle(CANAIS_IPC.CAIXA_LISTAR_MOVIMENTOS, () => {
    return listarMovimentosCaixa()
  })

  ipcMain.handle(CANAIS_IPC.CAIXA_OBTER_RESUMO_ATUAL, () => {
    return obterResumoCaixaAtual()
  })

  ipcMain.handle(
    CANAIS_IPC.CAIXA_FECHAR_SESSAO,
    (_evento, entradaDesconhecida) => {
      try {
        const entrada = fecharSessaoCaixaSchema.parse(entradaDesconhecida)
        return fecharSessaoCaixa(entrada)
      } catch (erro) {
        tratarErroCaixa(erro)
      }
    },
  )

  ipcMain.handle(CANAIS_IPC.CAIXA_OBTER_ULTIMA_SESSAO, () => {
    return obterUltimaSessaoCaixa()
  })
}
