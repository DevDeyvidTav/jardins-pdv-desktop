import type {
  RegistrarPagamentoParteDivisaoEntrada,
  ResumoDivisaoConta,
} from '@shared/types/divisao-conta'
import {
  STATUS_DIVISAO_CONTA,
  STATUS_PARTE_DIVISAO,
  TIPO_MOVIMENTACAO_DIVISAO,
} from '@shared/types/divisao-conta'
import { FORMA_PAGAMENTO, pagamentoEntraNoValorPago } from '@shared/types/pagamento-pedido'
import { mensagemErroValorRecebidoDinheiro } from '@shared/utils/troco-dinheiro'
import { STATUS_PEDIDO, TIPO_PEDIDO } from '@shared/types/pedido'
import { STATUS_SESSAO_CAIXA } from '@shared/types/sessao-caixa'
import {
  MOTIVO_ENCERRAMENTO_AGRUPAMENTO,
  STATUS_MESA,
  TIPO_MOVIMENTACAO_MESA,
} from '@shared/types/mesa'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import {
  executarEmTransacaoImediata,
  persistirConexaoBanco,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { registrarEventoPedidoSync } from '../../sincronizacao/services/registrar-evento-pedido'
import { avaliarEmissaoNfce } from '../../pedidos/services/avaliar-emissao-nfce'
import { normalizarCpf } from '@shared/utils/cpf'
import {
  criarSessaoCaixaRepository,
  type SessaoCaixaRepository,
} from '../../caixa/repositories/sessao-caixa.repository'
import {
  criarPedidoRepository,
  type PedidoRepository,
} from '../../pedidos/repositories/pedido.repository'
import {
  criarPedidoItemRepository,
  type PedidoItemRepository,
} from '../../pedidos/repositories/pedido-item.repository'
import {
  criarMesaRepository,
  type MesaRepository,
} from '../../mesas/repositories/mesa.repository'
import {
  atualizarStatusMesaNaConexao,
  encerrarAgrupamentoAtivoNaConexao,
  inserirMovimentacaoNaConexao,
  snapshotMesa,
} from '../../mesas/services/mesa-movimentacao.sql'
import {
  criarPagamentoPedidoRepository,
  type PagamentoPedidoRepository,
} from '../../pagamentos/repositories/pagamento-pedido.repository'
import {
  criarClienteRepository,
  type ClienteRepository,
} from '../../clientes/repositories/cliente.repository'
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
import {
  calcularStatusParte,
  criarMontarResumoDivisaoConta,
} from '../services/resumo-divisao-conta'

export function criarRegistrarPagamentoParteDivisao(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioItem: PedidoItemRepository = criarPedidoItemRepository(),
  repositorioSessao: SessaoCaixaRepository = criarSessaoCaixaRepository(),
  repositorioMesa: MesaRepository = criarMesaRepository(),
  repositorioPagamento: PagamentoPedidoRepository = criarPagamentoPedidoRepository(),
  repositorioDivisao: PedidoDivisaoContaRepository = criarPedidoDivisaoContaRepository(),
  repositorioParte: PedidoDivisaoParteRepository = criarPedidoDivisaoParteRepository(),
  repositorioMovimentacao: PedidoDivisaoMovimentacaoRepository =
    criarPedidoDivisaoMovimentacaoRepository(),
  obterConexao = obterConexaoBancoLocal,
  repositorioCliente: ClienteRepository = criarClienteRepository(),
) {
  const montarResumo = criarMontarResumoDivisaoConta(
    repositorioDivisao,
    repositorioParte,
    repositorioPagamento,
  )

  return function registrarPagamentoParteDivisao(
    entrada: RegistrarPagamentoParteDivisaoEntrada,
  ): ResumoDivisaoConta {
    const conexao = obterConexao()
    const resumo = executarEmTransacaoImediata(conexao, () => {
      const sessao = repositorioSessao.buscarSessaoAberta()
      if (!sessao || sessao.status !== STATUS_SESSAO_CAIXA.ABERTO) {
        throw new ErroDivisaoConta(
          CODIGOS_ERRO_DIVISAO_CONTA.CAIXA_NAO_ABERTO,
          'Abra o caixa antes de registrar pagamentos.',
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
          'Pedido nao esta aberto para pagamento.',
        )
      }

      const itensAtivos = repositorioItem.listarPorPedido(pedido.id, true)
      if (itensAtivos.length === 0) {
        throw new ErroDivisaoConta(
          CODIGOS_ERRO_DIVISAO_CONTA.ENTRADA_INVALIDA,
          'Pedido precisa possuir ao menos um item ativo.',
        )
      }

      const divisao = repositorioDivisao.buscarAtivaPorPedido(pedido.id)
      if (!divisao) {
        throw new ErroDivisaoConta(
          CODIGOS_ERRO_DIVISAO_CONTA.DIVISAO_NAO_ESTA_ATIVA,
          'Divisao ativa nao encontrada para o pedido.',
        )
      }

      const parte = repositorioParte.buscarPorId(entrada.parteId)
      if (!parte) {
        throw new ErroDivisaoConta(
          CODIGOS_ERRO_DIVISAO_CONTA.PARTE_DIVISAO_NAO_ENCONTRADA,
          'Parte da divisao nao encontrada.',
        )
      }
      if (parte.pedidoDivisaoContaId !== divisao.id) {
        throw new ErroDivisaoConta(
          CODIGOS_ERRO_DIVISAO_CONTA.PARTE_NAO_PERTENCE_A_DIVISAO,
          'Parte nao pertence a divisao do pedido.',
        )
      }

      if (entrada.formaPagamento === FORMA_PAGAMENTO.TALAO) {
        if (!pedido.clienteId) {
          throw new ErroDivisaoConta(
            CODIGOS_ERRO_DIVISAO_CONTA.ENTRADA_INVALIDA,
            'Vincule um cliente cadastrado antes de pagar no talao.',
          )
        }
        const cliente = repositorioCliente.buscarPorId(pedido.clienteId)
        if (!cliente?.ativo || !cliente.liberaTalao) {
          throw new ErroDivisaoConta(
            CODIGOS_ERRO_DIVISAO_CONTA.ENTRADA_INVALIDA,
            'Este cliente nao tem talao liberado.',
          )
        }
      }

      if (
        entrada.formaPagamento === FORMA_PAGAMENTO.CORTESIA &&
        (!entrada.motivoCortesia || entrada.motivoCortesia.trim().length === 0)
      ) {
        throw new ErroDivisaoConta(
          CODIGOS_ERRO_DIVISAO_CONTA.ENTRADA_INVALIDA,
          'Motivo da cortesia e obrigatorio.',
        )
      }

      const resumoAntes = montarResumo(pedido.id, pedido.totalCentavos)!
      const parteResumo = resumoAntes.partes.find((p) => p.id === parte.id)!

      if (parteResumo.status === STATUS_PARTE_DIVISAO.QUITADA) {
        throw new ErroDivisaoConta(
          CODIGOS_ERRO_DIVISAO_CONTA.PARTE_JA_ESTA_QUITADA,
          'Parte ja esta quitada.',
        )
      }

      if (entrada.valorCentavos > parteResumo.valorRestanteCentavos) {
        throw new ErroDivisaoConta(
          CODIGOS_ERRO_DIVISAO_CONTA.PAGAMENTO_EXCEDE_VALOR_RESTANTE_DA_PARTE,
          'Pagamento excede o valor restante da parte.',
        )
      }

      if (entrada.valorCentavos > pedido.valorRestanteCentavos) {
        throw new ErroDivisaoConta(
          CODIGOS_ERRO_DIVISAO_CONTA.PAGAMENTO_EXCEDE_VALOR_RESTANTE_DO_PEDIDO,
          'Pagamento excede o valor restante do pedido.',
        )
      }

      const erroRecebido = mensagemErroValorRecebidoDinheiro(
        entrada.formaPagamento,
        entrada.valorCentavos,
        entrada.valorRecebidoCentavos,
      )
      if (erroRecebido) {
        throw new ErroDivisaoConta(
          CODIGOS_ERRO_DIVISAO_CONTA.ENTRADA_INVALIDA,
          erroRecebido,
        )
      }

      const valorPagoAtual = Number(pedido.valorPagoCentavos) || 0
      const valorCortesiaAtual = Number(pedido.valorCortesiaCentavos) || 0
      const totalPedidoCentavos = Number(pedido.totalCentavos) || 0

      const valorPagoCentavos =
        valorPagoAtual +
        (pagamentoEntraNoValorPago(entrada.formaPagamento) ? entrada.valorCentavos : 0)
      const valorCortesiaCentavos =
        valorCortesiaAtual +
        (entrada.formaPagamento === FORMA_PAGAMENTO.CORTESIA ? entrada.valorCentavos : 0)
      const valorRestanteCentavos =
        totalPedidoCentavos - (valorPagoCentavos + valorCortesiaCentavos)

      const pagamento = repositorioPagamento.inserir(
        pedido.id,
        sessao.id,
        {
          formaPagamento: entrada.formaPagamento,
          valorCentavos: entrada.valorCentavos,
          valorRecebidoCentavos: entrada.valorRecebidoCentavos,
          motivoCortesia: entrada.motivoCortesia,
        },
        false,
        entrada.parteId,
      )

      repositorioPedido.atualizarValoresPagamento({
        pedidoId: pedido.id,
        valorPagoCentavos,
        valorCortesiaCentavos,
      })
      repositorioPedido.atualizarTotais({
        pedidoId: pedido.id,
        subtotalCentavos: Number(pedido.subtotalCentavos) || 0,
        descontoItensCentavos: Number(pedido.descontoItensCentavos) || 0,
        descontoPedidoCentavos: Number(pedido.descontoPedidoCentavos) || 0,
        totalCentavos: totalPedidoCentavos,
        valorRestanteCentavos,
      })

      const valorPagoParte =
        parteResumo.valorPagoCentavos + entrada.valorCentavos
      const novoStatusParte = calcularStatusParte(
        parte.valorDefinidoCentavos,
        valorPagoParte,
      )
      const agora = agoraEmIsoUtc()

      repositorioParte.atualizarStatus(
        parte.id,
        novoStatusParte,
        novoStatusParte === STATUS_PARTE_DIVISAO.QUITADA ? agora : null,
      )

      repositorioMovimentacao.inserir({
        pedidoId: pedido.id,
        divisaoId: divisao.id,
        parteId: parte.id,
        tipo: TIPO_MOVIMENTACAO_DIVISAO.PAGAMENTO_VINCULADO_A_PARTE,
        dadosAntes: {
          valorPagoParte: parteResumo.valorPagoCentavos,
          status: parteResumo.status,
        },
        dadosDepois: {
          pagamentoId: pagamento.id,
          formaPagamento: entrada.formaPagamento,
          valorCentavos: entrada.valorCentavos,
          valorPagoParte,
          status: novoStatusParte,
        },
      })

      if (novoStatusParte === STATUS_PARTE_DIVISAO.PARCIALMENTE_PAGA) {
        repositorioMovimentacao.inserir({
          pedidoId: pedido.id,
          divisaoId: divisao.id,
          parteId: parte.id,
          tipo: TIPO_MOVIMENTACAO_DIVISAO.PARTE_ATUALIZADA_PARA_PARCIALMENTE_PAGA,
          dadosAntes: { status: parteResumo.status },
          dadosDepois: { status: novoStatusParte },
        })
      }

      if (novoStatusParte === STATUS_PARTE_DIVISAO.QUITADA) {
        repositorioMovimentacao.inserir({
          pedidoId: pedido.id,
          divisaoId: divisao.id,
          parteId: parte.id,
          tipo: TIPO_MOVIMENTACAO_DIVISAO.PARTE_QUITADA,
          dadosAntes: { status: parteResumo.status },
          dadosDepois: { status: novoStatusParte, quitadoEm: agora },
        })
      }

      const partes = repositorioParte.listarPorDivisao(divisao.id)
      const todasQuitadas = partes.every((p) => {
        if (p.id === parte.id) return novoStatusParte === STATUS_PARTE_DIVISAO.QUITADA
        return p.status === STATUS_PARTE_DIVISAO.QUITADA
      })

      if (todasQuitadas) {
        repositorioDivisao.atualizarStatus(divisao.id, STATUS_DIVISAO_CONTA.QUITADA)
        repositorioMovimentacao.inserir({
          pedidoId: pedido.id,
          divisaoId: divisao.id,
          tipo: TIPO_MOVIMENTACAO_DIVISAO.DIVISAO_QUITADA,
          dadosAntes: { status: divisao.status },
          dadosDepois: { status: STATUS_DIVISAO_CONTA.QUITADA },
        })
      }

      const fiscalSolicitado = entrada.fiscalSolicitado ?? pedido.fiscalSolicitado
      const fiscalCpfDestinatario =
        entrada.fiscalCpfDestinatario === undefined
          ? pedido.fiscalCpfDestinatario
          : entrada.fiscalCpfDestinatario
      if (entrada.fiscalSolicitado !== undefined) {
        repositorioPedido.atualizarSolicitacaoFiscal({
          pedidoId: pedido.id,
          fiscalSolicitado,
          fiscalCpfDestinatario: normalizarCpf(fiscalCpfDestinatario) || null,
        })
      }

      if (valorRestanteCentavos === 0) {
        const avaliacao = avaliarEmissaoNfce({
          pedido: { ...pedido, totalCentavos: totalPedidoCentavos },
          itens: repositorioItem.listarPorPedido(pedido.id, true),
          fiscalSolicitado,
          fiscalCpfDestinatario,
          valorPagoAposPagamento: valorPagoCentavos,
          valorCortesiaAposPagamento: valorCortesiaCentavos,
          exigirValorPago: true,
        })
        if (!avaliacao.ok) {
          throw new ErroDivisaoConta(
            CODIGOS_ERRO_DIVISAO_CONTA.ENTRADA_INVALIDA,
            avaliacao.motivo,
          )
        }

        if (!todasQuitadas) {
          throw new ErroDivisaoConta(
            CODIGOS_ERRO_DIVISAO_CONTA.FINALIZACAO_BLOQUEADA_POR_PARTES_PENDENTES,
            'Pedido nao pode ser finalizado com partes pendentes na divisao.',
          )
        }

        repositorioPedido.finalizar(pedido.id)
        if (pedido.tipo === TIPO_PEDIDO.MESA && pedido.mesaId) {
          const mesaAntes = repositorioMesa.buscarPorId(pedido.mesaId)
          const encerrado = encerrarAgrupamentoAtivoNaConexao(conexao, {
            pedidoId: pedido.id,
            motivo: MOTIVO_ENCERRAMENTO_AGRUPAMENTO.PEDIDO_FINALIZADO,
            liberarMesaPrincipal: true,
          })
          if (!encerrado) {
            atualizarStatusMesaNaConexao(conexao, pedido.mesaId, STATUS_MESA.LIVRE)
          }
          inserirMovimentacaoNaConexao(conexao, {
            pedidoId: pedido.id,
            tipo: TIPO_MOVIMENTACAO_MESA.PEDIDO_FINALIZADO,
            mesaOrigemId: pedido.mesaId,
            mesaAgrupamentoId: pedido.mesaAgrupamentoId,
            dadosAntes: {
              pedidoId: pedido.id,
              status: pedido.status,
              mesa: mesaAntes ? snapshotMesa(mesaAntes) : null,
            },
            dadosDepois: {
              pedidoId: pedido.id,
              status: STATUS_PEDIDO.FINALIZADO,
            },
          })
        }
      }

      const pedidoAtualizado = repositorioPedido.buscarPorId(pedido.id)!
      registrarEventoPedidoSync(pedido.id, OPERACAO_SYNC.UPDATE, conexao)
      return montarResumo(pedido.id, pedidoAtualizado.totalCentavos)!
    })

    persistirConexaoBanco(conexao)
    return resumo
  }
}

export const registrarPagamentoParteDivisao = criarRegistrarPagamentoParteDivisao()
