import type { CriarPedidoDeliveryEntrada, ResumoPedido } from '@shared/types/pedido'
import { TIPO_PEDIDO, STATUS_PEDIDO } from '@shared/types/pedido'
import { ErroDelivery, CODIGOS_ERRO_DELIVERY } from '../errors/erros-delivery'
import {
  criarPedidoRepository,
  type PedidoRepository,
} from '../../pedidos/repositories/pedido.repository'
import {
  criarSessaoCaixaRepository,
  type SessaoCaixaRepository,
} from '../../caixa/repositories/sessao-caixa.repository'
import {
  criarPedidoEntregaRepository,
  type PedidoEntregaRepository,
} from '../repositories/pedido-entrega.repository'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import { randomUUID } from 'node:crypto'
import {
  confirmarTransacao,
  iniciarTransacao,
  persistirConexaoBanco,
  reverterTransacao,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import { obterTaxaEntregaPadraoCentavos } from './taxa-entrega-padrao'

export function criarCriarPedidoDelivery(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioSessao: SessaoCaixaRepository = criarSessaoCaixaRepository(),
  repositorioEntrega: PedidoEntregaRepository = criarPedidoEntregaRepository(),
  obterConexao = obterConexaoBancoLocal,
  obterTaxaPadrao = obterTaxaEntregaPadraoCentavos,
) {
  return function criarPedidoDelivery(
    entrada: CriarPedidoDeliveryEntrada,
  ): ResumoPedido {
    const sessao = repositorioSessao.buscarSessaoAberta()
    if (!sessao) {
      throw new ErroDelivery(
        CODIGOS_ERRO_DELIVERY.CAIXA_NAO_ABERTO,
        'Nao existe sessao de caixa aberta.',
      )
    }

    if (entrada.clienteNome.trim().length < 2) {
      throw new ErroDelivery(
        CODIGOS_ERRO_DELIVERY.ENTRADA_INVALIDA,
        'Nome do cliente deve ter no minimo 2 caracteres.',
      )
    }

    const taxaEntregaCentavos =
      entrada.taxaEntregaCentavos !== undefined
        ? entrada.taxaEntregaCentavos
        : obterTaxaPadrao()

    if (taxaEntregaCentavos < 0) {
      throw new ErroDelivery(
        CODIGOS_ERRO_DELIVERY.TAXA_ENTREGA_INVALIDA,
        'Taxa de entrega deve ser maior ou igual a zero.',
      )
    }

    const conexao = obterConexao()
    const agora = agoraEmIsoUtc()
    const pedidoId = randomUUID()

    iniciarTransacao(conexao)
    try {
      conexao.instancia.run(
        `INSERT INTO pedido (
           id, sessao_caixa_id, mesa_id, tipo, status,
           subtotal_centavos, desconto_centavos, total_centavos,
           desconto_itens_centavos, desconto_pedido_centavos,
           taxa_entrega_centavos,
           valor_pago_centavos, valor_cortesia_centavos, valor_restante_centavos,
           criado_em, atualizado_em, finalizado_em, cancelado_em
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pedidoId,
          sessao.id,
          null,
          TIPO_PEDIDO.DELIVERY,
          STATUS_PEDIDO.ABERTO,
          0,
          0,
          taxaEntregaCentavos,
          0,
          0,
          taxaEntregaCentavos,
          0,
          0,
          taxaEntregaCentavos,
          agora,
          agora,
          null,
          null,
        ],
      )

      const entregaId = randomUUID()
      conexao.instancia.run(
        `INSERT INTO pedido_entrega (
           id, pedido_id, cliente_nome, telefone, observacao, status,
           saiu_para_entrega_em, entregue_em, cancelado_em, motivo_cancelamento,
           criado_em, atualizado_em
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          entregaId,
          pedidoId,
          entrada.clienteNome.trim(),
          entrada.telefone?.trim() ? entrada.telefone.trim() : null,
          entrada.observacao?.trim() ? entrada.observacao.trim() : null,
          'AGUARDANDO_PREPARO',
          null,
          null,
          null,
          null,
          agora,
          agora,
        ],
      )

      confirmarTransacao(conexao)
    } catch (erro) {
      reverterTransacao(conexao)
      throw erro
    }

    persistirConexaoBanco(conexao)

    const pedido = repositorioPedido.buscarPorId(pedidoId)!
    const entrega = repositorioEntrega.buscarPorPedidoId(pedidoId)!

    return { pedido, itens: [], entrega, divisao: null }
  }
}

export const criarPedidoDelivery = criarCriarPedidoDelivery()
