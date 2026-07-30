import type { SessaoCaixa } from '@shared/types/sessao-caixa'
import type { SessaoCaixaRepository } from '../repositories/sessao-caixa.repository'
import { criarSessaoCaixaRepository } from '../repositories/sessao-caixa.repository'

export function criarObterSessaoCaixaAberta(
  repositorio: SessaoCaixaRepository = criarSessaoCaixaRepository(),
) {
  return function obterSessaoCaixaAberta(): SessaoCaixa | null {
    return repositorio.buscarSessaoAberta()
  }
}

export const obterSessaoCaixaAberta = criarObterSessaoCaixaAberta()
