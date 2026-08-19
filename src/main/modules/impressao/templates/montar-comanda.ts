import type { DocumentoComandaImpressao } from '@shared/types/impressao'
import {
  centralizarLinha,
  formatarDataHoraCupom,
  linhaSeparadora,
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

  for (const item of itensAtivos) {
    linhas.push(`${item.quantidade}  ${item.nome.toUpperCase()}`)

    for (const detalhe of item.detalhes) {
      linhas.push(`   ${detalhe}`)
    }

    if (item.observacao) {
      linhas.push(`** ${item.observacao} **`)
    }
  }

  linhas.push(
    linhaSeparadora(),
    centralizarLinha('COMANDA'),
    centralizarLinha(documento.via),
  )

  return linhas
}
