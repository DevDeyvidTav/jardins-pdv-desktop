import type { Pedido, PedidoItem } from '@shared/types/pedido'
import { itemPedidoEstaAtivo } from '@shared/types/pedido'
import { resolverDocumentoNota } from '@shared/utils/cpf'
import { itemProdutoPodeEmitirNfce } from '@shared/utils/snapshot-fiscal-item'

export type ResultadoAvaliacaoNfce =
  | { ok: true; documento: string | null }
  | { ok: false; motivo: string }

export function avaliarEmissaoNfce(entrada: {
  pedido: Pick<Pedido, 'totalCentavos' | 'valorCortesiaCentavos' | 'valorPagoCentavos'>
  itens: PedidoItem[]
  fiscalSolicitado: boolean
  fiscalCpfDestinatario?: string | null
  valorPagoAposPagamento?: number
  valorCortesiaAposPagamento?: number
  exigirValorPago?: boolean
}): ResultadoAvaliacaoNfce {
  if (!entrada.fiscalSolicitado) {
    return { ok: true, documento: null }
  }

  const documento = resolverDocumentoNota(entrada.fiscalCpfDestinatario)
  if (!documento.ok) {
    return documento
  }

  const valorPago =
    entrada.valorPagoAposPagamento ?? entrada.pedido.valorPagoCentavos
  const valorCortesia =
    entrada.valorCortesiaAposPagamento ?? entrada.pedido.valorCortesiaCentavos
  const valorFiscal = Math.max(entrada.pedido.totalCentavos - valorCortesia, 0)

  if (valorFiscal <= 0 || (entrada.exigirValorPago && valorPago <= 0)) {
    return {
      ok: false,
      motivo: 'Nao e possivel emitir NFC-e para pedido quitado so com cortesia.',
    }
  }

  const itensAtivos = entrada.itens.filter(itemPedidoEstaAtivo)
  const semNcm = itensAtivos.find((item) => !itemProdutoPodeEmitirNfce(item))
  if (semNcm) {
    return {
      ok: false,
      motivo: `Produto ${semNcm.produtoNome} nao possui NCM cadastrado.`,
    }
  }

  return { ok: true, documento: documento.documento }
}
