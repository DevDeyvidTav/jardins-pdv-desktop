import type { AbrirSessaoCaixaEntrada, SessaoCaixa } from '@shared/types/sessao-caixa'
import {
  CODIGOS_ERRO_CAIXA,
  ErroCaixa,
} from '../errors/erros-caixa'
import type { SessaoCaixaRepository } from '../repositories/sessao-caixa.repository'
import { criarSessaoCaixaRepository } from '../repositories/sessao-caixa.repository'
import { executarEmTransacaoImediata } from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { registrarEventoSessaoCaixaSync } from '../../sincronizacao/services/registrar-evento-caixa'

export function criarAbrirSessaoCaixa(
  repositorio: SessaoCaixaRepository = criarSessaoCaixaRepository(),
  obterConexao = obterConexaoBancoLocal,
) {
  return function abrirSessaoCaixa(
    entrada: AbrirSessaoCaixaEntrada,
  ): SessaoCaixa {
    if (entrada.saldoInicialCentavos < 0) {
      throw new ErroCaixa(
        CODIGOS_ERRO_CAIXA.SALDO_INICIAL_INVALIDO,
        'Saldo inicial nao pode ser negativo.',
      )
    }

    const conexao = obterConexao()
    return executarEmTransacaoImediata(conexao, () => {
      const sessaoAberta = repositorio.buscarSessaoAberta()

      if (sessaoAberta) {
        throw new ErroCaixa(
          CODIGOS_ERRO_CAIXA.CAIXA_JA_ABERTO,
          'Ja existe uma sessao de caixa aberta.',
        )
      }

      const sessao = repositorio.inserirSessaoAberta({
        operadorId: entrada.operadorId,
        operadorNome: entrada.operadorNome,
        saldoInicialCentavos: entrada.saldoInicialCentavos,
      })

      registrarEventoSessaoCaixaSync(conexao, sessao, OPERACAO_SYNC.CREATE)
      return sessao
    })
  }
}

export const abrirSessaoCaixa = criarAbrirSessaoCaixa()
