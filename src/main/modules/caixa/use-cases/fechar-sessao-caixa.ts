import type { FecharSessaoCaixaEntrada } from '@shared/types/sessao-caixa'
import type { SessaoCaixa } from '@shared/types/sessao-caixa'
import {
  CODIGOS_ERRO_CAIXA,
  ErroCaixa,
} from '../errors/erros-caixa'
import {
  criarMovimentoCaixaRepository,
  type MovimentoCaixaRepository,
} from '../repositories/movimento-caixa.repository'
import {
  criarSessaoCaixaRepository,
  type SessaoCaixaRepository,
} from '../repositories/sessao-caixa.repository'
import {
  calcularDiferencaCentavos,
  calcularSaldoEsperadoCentavos,
} from '../types/fechamento-caixa.types'

export function criarFecharSessaoCaixa(
  repositorioSessao: SessaoCaixaRepository = criarSessaoCaixaRepository(),
  repositorioMovimento: MovimentoCaixaRepository = criarMovimentoCaixaRepository(),
) {
  return function fecharSessaoCaixa(
    entrada: FecharSessaoCaixaEntrada,
  ): SessaoCaixa {
    const sessaoAberta = repositorioSessao.buscarSessaoAberta()

    if (!sessaoAberta) {
      throw new ErroCaixa(
        CODIGOS_ERRO_CAIXA.CAIXA_NAO_ABERTO,
        'Nao existe sessao de caixa aberta.',
      )
    }

    if (entrada.saldoFinalInformadoCentavos < 0) {
      throw new ErroCaixa(
        CODIGOS_ERRO_CAIXA.SALDO_FINAL_INVALIDO,
        'Saldo final informado nao pode ser negativo.',
      )
    }

    const totais = repositorioMovimento.calcularTotaisPorSessao(sessaoAberta.id)
    const saldoFinalEsperadoCentavos = calcularSaldoEsperadoCentavos(
      sessaoAberta.saldoInicialCentavos,
      totais,
    )
    const diferencaCentavos = calcularDiferencaCentavos(
      entrada.saldoFinalInformadoCentavos,
      saldoFinalEsperadoCentavos,
    )
    const observacaoFechamento = entrada.observacaoFechamento?.trim() || null

    try {
      return repositorioSessao.fecharSessao({
        sessaoCaixaId: sessaoAberta.id,
        saldoFinalInformadoCentavos: entrada.saldoFinalInformadoCentavos,
        saldoFinalEsperadoCentavos,
        diferencaCentavos,
        observacaoFechamento,
      })
    } catch {
      throw new ErroCaixa(
        CODIGOS_ERRO_CAIXA.CAIXA_JA_FECHADO,
        'A sessao de caixa ja foi fechada.',
      )
    }
  }
}

export const fecharSessaoCaixa = criarFecharSessaoCaixa()
