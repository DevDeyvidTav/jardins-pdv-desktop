import type { AbrirSessaoCaixaEntrada, SessaoCaixa } from '@shared/types/sessao-caixa'
import {
  CODIGOS_ERRO_CAIXA,
  ErroCaixa,
} from '../errors/erros-caixa'
import type { SessaoCaixaRepository } from '../repositories/sessao-caixa.repository'
import { criarSessaoCaixaRepository } from '../repositories/sessao-caixa.repository'

export function criarAbrirSessaoCaixa(
  repositorio: SessaoCaixaRepository = criarSessaoCaixaRepository(),
) {
  return function abrirSessaoCaixa(
    entrada: AbrirSessaoCaixaEntrada,
  ): SessaoCaixa {
    const sessaoAberta = repositorio.buscarSessaoAberta()

    if (sessaoAberta) {
      throw new ErroCaixa(
        CODIGOS_ERRO_CAIXA.CAIXA_JA_ABERTO,
        'Ja existe uma sessao de caixa aberta.',
      )
    }

    if (entrada.saldoInicialCentavos < 0) {
      throw new ErroCaixa(
        CODIGOS_ERRO_CAIXA.SALDO_INICIAL_INVALIDO,
        'Saldo inicial nao pode ser negativo.',
      )
    }

    return repositorio.inserirSessaoAberta({
      operadorId: entrada.operadorId,
      operadorNome: entrada.operadorNome,
      saldoInicialCentavos: entrada.saldoInicialCentavos,
    })
  }
}

export const abrirSessaoCaixa = criarAbrirSessaoCaixa()
