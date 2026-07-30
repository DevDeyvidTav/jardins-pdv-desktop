import type { Pedido } from '@shared/types/pedido'
import { TIPO_PEDIDO } from '@shared/types/pedido'
import type { SessaoCaixaRepository } from '../../caixa/repositories/sessao-caixa.repository'
import { criarSessaoCaixaRepository } from '../../caixa/repositories/sessao-caixa.repository'
import { CODIGOS_ERRO_PEDIDOS, ErroPedidos } from '../errors/erros-pedidos'
import type { PedidoRepository } from '../repositories/pedido.repository'
import { criarPedidoRepository } from '../repositories/pedido.repository'

export function criarCriarPedidoBalcao(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioSessao: SessaoCaixaRepository = criarSessaoCaixaRepository(),
) {
  return function criarPedidoBalcao(): Pedido {
    const sessaoAberta = repositorioSessao.buscarSessaoAberta()

    if (!sessaoAberta) {
      throw new ErroPedidos(
        CODIGOS_ERRO_PEDIDOS.CAIXA_NAO_ABERTO,
        'Nao existe sessao de caixa aberta.',
      )
    }

    return repositorioPedido.inserir({
      sessaoCaixaId: sessaoAberta.id,
      mesaId: null,
      tipo: TIPO_PEDIDO.BALCAO,
    })
  }
}

export const criarPedidoBalcao = criarCriarPedidoBalcao()
