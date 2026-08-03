import type {
  RegistrarPagamentoPedidoEntrada,
  ResumoPagamentoPedido,
} from '@shared/types/pagamento-pedido'
import { FORMA_PAGAMENTO } from '@shared/types/pagamento-pedido'
import { STATUS_PEDIDO, TIPO_PEDIDO } from '@shared/types/pedido'
import { STATUS_SESSAO_CAIXA } from '@shared/types/sessao-caixa'
import {
  MOTIVO_ENCERRAMENTO_AGRUPAMENTO,
  STATUS_MESA,
  TIPO_MOVIMENTACAO_MESA,
} from '@shared/types/mesa'
import {
  confirmarTransacao,
  iniciarTransacaoImediata,
  persistirConexaoBanco,
  reverterTransacao,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import { CODIGOS_ERRO_PEDIDOS, ErroPedidos } from '../../pedidos/errors/erros-pedidos'
import { criarPedidoItemRepository, type PedidoItemRepository } from '../../pedidos/repositories/pedido-item.repository'
import { criarPedidoRepository, type PedidoRepository } from '../../pedidos/repositories/pedido.repository'
import { criarMesaRepository, type MesaRepository } from '../../mesas/repositories/mesa.repository'
import { criarSessaoCaixaRepository, type SessaoCaixaRepository } from '../../caixa/repositories/sessao-caixa.repository'
import {
  atualizarStatusMesaNaConexao,
  encerrarAgrupamentoAtivoNaConexao,
  inserirMovimentacaoNaConexao,
  snapshotMesa,
} from '../../mesas/services/mesa-movimentacao.sql'
import {
  criarPagamentoPedidoRepository,
  type PagamentoPedidoRepository,
} from '../repositories/pagamento-pedido.repository'

export function criarRegistrarPagamentoPedido(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioItem: PedidoItemRepository = criarPedidoItemRepository(),
  repositorioSessao: SessaoCaixaRepository = criarSessaoCaixaRepository(),
  repositorioMesa: MesaRepository = criarMesaRepository(),
  repositorioPagamento: PagamentoPedidoRepository = criarPagamentoPedidoRepository(),
  obterConexao = obterConexaoBancoLocal,
) {
  return function registrarPagamentoPedido(
    entrada: RegistrarPagamentoPedidoEntrada,
  ): ResumoPagamentoPedido {
    const sessao = repositorioSessao.buscarSessaoAberta()
    if (!sessao || sessao.status !== STATUS_SESSAO_CAIXA.ABERTO) {
      throw new ErroPedidos(CODIGOS_ERRO_PEDIDOS.CAIXA_NAO_ABERTO, 'Abra o caixa antes de receber pagamentos.')
    }

    const pedido = repositorioPedido.buscarPorId(entrada.pedidoId)
    if (!pedido) {
      throw new ErroPedidos(CODIGOS_ERRO_PEDIDOS.PEDIDO_NAO_ENCONTRADO, 'Pedido nao encontrado.')
    }
    if (pedido.status !== STATUS_PEDIDO.ABERTO) {
      throw new ErroPedidos(CODIGOS_ERRO_PEDIDOS.PEDIDO_NAO_ABERTO, 'Pedido nao esta aberto para pagamento.')
    }

    const itensAtivos = repositorioItem.listarPorPedido(pedido.id, true)
    if (itensAtivos.length === 0) {
      throw new ErroPedidos(CODIGOS_ERRO_PEDIDOS.ITEM_NAO_ENCONTRADO, 'Pedido precisa possuir ao menos um item ativo.')
    }

    if (entrada.valorCentavos <= 0) {
      throw new ErroPedidos(
        CODIGOS_ERRO_PEDIDOS.ENTRADA_INVALIDA,
        'Valor do pagamento deve ser maior que zero.',
      )
    }

    if (
      entrada.formaPagamento === FORMA_PAGAMENTO.CORTESIA &&
      (!entrada.motivoCortesia || entrada.motivoCortesia.trim().length === 0)
    ) {
      throw new ErroPedidos(
        CODIGOS_ERRO_PEDIDOS.ENTRADA_INVALIDA,
        'Motivo da cortesia e obrigatorio.',
      )
    }

    const valorPagoAtual = Number(pedido.valorPagoCentavos) || 0
    const valorCortesiaAtual = Number(pedido.valorCortesiaCentavos) || 0
    const totalPedidoCentavos = Number(pedido.totalCentavos) || 0

    const valorAtualQuitado = valorPagoAtual + valorCortesiaAtual
    const valorRestanteAntes = totalPedidoCentavos - valorAtualQuitado

    if (valorRestanteAntes <= 0) {
      throw new ErroPedidos(
        CODIGOS_ERRO_PEDIDOS.ENTRADA_INVALIDA,
        'Pedido ja esta quitado.',
      )
    }

    if (entrada.valorCentavos > valorRestanteAntes) {
      throw new ErroPedidos(
        CODIGOS_ERRO_PEDIDOS.ENTRADA_INVALIDA,
        'Pagamento nao pode ser maior que o valor restante.',
      )
    }

    const pagamentoInformado = {
      formaPagamento: entrada.formaPagamento,
      valorCentavos: entrada.valorCentavos,
      motivoCortesia: entrada.motivoCortesia,
    }

    const valorPagoCentavos =
      valorPagoAtual +
      (entrada.formaPagamento === FORMA_PAGAMENTO.CORTESIA
        ? 0
        : entrada.valorCentavos)
    const valorCortesiaCentavos =
      valorCortesiaAtual +
      (entrada.formaPagamento === FORMA_PAGAMENTO.CORTESIA
        ? entrada.valorCentavos
        : 0)

    const valorQuitadoCentavos = valorPagoCentavos + valorCortesiaCentavos
    const valorRestanteCentavos = totalPedidoCentavos - valorQuitadoCentavos

    const conexao = obterConexao()
    iniciarTransacaoImediata(conexao)
    try {
      repositorioPagamento.inserir(
        pedido.id,
        sessao.id,
        pagamentoInformado,
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

      if (valorRestanteCentavos === 0) {
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

      confirmarTransacao(conexao)
    } catch (erro) {
      reverterTransacao(conexao)
      throw erro
    }

    persistirConexaoBanco(conexao)

    return {
      pedidoId: pedido.id,
      totalPedidoCentavos,
      totalPagoCentavos: valorPagoCentavos,
      valorRestanteCentavos,
      pagamentos: repositorioPagamento.listarPorPedido(pedido.id),
    }
  }
}

export const registrarPagamentoPedido = criarRegistrarPagamentoPedido()
