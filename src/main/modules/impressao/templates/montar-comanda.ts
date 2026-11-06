import type { DocumentoComandaImpressao } from '@shared/types/impressao'
import {
  centralizarLinha,
  formatarDataHoraCupom,
  linhaSeparadora,
  linhasItemComanda,
  rotuloOrigemPedido,
} from './formatar-cupom'

/** Largura efetiva com fonte larga (dupla largura ESC/POS ≈ 24 colunas). */
const LARGURA_ORIGEM_COMANDA = 24

export function montarComanda(documento: DocumentoComandaImpressao): string[] {
  const { hora } = formatarDataHoraCupom(documento.emitidoEm)
  const origem = rotuloOrigemPedido(documento.tipoPedido, documento.mesaNumero)
  const linhas: string[] = [
    centralizarLinha(origem, LARGURA_ORIGEM_COMANDA),
    centralizarLinha(`#${documento.referencia}`, LARGURA_ORIGEM_COMANDA),
    centralizarLinha(documento.setor),
    centralizarLinha(hora),
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
