import type {
  AplicarDescontoPedidoEntrada,
  ResumoPedido,
} from '@shared/types/pedido'
import { STATUS_PEDIDO, TIPO_PEDIDO } from '@shared/types/pedido'
import {
  MOTIVO_ENCERRAMENTO_AGRUPAMENTO,
  STATUS_MESA,
  TIPO_MOVIMENTACAO_MESA,
} from '@shared/types/mesa'
import { STATUS_SESSAO_CAIXA } from '@shared/types/sessao-caixa'
import {
  confirmarTransacao,
  iniciarTransacaoImediata,
  persistirConexaoBanco,
  reverterTransacao,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import { CODIGOS_ERRO_PEDIDOS, ErroPedidos } from '../errors/erros-pedidos'
import type { PedidoRepository } from '../repositories/pedido.repository'
import { criarPedidoRepository } from '../repositories/pedido.repository'
import type { PedidoItemRepository } from '../repositories/pedido-item.repository'
import { criarPedidoItemRepository } from '../repositories/pedido-item.repository'
import type { MesaRepository } from '../../mesas/repositories/mesa.repository'
import { criarMesaRepository } from '../../mesas/repositories/mesa.repository'
import type { SessaoCaixaRepository } from '../../caixa/repositories/sessao-caixa.repository'
import { criarSessaoCaixaRepository } from '../../caixa/repositories/sessao-caixa.repository'
import {
  atualizarStatusMesaNaConexao,
  encerrarAgrupamentoAtivoNaConexao,
  inserirMovimentacaoNaConexao,
  snapshotMesa,
} from '../../mesas/services/mesa-movimentacao.sql'
import { calcularTotaisPedidoComTaxa } from '../types/pedido-calculos.types'
import { garantirPedidoAberto, obterResumoPedido } from './consultas-pedido'

export function criarAplicarDescontoPedido(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioItem: PedidoItemRepository = criarPedidoItemRepository(),
  repositorioSessao: SessaoCaixaRepository = criarSessaoCaixaRepository(),
  repositorioMesa: MesaRepository = criarMesaRepository(),
  obterConexao = obterConexaoBancoLocal,
) {
  return function aplicarDescontoPedido(
    entrada: AplicarDescontoPedidoEntrada,
  ): ResumoPedido {
    const sessao = repositorioSessao.buscarSessaoAberta()
    if (!sessao || sessao.status !== STATUS_SESSAO_CAIXA.ABERTO) {
      throw new ErroPedidos(
        CODIGOS_ERRO_PEDIDOS.CAIXA_NAO_ABERTO,
        'Abra o caixa antes de aplicar descontos no pedido.',
      )
    }

    const pedido = repositorioPedido.buscarPorId(entrada.pedidoId)
    if (!pedido) {
      throw new ErroPedidos(
        CODIGOS_ERRO_PEDIDOS.PEDIDO_NAO_ENCONTRADO,
        'Pedido nao encontrado.',
      )
    }

    garantirPedidoAberto(pedido)

    if (entrada.descontoCentavos < 0) {
      throw new ErroPedidos(
        CODIGOS_ERRO_PEDIDOS.ENTRADA_INVALIDA,
        'Desconto do pedido deve ser maior ou igual a zero.',
      )
    }

    const itensAtivos = repositorioItem.listarPorPedido(pedido.id, true)
    const subtotalCentavos = itensAtivos.reduce(
      (acc, item) => acc + item.subtotalCentavos,
      0,
    )
    const descontoItensCentavos = itensAtivos.reduce(
      (acc, item) => acc + item.descontoCentavos,
      0,
    )

    const totalAntesDescontoPedidoCentavos =
      subtotalCentavos - descontoItensCentavos

    if (entrada.descontoCentavos > totalAntesDescontoPedidoCentavos) {
      throw new ErroPedidos(
        CODIGOS_ERRO_PEDIDOS.ENTRADA_INVALIDA,
        'Desconto do pedido nao pode ser maior que o total apos descontos de itens.',
      )
    }

    let totaisCalculados: ReturnType<typeof calcularTotaisPedidoComTaxa>
    try {
      totaisCalculados = calcularTotaisPedidoComTaxa(
        subtotalCentavos,
        descontoItensCentavos,
        entrada.descontoCentavos,
        pedido.taxaEntregaCentavos,
        pedido.valorPagoCentavos,
        pedido.valorCortesiaCentavos,
      )
    } catch (erro) {
      throw new ErroPedidos(
        CODIGOS_ERRO_PEDIDOS.ENTRADA_INVALIDA,
        erro instanceof Error ? erro.message : 'Erro ao calcular descontos do pedido.',
      )
    }

    const conexao = obterConexao()
    iniciarTransacaoImediata(conexao)
    try {
      repositorioPedido.atualizarTotais({
        pedidoId: pedido.id,
        subtotalCentavos: totaisCalculados.subtotalCentavos,
        descontoItensCentavos: totaisCalculados.descontoItensCentavos,
        descontoPedidoCentavos: totaisCalculados.descontoPedidoCentavos,
        totalCentavos: totaisCalculados.totalCentavos,
        valorRestanteCentavos: totaisCalculados.valorRestanteCentavos,
      })

      if (totaisCalculados.valorRestanteCentavos === 0) {
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

    return obterResumoPedido({ pedidoId: pedido.id })
  }
}

export const aplicarDescontoPedido = criarAplicarDescontoPedido()
