import type { DocumentoContaImpressao } from '@shared/types/impressao'
import {
  alinharDireita,
  centralizarLinha,
  formatarDataHoraCupom,
  formatarMoedaCupom,
  linhaRotuloValorOpcional,
  linhaSeparadora,
  rotuloOrigemPedido,
} from './formatar-cupom'
import { itemEntraNaContaImpressao } from './mapear-pedido-impressao'

export function montarConta(documento: DocumentoContaImpressao): string[] {
  const { data, hora } = formatarDataHoraCupom(documento.emitidoEm)
  const origem = rotuloOrigemPedido(documento.tipoPedido, documento.mesaNumero)
  const linhas: string[] = [
    centralizarLinha(documento.estabelecimento),
    centralizarLinha('**********************'),
    centralizarLinha('CONTA'),
    `${origem.padEnd(22)}#${documento.referencia}`,
    `${data}  ${hora}`,
    linhaSeparadora(),
  ]

  for (const item of documento.itens) {
    if (item.cancelado || !itemEntraNaContaImpressao(item)) {
      continue
    }

    linhas.push(`${item.quantidade}  ${item.nome}`)

    if (item.detalhes.length > 0) {
      linhas.push(`   ${item.detalhes.join(' / ')}`)
    }

    if (item.observacao) {
      linhas.push(`   ${item.observacao}`)
    }

    linhas.push(alinharDireita(formatarMoedaCupom(item.totalCentavos)))
  }

  linhas.push(linhaSeparadora())

  for (const linha of [
    linhaRotuloValorOpcional('Subtotal', documento.subtotalCentavos),
    linhaRotuloValorOpcional('Desc. itens', documento.descontoItensCentavos),
    linhaRotuloValorOpcional('Desc. pedido', documento.descontoPedidoCentavos),
    linhaRotuloValorOpcional('Taxa entrega', documento.taxaEntregaCentavos),
    linhaRotuloValorOpcional('TOTAL', documento.totalCentavos),
    linhaRotuloValorOpcional('Pago', documento.valorPagoCentavos),
    linhaRotuloValorOpcional('Cortesia', documento.valorCortesiaCentavos),
    linhaRotuloValorOpcional('Restante', documento.valorRestanteCentavos),
  ]) {
    if (linha) {
      linhas.push(linha)
    }
  }

  linhas.push(linhaSeparadora())

  for (const pagamento of documento.pagamentos) {
    const linha = linhaRotuloValorOpcional(pagamento.formaRotulo, pagamento.valorCentavos)
    if (linha) {
      linhas.push(linha)
    }
  }

  if (documento.pagamentos.length > 0) {
    linhas.push(linhaSeparadora())
  }

  linhas.push(centralizarLinha('Nao e documento fiscal'))

  return linhas
}
