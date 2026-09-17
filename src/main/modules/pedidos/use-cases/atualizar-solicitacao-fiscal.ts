import type { AtualizarSolicitacaoFiscalEntrada } from '@shared/types/documento-fiscal'
import type { Pedido } from '@shared/types/pedido'
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { executarEmTransacaoImediata } from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import { registrarEventoPedidoSync } from '../../sincronizacao/services/registrar-evento-pedido'
import { CODIGOS_ERRO_PEDIDOS, ErroPedidos } from '../errors/erros-pedidos'
import { criarPedidoItemRepository, type PedidoItemRepository } from '../repositories/pedido-item.repository'
import { criarPedidoRepository, type PedidoRepository } from '../repositories/pedido.repository'
import { avaliarEmissaoNfce } from '../services/avaliar-emissao-nfce'
import { garantirPedidoAberto } from './consultas-pedido'

export function criarAtualizarSolicitacaoFiscal(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioItem: PedidoItemRepository = criarPedidoItemRepository(),
  obterConexao = obterConexaoBancoLocal,
) {
  return function atualizarSolicitacaoFiscal(
    entrada: AtualizarSolicitacaoFiscalEntrada,
  ): Pedido {
    const conexao = obterConexao()
    return executarEmTransacaoImediata(conexao, () => {
      const pedido = repositorioPedido.buscarPorId(entrada.pedidoId)
      if (!pedido) {
        throw new ErroPedidos(
          CODIGOS_ERRO_PEDIDOS.PEDIDO_NAO_ENCONTRADO,
          'Pedido nao encontrado.',
        )
      }

      garantirPedidoAberto(pedido)

      const itens = repositorioItem.listarPorPedido(pedido.id, false)
      const avaliacao = avaliarEmissaoNfce({
        pedido,
        itens,
        fiscalSolicitado: entrada.fiscalSolicitado,
        fiscalCpfDestinatario: entrada.fiscalCpfDestinatario,
      })

      if (!avaliacao.ok) {
        throw new ErroPedidos(CODIGOS_ERRO_PEDIDOS.ENTRADA_INVALIDA, avaliacao.motivo)
      }

      const atualizado = repositorioPedido.atualizarSolicitacaoFiscal({
        pedidoId: pedido.id,
        fiscalSolicitado: entrada.fiscalSolicitado,
        fiscalCpfDestinatario: avaliacao.cpf,
      })

      registrarEventoPedidoSync(pedido.id, OPERACAO_SYNC.UPDATE, conexao)
      return atualizado
    })
  }
}

export const atualizarSolicitacaoFiscal = criarAtualizarSolicitacaoFiscal()
