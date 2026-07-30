import type { ResumoCaixaAtual } from '@shared/types/movimento-caixa'
import {
  criarMovimentoCaixaRepository,
  type MovimentoCaixaRepository,
} from '../repositories/movimento-caixa.repository'
import {
  criarSessaoCaixaRepository,
  type SessaoCaixaRepository,
} from '../repositories/sessao-caixa.repository'

export function criarObterResumoCaixaAtual(
  repositorioSessao: SessaoCaixaRepository = criarSessaoCaixaRepository(),
  repositorioMovimento: MovimentoCaixaRepository = criarMovimentoCaixaRepository(),
) {
  return function obterResumoCaixaAtual(): ResumoCaixaAtual | null {
    const sessaoAberta = repositorioSessao.buscarSessaoAberta()

    if (!sessaoAberta) {
      return null
    }

    const totais = repositorioMovimento.calcularTotaisPorSessao(sessaoAberta.id)

    const saldoAtualCentavos =
      sessaoAberta.saldoInicialCentavos +
      totais.totalSuprimentosCentavos -
      totais.totalSangriasCentavos -
      totais.totalRetiradasCentavos

    return {
      sessao: sessaoAberta,
      saldoInicialCentavos: sessaoAberta.saldoInicialCentavos,
      totalSuprimentosCentavos: totais.totalSuprimentosCentavos,
      totalSangriasCentavos: totais.totalSangriasCentavos,
      totalRetiradasCentavos: totais.totalRetiradasCentavos,
      saldoAtualCentavos,
    }
  }
}

export const obterResumoCaixaAtual = criarObterResumoCaixaAtual()
