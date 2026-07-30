import type { SessaoCaixa } from '@shared/types/sessao-caixa'
import {
  criarSessaoCaixaRepository,
  type SessaoCaixaRepository,
} from '../repositories/sessao-caixa.repository'

export function criarObterUltimaSessaoCaixa(
  repositorioSessao: SessaoCaixaRepository = criarSessaoCaixaRepository(),
) {
  return function obterUltimaSessaoCaixa(): SessaoCaixa | null {
    return repositorioSessao.buscarUltimaSessao()
  }
}

export const obterUltimaSessaoCaixa = criarObterUltimaSessaoCaixa()
