import type {
  AplicarDescontoPedidoEntrada,
  ResumoPedido,
} from '@shared/types/pedido'
import { TIPO_PEDIDO } from '@shared/types/pedido'
import { STATUS_MESA } from '@shared/types/mesa'
import { STATUS_SESSAO_CAIXA } from '@shared/types/sessao-caixa'
import { CODIGOS_ERRO_PEDIDOS, ErroPedidos } from '../errors/erros-pedidos'
import type { PedidoRepository } from '../repositories/pedido.repository'
import { criarPedidoRepository } from '../repositories/pedido.repository'
import type { PedidoItemRepository } from '../repositories/pedido-item.repository'
import { criarPedidoItemRepository } from '../repositories/pedido-item.repository'
import type { MesaRepository } from '../../mesas/repositories/mesa.repository'
import { criarMesaRepository } from '../../mesas/repositories/mesa.repository'
import type { SessaoCaixaRepository } from '../../caixa/repositories/sessao-caixa.repository'
import { criarSessaoCaixaRepository } from '../../caixa/repositories/sessao-caixa.repository'
import { calcularTotaisPedido } from '../types/pedido-calculos.types'
import { garantirPedidoAberto, obterResumoPedido } from './consultas-pedido'

export function criarAplicarDescontoPedido(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioItem: PedidoItemRepository = criarPedidoItemRepository(),
  repositorioSessao: SessaoCaixaRepository = criarSessaoCaixaRepository(),
  repositorioMesa: MesaRepository = criarMesaRepository(),
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

    let totaisCalculados: ReturnType<typeof calcularTotaisPedido>
    try {
      totaisCalculados = calcularTotaisPedido(
        subtotalCentavos,
        descontoItensCentavos,
        entrada.descontoCentavos,
        pedido.valorPagoCentavos,
        pedido.valorCortesiaCentavos,
      )
    } catch (erro) {
      throw new ErroPedidos(
        CODIGOS_ERRO_PEDIDOS.ENTRADA_INVALIDA,
        erro instanceof Error ? erro.message : 'Erro ao calcular descontos do pedido.',
      )
    }

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
        repositorioMesa.atualizarStatus(pedido.mesaId, STATUS_MESA.LIVRE)
      }
    }

    return obterResumoPedido({ pedidoId: pedido.id })
  }
}

export const aplicarDescontoPedido = criarAplicarDescontoPedido()
