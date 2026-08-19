import {
  SETOR_COMANDA,
  type DocumentoComandaImpressao,
  type DocumentoContaImpressao,
  type ItemDocumentoImpressao,
} from '@shared/types/impressao'
import type { Mesa } from '@shared/types/mesa'
import {
  ROTULOS_FORMA_PAGAMENTO,
  STATUS_PAGAMENTO_PEDIDO,
  type PagamentoPedido,
} from '@shared/types/pagamento-pedido'
import { itemPedidoEstaAtivo, type ResumoPedido } from '@shared/types/pedido'
import { TIPO_PEDIDO_ITEM } from '@shared/types/pizza'

import { valorEntraNaContaImpressao } from './formatar-cupom'

export function itemEntraNaContaImpressao(item: ItemDocumentoImpressao): boolean {
  return valorEntraNaContaImpressao(item.totalCentavos)
}

export function mapearItensPedidoParaImpressao(
  resumo: ResumoPedido,
): ItemDocumentoImpressao[] {
  return resumo.itens.map((item) => {
    const pizza = item.pizza
    const ehPizza = item.tipo === TIPO_PEDIDO_ITEM.PIZZA && pizza

    return {
      quantidade: item.quantidade,
      nome: ehPizza
        ? `Pizza ${pizza.tamanhoNomeSnapshot}`
        : item.produtoNome,
      detalhes: ehPizza ? pizza.sabores.map((sabor) => sabor.saborNomeSnapshot) : [],
      observacao: item.observacao ?? pizza?.observacao ?? null,
      precoUnitarioCentavos: item.precoUnitarioCentavos,
      totalCentavos: item.totalCentavos,
      setor: ehPizza ? SETOR_COMANDA.PIZZA : SETOR_COMANDA.COZINHA,
      cancelado: !itemPedidoEstaAtivo(item),
    }
  })
}

export function mapearPedidoParaConta(
  resumo: ResumoPedido,
  mesa: Mesa | null,
  pagamentos: PagamentoPedido[],
): DocumentoContaImpressao {
  const pedido = resumo.pedido

  return {
    estabelecimento: 'JARDINS',
    tipoPedido: pedido.tipo,
    mesaNumero: mesa?.numero ?? null,
    referencia: pedido.referencia,
    emitidoEm: pedido.atualizadoEm,
    itens: mapearItensPedidoParaImpressao(resumo).filter(itemEntraNaContaImpressao),
    subtotalCentavos: pedido.subtotalCentavos,
    descontoItensCentavos: pedido.descontoItensCentavos,
    descontoPedidoCentavos: pedido.descontoPedidoCentavos,
    taxaEntregaCentavos: pedido.taxaEntregaCentavos,
    totalCentavos: pedido.totalCentavos,
    valorPagoCentavos: pedido.valorPagoCentavos,
    valorCortesiaCentavos: pedido.valorCortesiaCentavos,
    valorRestanteCentavos: pedido.valorRestanteCentavos,
    pagamentos: pagamentos
      .filter((pagamento) => pagamento.status === STATUS_PAGAMENTO_PEDIDO.CONFIRMADO)
      .map((pagamento) => ({
        formaRotulo: ROTULOS_FORMA_PAGAMENTO[pagamento.formaPagamento],
        valorCentavos: pagamento.valorCentavos,
      })),
  }
}

export function mapearPedidoParaComanda(
  resumo: ResumoPedido,
  mesa: Mesa | null,
): DocumentoComandaImpressao {
  const pedido = resumo.pedido
  const itens = mapearItensPedidoParaImpressao(resumo)
  const itensAtivos = itens.filter((item) => !item.cancelado)
  const soPizza =
    itensAtivos.length > 0 &&
    itensAtivos.every((item) => item.setor === SETOR_COMANDA.PIZZA)

  return {
    setor: soPizza ? SETOR_COMANDA.PIZZA : SETOR_COMANDA.COZINHA,
    tipoPedido: pedido.tipo,
    mesaNumero: mesa?.numero ?? null,
    referencia: pedido.referencia,
    emitidoEm: pedido.atualizadoEm,
    itens,
    via: '1a via',
  }
}
