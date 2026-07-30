import type { InformacoesSistema } from './informacoes-sistema'
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
  }
}

declare global {
  interface Window {
    pdv: PdvApi
  }
}

export {}
