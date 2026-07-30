import type { InformacoesSistema } from './informacoes-sistema'
import type {
  MovimentoCaixa,
  RegistrarMovimentoCaixaEntrada,
  ResumoCaixaAtual,
} from './movimento-caixa'
import type {
  AbrirSessaoCaixaEntrada,
  SessaoCaixa,
} from './sessao-caixa'

export interface PdvApi {
  sistema: {
    obterInformacoes: () => Promise<InformacoesSistema>
  }
  caixa: {
    abrirSessaoCaixa: (entrada: AbrirSessaoCaixaEntrada) => Promise<SessaoCaixa>
    obterSessaoCaixaAberta: () => Promise<SessaoCaixa | null>
    registrarMovimentoCaixa: (
      entrada: RegistrarMovimentoCaixaEntrada,
    ) => Promise<MovimentoCaixa>
    listarMovimentosCaixa: () => Promise<MovimentoCaixa[]>
    obterResumoCaixaAtual: () => Promise<ResumoCaixaAtual | null>
  }
}

declare global {
  interface Window {
    pdv: PdvApi
  }
}

export {}
