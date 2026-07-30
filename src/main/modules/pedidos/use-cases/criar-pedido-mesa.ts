import type { Pedido } from '@shared/types/pedido'
import { TIPO_PEDIDO } from '@shared/types/pedido'
import { STATUS_MESA } from '@shared/types/mesa'
import type { CriarPedidoMesaEntrada } from '@shared/types/pedido'
import type { SessaoCaixaRepository } from '../../caixa/repositories/sessao-caixa.repository'
import { criarSessaoCaixaRepository } from '../../caixa/repositories/sessao-caixa.repository'
import type { MesaRepository } from '../../mesas/repositories/mesa.repository'
import { criarMesaRepository } from '../../mesas/repositories/mesa.repository'
import { CODIGOS_ERRO_PEDIDOS, ErroPedidos } from '../errors/erros-pedidos'
import type { PedidoRepository } from '../repositories/pedido.repository'
import { criarPedidoRepository } from '../repositories/pedido.repository'

export function criarCriarPedidoMesa(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioMesa: MesaRepository = criarMesaRepository(),
  repositorioSessao: SessaoCaixaRepository = criarSessaoCaixaRepository(),
) {
  return function criarPedidoMesa(entrada: CriarPedidoMesaEntrada): Pedido {
    const sessaoAberta = repositorioSessao.buscarSessaoAberta()

    if (!sessaoAberta) {
      throw new ErroPedidos(
        CODIGOS_ERRO_PEDIDOS.CAIXA_NAO_ABERTO,
        'Nao existe sessao de caixa aberta.',
      )
    }

    const mesa = repositorioMesa.buscarPorId(entrada.mesaId)

    if (!mesa) {
      throw new ErroPedidos(
        CODIGOS_ERRO_PEDIDOS.MESA_NAO_ENCONTRADA,
        'Mesa nao encontrada.',
      )
    }

    if (!mesa.ativo || mesa.status === STATUS_MESA.INATIVA) {
      throw new ErroPedidos(
        CODIGOS_ERRO_PEDIDOS.MESA_INATIVA,
        'Nao e permitido abrir pedido em mesa inativa.',
      )
    }

    const pedidoAberto = repositorioPedido.buscarPedidoAbertoPorMesa(entrada.mesaId)

    if (pedidoAberto) {
      throw new ErroPedidos(
        CODIGOS_ERRO_PEDIDOS.MESA_OCUPADA,
        'Mesa ja possui pedido aberto.',
      )
    }

    const pedido = repositorioPedido.inserir({
      sessaoCaixaId: sessaoAberta.id,
      mesaId: entrada.mesaId,
      tipo: TIPO_PEDIDO.MESA,
    })

    repositorioMesa.atualizarStatus(entrada.mesaId, STATUS_MESA.OCUPADA)

    return pedido
  }
}

export const criarPedidoMesa = criarCriarPedidoMesa()
