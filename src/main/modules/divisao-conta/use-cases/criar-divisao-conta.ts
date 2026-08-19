import type { CriarDivisaoContaEntrada, ResumoDivisaoConta } from '@shared/types/divisao-conta'
import { STATUS_PEDIDO } from '@shared/types/pedido'
import { STATUS_SESSAO_CAIXA } from '@shared/types/sessao-caixa'
import { TIPO_MOVIMENTACAO_DIVISAO } from '@shared/types/divisao-conta'
import {
  executarEmTransacaoImediata,
  persistirConexaoBanco,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import {
  criarSessaoCaixaRepository,
  type SessaoCaixaRepository,
} from '../../caixa/repositories/sessao-caixa.repository'
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

export function criarCriarDivisaoConta(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioSessao: SessaoCaixaRepository = criarSessaoCaixaRepository(),
  repositorioPagamento: PagamentoPedidoRepository = criarPagamentoPedidoRepository(),
  repositorioDivisao: PedidoDivisaoContaRepository = criarPedidoDivisaoContaRepository(),
  repositorioParte: PedidoDivisaoParteRepository = criarPedidoDivisaoParteRepository(),
  repositorioMovimentacao: PedidoDivisaoMovimentacaoRepository =
    criarPedidoDivisaoMovimentacaoRepository(),
  obterConexao = obterConexaoBancoLocal,
) {
  const montarResumo = criarMontarResumoDivisaoConta(
    repositorioDivisao,
    repositorioParte,
    repositorioPagamento,
  )

  return function criarDivisaoConta(entrada: CriarDivisaoContaEntrada): ResumoDivisaoConta {
    const conexao = obterConexao()
    const resumo = executarEmTransacaoImediata(conexao, () => {
      const sessao = repositorioSessao.buscarSessaoAberta()
      if (!sessao || sessao.status !== STATUS_SESSAO_CAIXA.ABERTO) {
        throw new ErroDivisaoConta(
          CODIGOS_ERRO_DIVISAO_CONTA.CAIXA_NAO_ABERTO,
          'Abra o caixa antes de dividir a conta.',
        )
      }

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
          'Pedido nao esta aberto para divisao de conta.',
        )
      }

      if (pedido.totalCentavos <= 0) {
        throw new ErroDivisaoConta(
          CODIGOS_ERRO_DIVISAO_CONTA.PEDIDO_TOTAL_INVALIDO,
          'Pedido precisa ter total maior que zero para divisao.',
        )
      }

      if (repositorioDivisao.buscarPorPedido(pedido.id)) {
        throw new ErroDivisaoConta(
          CODIGOS_ERRO_DIVISAO_CONTA.DIVISAO_JA_EXISTE,
          'Pedido ja possui divisao de conta (ativa, quitada ou cancelada).',
        )
      }

      const pagamentos = repositorioPagamento.listarPorPedido(pedido.id)
      if (pagamentos.some((p) => p.canceladoEm === null)) {
        throw new ErroDivisaoConta(
          CODIGOS_ERRO_DIVISAO_CONTA.DIVISAO_NAO_PERMITIDA_COM_PAGAMENTOS_EXISTENTES,
          'Nao e permitido iniciar divisao com pagamentos ja registrados.',
        )
      }

      if (entrada.partes.length < 2) {
        throw new ErroDivisaoConta(
          CODIGOS_ERRO_DIVISAO_CONTA.DIVISAO_PRECISA_DE_DUAS_OU_MAIS_PARTES,
          'Divisao precisa de duas ou mais partes.',
        )
      }

      for (const parte of entrada.partes) {
        if (!parte.identificacao.trim() || parte.valorDefinidoCentavos <= 0) {
          throw new ErroDivisaoConta(
            CODIGOS_ERRO_DIVISAO_CONTA.DIVISAO_VALOR_PARTE_INVALIDO,
            'Cada parte precisa de identificacao e valor maior que zero.',
          )
        }
      }

      const somaPartes = entrada.partes.reduce(
        (acc, parte) => acc + parte.valorDefinidoCentavos,
        0,
      )
      if (somaPartes !== pedido.totalCentavos) {
        throw new ErroDivisaoConta(
          CODIGOS_ERRO_DIVISAO_CONTA.DIVISAO_VALORES_NAO_FECHAM_COM_TOTAL_PEDIDO,
          `Soma das partes (${somaPartes}) deve ser igual ao total do pedido (${pedido.totalCentavos}).`,
        )
      }

      if (repositorioDivisao.buscarAtivaPorPedido(pedido.id)) {
        throw new ErroDivisaoConta(
          CODIGOS_ERRO_DIVISAO_CONTA.DIVISAO_JA_EXISTE,
          'Pedido ja possui divisao de conta ativa.',
        )
      }

      const divisao = repositorioDivisao.inserir({
        pedidoId: pedido.id,
        valorTotalCentavos: pedido.totalCentavos,
      })

      repositorioMovimentacao.inserir({
        pedidoId: pedido.id,
        divisaoId: divisao.id,
        tipo: TIPO_MOVIMENTACAO_DIVISAO.DIVISAO_CRIADA,
        dadosAntes: { pedidoId: pedido.id, totalCentavos: pedido.totalCentavos },
        dadosDepois: {
          divisaoId: divisao.id,
          valorTotalCentavos: divisao.valorTotalCentavos,
          quantidadePartes: entrada.partes.length,
        },
      })

      for (const parteEntrada of entrada.partes) {
        const parte = repositorioParte.inserir({
          divisaoId: divisao.id,
          identificacao: parteEntrada.identificacao.trim(),
          valorDefinidoCentavos: parteEntrada.valorDefinidoCentavos,
        })

        repositorioMovimentacao.inserir({
          pedidoId: pedido.id,
          divisaoId: divisao.id,
          parteId: parte.id,
          tipo: TIPO_MOVIMENTACAO_DIVISAO.PARTE_CRIADA,
          dadosAntes: {},
          dadosDepois: {
            parteId: parte.id,
            identificacao: parte.identificacao,
            valorDefinidoCentavos: parte.valorDefinidoCentavos,
          },
        })
      }

      const resumoCriado = montarResumo(pedido.id, pedido.totalCentavos)
      if (!resumoCriado) {
        throw new ErroDivisaoConta(
          CODIGOS_ERRO_DIVISAO_CONTA.DIVISAO_NAO_ENCONTRADA,
          'Divisao criada nao encontrada.',
        )
      }
      return resumoCriado
    })

    persistirConexaoBanco(conexao)
    return resumo
  }
}

export const criarDivisaoConta = criarCriarDivisaoConta()
