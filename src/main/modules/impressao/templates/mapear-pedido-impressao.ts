import type { SetorImpressao } from '@shared/types/config-impressora'
import {
  SETOR_COMANDA,
  type DocumentoComandaImpressao,
  type DocumentoContaImpressao,
  type ItemDocumentoImpressao,
  type SetorComanda,
} from '@shared/types/impressao'
import type { Mesa } from '@shared/types/mesa'
import {
  ROTULOS_FORMA_PAGAMENTO,
  STATUS_PAGAMENTO_PEDIDO,
  type PagamentoPedido,
} from '@shared/types/pagamento-pedido'
import { itemPedidoEstaAtivo, type PedidoItem, type ResumoPedido } from '@shared/types/pedido'
import { TIPO_PEDIDO_ITEM } from '@shared/types/pizza'
import { expandirLinhasSaborPizza } from '@shared/utils/linhas-sabor-pizza'

import { valorEntraNaContaImpressao } from './formatar-cupom'

export type ConsultarNomeCategoriaProduto = (produtoId: string) => string | null
export type ConsultarSetorCategoriaProduto = (produtoId: string) => SetorImpressao | null

function setorImpressaoParaComanda(setor: SetorImpressao): SetorComanda {
  if (setor === 'BALCAO') {
    return SETOR_COMANDA.COZINHA
  }

  return setor
}

export function categoriaEhBebida(nome: string | null | undefined): boolean {
  if (!nome?.trim()) {
    return false
  }

  const normalizado = nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

  return normalizado.startsWith('bebida')
}

export function itemPedidoNaoEntraNaComanda(
  item: PedidoItem,
  consultarNomeCategoria: ConsultarNomeCategoriaProduto,
  consultarSetorCategoria?: ConsultarSetorCategoriaProduto,
): boolean {
  if (item.tipo === TIPO_PEDIDO_ITEM.PIZZA || !item.produtoId) {
    return false
  }

  const setor = consultarSetorCategoria?.(item.produtoId)
  if (setor === 'BALCAO') {
    return true
  }

  return categoriaEhBebida(consultarNomeCategoria(item.produtoId))
}

export function itemEntraNaContaImpressao(item: ItemDocumentoImpressao): boolean {
  return valorEntraNaContaImpressao(item.totalCentavos)
}

function setorDoItem(
  item: PedidoItem,
  consultarSetorCategoria?: ConsultarSetorCategoriaProduto,
): SetorComanda {
  const ehPizza = item.tipo === TIPO_PEDIDO_ITEM.PIZZA && item.pizza
  const setorCategoria =
    !ehPizza && item.produtoId && consultarSetorCategoria
      ? consultarSetorCategoria(item.produtoId)
      : null

  if (setorCategoria) {
    return setorImpressaoParaComanda(setorCategoria)
  }

  return ehPizza ? SETOR_COMANDA.PIZZA : SETOR_COMANDA.COZINHA
}

export function mapearItensPedidoParaImpressao(
  resumo: ResumoPedido,
  consultarSetorCategoria?: ConsultarSetorCategoriaProduto,
  opcoes: { expandirSaboresPizza?: boolean } = {},
): ItemDocumentoImpressao[] {
  return resumo.itens.flatMap((item) => {
    const pizza = item.pizza
    const ehPizza = item.tipo === TIPO_PEDIDO_ITEM.PIZZA && pizza
    const setor = setorDoItem(item, consultarSetorCategoria)
    const cancelado = !itemPedidoEstaAtivo(item)
    const linhasPizza =
      opcoes.expandirSaboresPizza && ehPizza ? expandirLinhasSaborPizza(item) : null

    if (linhasPizza && linhasPizza.length > 0) {
      return linhasPizza.map((linha, indice) => ({
        quantidade: item.quantidade,
        nome: linha.nome,
        detalhes: [],
        observacao: indice === 0 ? (item.observacao ?? pizza?.observacao ?? null) : null,
        precoUnitarioCentavos: linha.valorCentavos,
        totalCentavos: linha.valorCentavos,
        setor,
        cancelado,
      }))
    }

    return [
      {
        quantidade: item.quantidade,
        nome: ehPizza ? `Pizza ${pizza.tamanhoNomeSnapshot}` : item.produtoNome,
        detalhes: ehPizza ? pizza.sabores.map((sabor) => sabor.saborNomeSnapshot) : [],
        observacao: item.observacao ?? pizza?.observacao ?? null,
        precoUnitarioCentavos: item.precoUnitarioCentavos,
        totalCentavos: item.totalCentavos,
        setor,
        cancelado,
      },
    ]
  })
}

export function mapearPedidoParaConta(
  resumo: ResumoPedido,
  mesa: Mesa | null,
  pagamentos: PagamentoPedido[],
  consultarSetorCategoria?: ConsultarSetorCategoriaProduto,
): DocumentoContaImpressao {
  const pedido = resumo.pedido

  return {
    estabelecimento: 'JARDINS',
    tipoPedido: pedido.tipo,
    mesaNumero: mesa?.numero ?? null,
    referencia: pedido.referencia,
    emitidoEm: pedido.atualizadoEm,
    itens: mapearItensPedidoParaImpressao(resumo, consultarSetorCategoria, {
      expandirSaboresPizza: true,
    }).filter(itemEntraNaContaImpressao),
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
        valorRecebidoCentavos: pagamento.valorRecebidoCentavos,
        trocoCentavos: pagamento.trocoCentavos,
      })),
  }
}

export function mapearPedidoParaComanda(
  resumo: ResumoPedido,
  mesa: Mesa | null,
  consultarSetorCategoria?: ConsultarSetorCategoriaProduto,
  setorFiltro?: SetorComanda,
): DocumentoComandaImpressao {
  const pedido = resumo.pedido
  const itens = mapearItensPedidoParaImpressao(resumo, consultarSetorCategoria).filter(
    (item) => !setorFiltro || item.setor === setorFiltro,
  )
  const itensAtivos = itens.filter((item) => !item.cancelado)
  const soPizza =
    itensAtivos.length > 0 &&
    itensAtivos.every((item) => item.setor === SETOR_COMANDA.PIZZA)
  const setorDocumento =
    setorFiltro ?? (soPizza ? SETOR_COMANDA.PIZZA : SETOR_COMANDA.COZINHA)

  return {
    setor: setorDocumento,
    tipoPedido: pedido.tipo,
    mesaNumero: mesa?.numero ?? null,
    referencia: pedido.referencia,
    emitidoEm: pedido.atualizadoEm,
    itens,
    via: '1a via',
  }
}
