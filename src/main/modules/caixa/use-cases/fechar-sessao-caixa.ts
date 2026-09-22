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
  criarPedidoRepository,
  type PedidoRepository,
} from '../../pedidos/repositories/pedido.repository'
import {
  calcularDiferencaCentavos,
  calcularSaldoEsperadoCentavos,
} from '../types/fechamento-caixa.types'
import { executarEmTransacaoImediata } from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { registrarEventoSessaoCaixaSync } from '../../sincronizacao/services/registrar-evento-caixa'
import { registrarAcaoAuditoria } from '../../sincronizacao/services/registrar-acao-auditoria'

export function criarFecharSessaoCaixa(
  repositorioSessao: SessaoCaixaRepository = criarSessaoCaixaRepository(),
  repositorioMovimento: MovimentoCaixaRepository = criarMovimentoCaixaRepository(),
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  obterConexao = obterConexaoBancoLocal,
) {
  return function fecharSessaoCaixa(
    entrada: FecharSessaoCaixaEntrada,
  ): SessaoCaixa {
    if (entrada.saldoFinalInformadoCentavos < 0) {
      throw new ErroCaixa(
        CODIGOS_ERRO_CAIXA.SALDO_FINAL_INVALIDO,
        'Saldo final informado nao pode ser negativo.',
      )
    }

    const conexao = obterConexao()
    return executarEmTransacaoImediata(conexao, () => {
      const sessaoAberta = repositorioSessao.buscarSessaoAberta()

      if (!sessaoAberta) {
        throw new ErroCaixa(
          CODIGOS_ERRO_CAIXA.CAIXA_NAO_ABERTO,
          'Nao existe sessao de caixa aberta.',
        )
      }

      const pedidosAbertos = repositorioPedido.contarPedidosAbertos(sessaoAberta.id)
      if (pedidosAbertos > 0) {
        const rotulo = pedidosAbertos === 1 ? 'pedido aberto' : 'pedidos abertos'
        throw new ErroCaixa(
          CODIGOS_ERRO_CAIXA.PEDIDOS_ABERTOS_NO_FECHAMENTO,
          `Nao e possivel fechar o caixa com ${pedidosAbertos} ${rotulo}. Finalize ou cancele os pedidos antes.`,
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
        const sessaoFechada = repositorioSessao.fecharSessao({
          sessaoCaixaId: sessaoAberta.id,
          saldoFinalInformadoCentavos: entrada.saldoFinalInformadoCentavos,
          saldoFinalEsperadoCentavos,
          diferencaCentavos,
          observacaoFechamento,
        })

        registrarEventoSessaoCaixaSync(conexao, sessaoFechada, OPERACAO_SYNC.UPDATE)
        registrarAcaoAuditoria(
          {
            acao: 'CAIXA_FECHAR',
            resumo: `${sessaoFechada.operadorNome} fechou o caixa`,
            entidade: 'SESSAO_CAIXA',
            entidadeId: sessaoFechada.id,
            ator: {
              operadorId: sessaoFechada.operadorId,
              operadorNome: sessaoFechada.operadorNome,
            },
            detalhes: {
              saldoFinalInformadoCentavos: sessaoFechada.saldoFinalInformadoCentavos,
              diferencaCentavos: sessaoFechada.diferencaCentavos,
            },
          },
          conexao,
        )
        return sessaoFechada
      } catch {
        throw new ErroCaixa(
          CODIGOS_ERRO_CAIXA.CAIXA_JA_FECHADO,
          'A sessao de caixa ja foi fechada.',
        )
      }
    })
  }
}

export const fecharSessaoCaixa = criarFecharSessaoCaixa()
