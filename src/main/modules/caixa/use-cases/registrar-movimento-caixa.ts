import type {
  MovimentoCaixa,
  RegistrarMovimentoCaixaEntrada,
} from '@shared/types/movimento-caixa'
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

export function criarRegistrarMovimentoCaixa(
  repositorioSessao: SessaoCaixaRepository = criarSessaoCaixaRepository(),
  repositorioMovimento: MovimentoCaixaRepository = criarMovimentoCaixaRepository(),
) {
  return function registrarMovimentoCaixa(
    entrada: RegistrarMovimentoCaixaEntrada,
  ): MovimentoCaixa {
    const sessaoAberta = repositorioSessao.buscarSessaoAberta()

    if (!sessaoAberta) {
      throw new ErroCaixa(
        CODIGOS_ERRO_CAIXA.CAIXA_NAO_ABERTO,
        'Nao existe sessao de caixa aberta.',
      )
    }

    if (entrada.valorCentavos <= 0) {
      throw new ErroCaixa(
        CODIGOS_ERRO_CAIXA.VALOR_MOVIMENTO_INVALIDO,
        'Valor do movimento deve ser maior que zero.',
      )
    }

    const descricaoNormalizada = entrada.descricao?.trim() ?? null

    if (
      (entrada.tipo === 'SANGRIA' || entrada.tipo === 'RETIRADA') &&
      !descricaoNormalizada
    ) {
      throw new ErroCaixa(
        CODIGOS_ERRO_CAIXA.DESCRICAO_OBRIGATORIA,
        'Descricao e obrigatoria para sangria e retirada.',
      )
    }

    return repositorioMovimento.inserir({
      sessaoCaixaId: sessaoAberta.id,
      tipo: entrada.tipo,
      valorCentavos: entrada.valorCentavos,
      descricao: descricaoNormalizada,
    })
  }
}

export const registrarMovimentoCaixa = criarRegistrarMovimentoCaixa()
