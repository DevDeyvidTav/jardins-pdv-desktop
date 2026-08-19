import type {
  CancelarDivisaoContaEntrada,
  ListarHistoricoDivisaoContaEntrada,
  ObterResumoDivisaoContaEntrada,
  PedidoDivisaoMovimentacao,
  ResumoDivisaoConta,
} from '@shared/types/divisao-conta'
import {
  STATUS_DIVISAO_CONTA,
  TIPO_MOVIMENTACAO_DIVISAO,
} from '@shared/types/divisao-conta'
import { STATUS_PEDIDO } from '@shared/types/pedido'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import {
  executarEmTransacaoImediata,
  persistirConexaoBanco,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import {
  criarPedidoRepository,
  type PedidoRepository,
} from '../../pedidos/repositories/pedido.repository'
import {
  criarPagamentoPedidoRepository,
  type PagamentoPedidoRepository,
} from '../../pagamentos/repositories/pagamento-pedido.repository'
import {
  CODIGOS_ERRO_DIVISAO_CONTA,
  ErroDivisaoConta,
} from '../errors/erros-divisao-conta'
import {
  criarPedidoDivisaoContaRepository,
  criarPedidoDivisaoMovimentacaoRepository,
  criarPedidoDivisaoParteRepository,
  type PedidoDivisaoContaRepository,
  type PedidoDivisaoMovimentacaoRepository,
  type PedidoDivisaoParteRepository,
} from '../repositories/divisao-conta.repository'
import { criarMontarResumoDivisaoConta } from '../services/resumo-divisao-conta'

export function criarObterResumoDivisaoConta(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioDivisao: PedidoDivisaoContaRepository = criarPedidoDivisaoContaRepository(),
  repositorioParte: PedidoDivisaoParteRepository = criarPedidoDivisaoParteRepository(),
  repositorioPagamento: PagamentoPedidoRepository = criarPagamentoPedidoRepository(),
) {
  const montarResumo = criarMontarResumoDivisaoConta(
    repositorioDivisao,
    repositorioParte,
    repositorioPagamento,
  )

  return function obterResumoDivisaoConta(
    entrada: ObterResumoDivisaoContaEntrada,
  ): ResumoDivisaoConta | null {
    const pedido = repositorioPedido.buscarPorId(entrada.pedidoId)
    if (!pedido) {
      throw new ErroDivisaoConta(
        CODIGOS_ERRO_DIVISAO_CONTA.PEDIDO_NAO_ENCONTRADO,
        'Pedido nao encontrado.',
      )
    }
    return montarResumo(pedido.id, pedido.totalCentavos)
  }
}

export const obterResumoDivisaoConta = criarObterResumoDivisaoConta()

export function criarCancelarDivisaoConta(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioDivisao: PedidoDivisaoContaRepository = criarPedidoDivisaoContaRepository(),
  repositorioParte: PedidoDivisaoParteRepository = criarPedidoDivisaoParteRepository(),
  repositorioPagamento: PagamentoPedidoRepository = criarPagamentoPedidoRepository(),
  repositorioMovimentacao: PedidoDivisaoMovimentacaoRepository =
    criarPedidoDivisaoMovimentacaoRepository(),
  obterConexao = obterConexaoBancoLocal,
) {
  return function cancelarDivisaoConta(entrada: CancelarDivisaoContaEntrada): ResumoDivisaoConta {
    const conexao = obterConexao()
    const agora = agoraEmIsoUtc()
    const montarResumo = criarMontarResumoDivisaoConta(
      repositorioDivisao,
      repositorioParte,
      repositorioPagamento,
    )

    const resumo = executarEmTransacaoImediata(conexao, () => {
      const pedido = repositorioPedido.buscarPorId(entrada.pedidoId)
      if (!pedido) {
        throw new ErroDivisaoConta(
          CODIGOS_ERRO_DIVISAO_CONTA.PEDIDO_NAO_ENCONTRADO,
          'Pedido nao encontrado.',
        )
      }
      if (pedido.status !== STATUS_PEDIDO.ABERTO) {
        throw new ErroDivisaoConta(
          CODIGOS_ERRO_DIVISAO_CONTA.PEDIDO_NAO_ABERTO,
          'Pedido nao esta aberto.',
        )
      }

      const divisao = repositorioDivisao.buscarAtivaPorPedido(pedido.id)
      if (!divisao) {
        throw new ErroDivisaoConta(
          CODIGOS_ERRO_DIVISAO_CONTA.DIVISAO_NAO_ENCONTRADA,
          'Divisao ativa nao encontrada.',
        )
      }

      const partes = repositorioParte.listarPorDivisao(divisao.id)
      const pagamentos = repositorioPagamento.listarPorPedido(pedido.id)
      const temPagamentoVinculado = pagamentos.some(
        (p) =>
          p.canceladoEm === null &&
          p.pedidoDivisaoParteId &&
          partes.some((parte) => parte.id === p.pedidoDivisaoParteId),
      )
      if (temPagamentoVinculado) {
        throw new ErroDivisaoConta(
          CODIGOS_ERRO_DIVISAO_CONTA.CANCELAMENTO_DIVISAO_NAO_PERMITIDO_COM_PAGAMENTOS,
          'Nao e permitido cancelar divisao apos o primeiro pagamento.',
        )
      }

      repositorioDivisao.atualizarStatus(divisao.id, STATUS_DIVISAO_CONTA.CANCELADA, {
        canceladoEm: agora,
        motivoCancelamento: entrada.motivo ?? 'Cancelamento manual',
      })

      repositorioMovimentacao.inserir({
        pedidoId: pedido.id,
        divisaoId: divisao.id,
        tipo: TIPO_MOVIMENTACAO_DIVISAO.DIVISAO_CANCELADA,
        dadosAntes: { status: divisao.status },
        dadosDepois: { status: STATUS_DIVISAO_CONTA.CANCELADA },
        motivo: entrada.motivo ?? null,
      })

      const resumoCancelado = montarResumo(pedido.id, pedido.totalCentavos)
      if (!resumoCancelado) {
        throw new ErroDivisaoConta(
          CODIGOS_ERRO_DIVISAO_CONTA.DIVISAO_NAO_ENCONTRADA,
          'Divisao nao encontrada apos cancelamento.',
        )
      }
      return resumoCancelado
    })

    persistirConexaoBanco(conexao)
    return resumo
  }
}

export const cancelarDivisaoConta = criarCancelarDivisaoConta()

export function criarListarHistoricoDivisaoConta(
  repositorioMovimentacao: PedidoDivisaoMovimentacaoRepository =
    criarPedidoDivisaoMovimentacaoRepository(),
) {
  return function listarHistoricoDivisaoConta(
    entrada: ListarHistoricoDivisaoContaEntrada,
  ): PedidoDivisaoMovimentacao[] {
    return repositorioMovimentacao.listarPorPedido(entrada.pedidoId)
  }
}

export const listarHistoricoDivisaoConta = criarListarHistoricoDivisaoConta()
