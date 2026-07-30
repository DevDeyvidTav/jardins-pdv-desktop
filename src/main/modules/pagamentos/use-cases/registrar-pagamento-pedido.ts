import type { RegistrarPagamentoPedidoEntrada, ResumoPagamentoPedido } from '@shared/types/pagamento-pedido'
import { STATUS_PEDIDO, TIPO_PEDIDO } from '@shared/types/pedido'
import { STATUS_SESSAO_CAIXA } from '@shared/types/sessao-caixa'
import { STATUS_MESA } from '@shared/types/mesa'
import { CODIGOS_ERRO_PEDIDOS, ErroPedidos } from '../../pedidos/errors/erros-pedidos'
import { criarPedidoItemRepository, type PedidoItemRepository } from '../../pedidos/repositories/pedido-item.repository'
import { criarPedidoRepository, type PedidoRepository } from '../../pedidos/repositories/pedido.repository'
import { criarMesaRepository, type MesaRepository } from '../../mesas/repositories/mesa.repository'
import { criarSessaoCaixaRepository, type SessaoCaixaRepository } from '../../caixa/repositories/sessao-caixa.repository'
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

    const totalInformado = entrada.pagamentos.reduce((total, pagamento) => total + pagamento.valorCentavos, 0)
    if (totalInformado !== pedido.totalCentavos) {
      throw new ErroPedidos(
        CODIGOS_ERRO_PEDIDOS.ENTRADA_INVALIDA,
        totalInformado < pedido.totalCentavos
          ? 'A soma dos pagamentos e menor que o total do pedido.'
          : 'A soma dos pagamentos e maior que o total do pedido.',
      )
    }

    const pagamentos = repositorioPagamento.inserirEmLote(pedido.id, sessao.id, entrada.pagamentos)
    repositorioPedido.finalizar(pedido.id)

    if (pedido.tipo === TIPO_PEDIDO.MESA && pedido.mesaId) {
      repositorioMesa.atualizarStatus(pedido.mesaId, STATUS_MESA.LIVRE)
    }

    return {
      pedidoId: pedido.id,
      totalPedidoCentavos: pedido.totalCentavos,
      totalPagoCentavos: totalInformado,
      valorRestanteCentavos: 0,
      pagamentos,
    }
  }
}

export const registrarPagamentoPedido = criarRegistrarPagamentoPedido()
