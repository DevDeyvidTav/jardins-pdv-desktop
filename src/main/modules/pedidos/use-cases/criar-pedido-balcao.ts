import type { Pedido } from '@shared/types/pedido'
import { TIPO_PEDIDO } from '@shared/types/pedido'
import type { SessaoCaixaRepository } from '../../caixa/repositories/sessao-caixa.repository'
import { criarSessaoCaixaRepository } from '../../caixa/repositories/sessao-caixa.repository'
import { CODIGOS_ERRO_PEDIDOS, ErroPedidos } from '../errors/erros-pedidos'
import type { PedidoRepository } from '../repositories/pedido.repository'
import { criarPedidoRepository } from '../repositories/pedido.repository'
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { registrarEventoPedidoSync } from '../../sincronizacao/services/registrar-evento-pedido'
import { executarEmTransacaoImediata } from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'

export function criarCriarPedidoBalcao(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioSessao: SessaoCaixaRepository = criarSessaoCaixaRepository(),
  obterConexao = obterConexaoBancoLocal,
) {
  return function criarPedidoBalcao(): Pedido {
    const conexao = obterConexao()
    return executarEmTransacaoImediata(conexao, () => {
      const sessaoAberta = repositorioSessao.buscarSessaoAberta()

      if (!sessaoAberta) {
        throw new ErroPedidos(
          CODIGOS_ERRO_PEDIDOS.CAIXA_NAO_ABERTO,
          'Nao existe sessao de caixa aberta.',
        )
      }

      const pedidoAbertoExistente = repositorioPedido.buscarPedidoAbertoBalcao()
      if (pedidoAbertoExistente) {
        return pedidoAbertoExistente
      }

      const pedidoCriado = repositorioPedido.inserir({
        sessaoCaixaId: sessaoAberta.id,
        mesaId: null,
        tipo: TIPO_PEDIDO.BALCAO,
      })

      registrarEventoPedidoSync(pedidoCriado.id, OPERACAO_SYNC.CREATE, conexao)
      return pedidoCriado
    })
  }
}

export const criarPedidoBalcao = criarCriarPedidoBalcao()
