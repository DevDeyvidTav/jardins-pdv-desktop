import type { MovimentoCaixa } from '@shared/types/movimento-caixa'
import {
  criarMovimentoCaixaRepository,
  type MovimentoCaixaRepository,
} from '../repositories/movimento-caixa.repository'
import {
  criarSessaoCaixaRepository,
  type SessaoCaixaRepository,
} from '../repositories/sessao-caixa.repository'

export function criarListarMovimentosCaixa(
  repositorioSessao: SessaoCaixaRepository = criarSessaoCaixaRepository(),
  repositorioMovimento: MovimentoCaixaRepository = criarMovimentoCaixaRepository(),
) {
  return function listarMovimentosCaixa(): MovimentoCaixa[] {
    const sessaoAberta = repositorioSessao.buscarSessaoAberta()

    if (!sessaoAberta) {
      return []
    }

    return repositorioMovimento.listarPorSessao(sessaoAberta.id)
  }
}

export const listarMovimentosCaixa = criarListarMovimentosCaixa()
