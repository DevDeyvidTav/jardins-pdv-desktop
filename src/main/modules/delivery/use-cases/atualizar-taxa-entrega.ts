import type { AtualizarTaxaEntregaEntrada, ResumoPedido } from '@shared/types/pedido'
import { STATUS_PEDIDO, TIPO_PEDIDO } from '@shared/types/pedido'
import { garantirPedidoSemDivisaoAtiva, montarResumoDivisaoConta } from '../../divisao-conta/services/resumo-divisao-conta'
import { ErroDelivery, CODIGOS_ERRO_DELIVERY } from '../errors/erros-delivery'
import {
  criarPedidoRepository,
  type PedidoRepository,
} from '../../pedidos/repositories/pedido.repository'
import {
  criarPedidoItemRepository,
  type PedidoItemRepository,
} from '../../pedidos/repositories/pedido-item.repository'
import {
  criarPedidoEntregaRepository,
  type PedidoEntregaRepository,
} from '../repositories/pedido-entrega.repository'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import {
  persistirConexaoBanco,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'

export function criarAtualizarTaxaEntrega(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioItem: PedidoItemRepository = criarPedidoItemRepository(),
  repositorioEntrega: PedidoEntregaRepository = criarPedidoEntregaRepository(),
  obterConexao = obterConexaoBancoLocal,
) {
  return function atualizarTaxaEntrega(
    entrada: AtualizarTaxaEntregaEntrada,
  ): ResumoPedido {
    const pedido = repositorioPedido.buscarPorId(entrada.pedidoId)
    if (!pedido) {
      throw new ErroDelivery(
        CODIGOS_ERRO_DELIVERY.PEDIDO_NAO_ENCONTRADO,
        'Pedido nao encontrado.',
      )
    }
    if (pedido.tipo !== TIPO_PEDIDO.DELIVERY) {
      throw new ErroDelivery(
        CODIGOS_ERRO_DELIVERY.PEDIDO_NAO_E_DELIVERY,
        'Apenas pedidos delivery possuem taxa de entrega.',
      )
    }
    if (pedido.status !== STATUS_PEDIDO.ABERTO) {
      throw new ErroDelivery(
        CODIGOS_ERRO_DELIVERY.PEDIDO_NAO_ABERTO,
        'A taxa de entrega so pode ser alterada enquanto o pedido estiver aberto.',
      )
    }
    garantirPedidoSemDivisaoAtiva(pedido.id)
    if (entrada.taxaEntregaCentavos < 0) {
      throw new ErroDelivery(
        CODIGOS_ERRO_DELIVERY.TAXA_ENTREGA_INVALIDA,
        'Taxa de entrega deve ser maior ou igual a zero.',
      )
    }

    // Recalcular total com nova taxa
    const subtotalLiquido =
      pedido.subtotalCentavos -
      pedido.descontoItensCentavos -
      pedido.descontoPedidoCentavos

    const novoTotal = subtotalLiquido + entrada.taxaEntregaCentavos

    // Garantir que o total não caia abaixo do valor já pago
    const valorQuitado = pedido.valorPagoCentavos + pedido.valorCortesiaCentavos
    if (novoTotal < valorQuitado) {
      throw new ErroDelivery(
        CODIGOS_ERRO_DELIVERY.TOTAL_MENOR_QUE_VALOR_JA_QUITADO,
        'Nao e possivel reduzir o total abaixo do valor ja quitado.',
      )
    }

    const novoRestante = novoTotal - valorQuitado
    const agora = agoraEmIsoUtc()
    const conexao = obterConexao()

    conexao.instancia.run(
      `UPDATE pedido
       SET taxa_entrega_centavos = ?, total_centavos = ?,
           valor_restante_centavos = ?, atualizado_em = ?
       WHERE id = ?`,
      [entrada.taxaEntregaCentavos, novoTotal, novoRestante, agora, pedido.id],
    )

    if (novoRestante === 0) {
      conexao.instancia.run(
        `UPDATE pedido SET status = ?, finalizado_em = ?, atualizado_em = ? WHERE id = ?`,
        [STATUS_PEDIDO.FINALIZADO, agora, agora, pedido.id],
      )
    }

    persistirConexaoBanco(conexao)

    const pedidoAtualizado = repositorioPedido.buscarPorId(pedido.id)!
    const itens = repositorioItem.listarPorPedido(pedido.id, true)
    const entrega = repositorioEntrega.buscarPorPedidoId(pedido.id)

    return {
      pedido: pedidoAtualizado,
      itens,
      entrega,
      divisao: montarResumoDivisaoConta(pedido.id, pedidoAtualizado.totalCentavos),
    }
  }
}

export const atualizarTaxaEntrega = criarAtualizarTaxaEntrega()
