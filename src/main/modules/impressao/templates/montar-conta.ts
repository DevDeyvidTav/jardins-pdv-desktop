import type { DocumentoContaImpressao } from '@shared/types/impressao'
import {
  centralizarLinha,
  formatarDataHoraCupom,
  linhaRotuloValorOpcional,
  linhaSeparadora,
  linhasItemConta,
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

    linhas.push(...linhasItemConta(item))
  }

  linhas.push(linhaSeparadora())

  const ocultarRestante = documento.valorRestanteCentavos === documento.totalCentavos

  for (const linha of [
    linhaRotuloValorOpcional('Subtotal', documento.subtotalCentavos),
    linhaRotuloValorOpcional('Desc. itens', documento.descontoItensCentavos),
    linhaRotuloValorOpcional('Desc. pedido', documento.descontoPedidoCentavos),
    linhaRotuloValorOpcional('Taxa entrega', documento.taxaEntregaCentavos),
    linhaRotuloValorOpcional('TOTAL', documento.totalCentavos),
    linhaRotuloValorOpcional('Pago', documento.valorPagoCentavos),
    linhaRotuloValorOpcional('Cortesia', documento.valorCortesiaCentavos),
    ocultarRestante
      ? null
      : linhaRotuloValorOpcional('Restante', documento.valorRestanteCentavos),
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

    const recebido = pagamento.valorRecebidoCentavos ?? 0
    const troco = pagamento.trocoCentavos ?? 0
    if (troco > 0 || recebido > pagamento.valorCentavos) {
      const linhaRecebido = linhaRotuloValorOpcional('Recebido', recebido)
      const linhaTroco = linhaRotuloValorOpcional('Troco', troco)
      if (linhaRecebido) {
        linhas.push(linhaRecebido)
      }
      if (linhaTroco) {
        linhas.push(linhaTroco)
      }
    }
  }

  if (documento.pagamentos.length > 0) {
    linhas.push(linhaSeparadora())
  }

  linhas.push(centralizarLinha('Nao e documento fiscal'))

  return linhas
}
