import type { DocumentoComandaImpressao } from '@shared/types/impressao'
import {
  centralizarLinha,
  formatarDataHoraCupom,
  linhaSeparadora,
  linhasItemComanda,
  rotuloOrigemPedido,
} from './formatar-cupom'

export function montarComanda(documento: DocumentoComandaImpressao): string[] {
  const { hora } = formatarDataHoraCupom(documento.emitidoEm)
  const origem = rotuloOrigemPedido(documento.tipoPedido, documento.mesaNumero)
  const linhas: string[] = [
    centralizarLinha(documento.setor),
    `${origem.padEnd(22)}#${documento.referencia}`,
    hora,
    linhaSeparadora(),
  ]

  const itensAtivos = documento.itens.filter((item) => !item.cancelado)

  for (const [indice, item] of itensAtivos.entries()) {
    if (indice > 0) {
      linhas.push('')
    }

    linhas.push(...linhasItemComanda(item))
  }

  linhas.push(
    linhaSeparadora(),
    centralizarLinha('COMANDA'),
    centralizarLinha(documento.via),
  )

  return linhas
}
