import { formatarCpf } from '@shared/utils/cpf'
import { itemPedidoEstaAtivo, type PedidoItem } from '@shared/types/pedido'
import { TIPO_PEDIDO_ITEM } from '@shared/types/pizza'
import {
  ROTULOS_FORMA_PAGAMENTO,
  STATUS_PAGAMENTO_PEDIDO,
  type PagamentoPedido,
} from '@shared/types/pagamento-pedido'
import {
  centralizarLinha,
  linhaEsquerdaDireita,
  linhaSeparadora,
  quebrarTexto,
} from './formatar-cupom'

export interface EmitenteDanfeNfce {
  nome: string
  cnpj: string
  ie?: string
  endereco?: string
  municipio?: string
  uf?: string
  urlConsulta?: string
  ambiente?: string
}

export interface ItemDanfeNfce {
  codigo: string
  descricao: string
  quantidade: number
  unidade: string
  unitarioCentavos: number
  totalCentavos: number
}

export interface PagamentoDanfeNfce {
  forma: string
  valorCentavos: number
}

export function formatarCnpj(valor: string | null | undefined): string {
  const cnpj = (valor ?? '').replace(/\D/g, '')
  if (cnpj.length !== 14) {
    return valor?.trim() || ''
  }

  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`
}

export function formatarChaveAcesso(chave: string): string[] {
  const limpa = chave.replace(/\D/g, '')
  const blocos: string[] = []
  for (let indice = 0; indice < limpa.length; indice += 4) {
    blocos.push(limpa.slice(indice, indice + 4))
  }

  const linhas: string[] = []
  for (let indice = 0; indice < blocos.length; indice += 8) {
    linhas.push(blocos.slice(indice, indice + 8).join(' '))
  }
  return linhas
}

export function conteudoQrDanfe(documento: {
  chaveAcesso: string | null
  qrCode: string | null
}): string | null {
  const qr = documento.qrCode?.trim() ?? ''
  if (qr) {
    return qr
  }

  const chave = documento.chaveAcesso?.replace(/\D/g, '') ?? ''
  return chave || null
}

export function formatarValorDanfe(centavos: number): string {
  return (centavos / 100).toFixed(2).replace('.', ',')
}

export function formatarQuantidadeDanfe(quantidade: number): string {
  return quantidade.toFixed(4).replace('.', ',')
}

/** Texto exigido pela SEFAZ em ambiente de homologacao (tpAmb=2). */
export const TEXTO_HOMOLOGACAO_NFCE =
  'NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL'

export function formatarNumeroNfce(numero: number | null, serie: number | null): string | null {
  if (!numero || !serie) {
    return null
  }

  return `NFC-e n. ${String(numero).padStart(9, '0')} Serie ${String(serie).padStart(3, '0')}`
}

export function formatarDataAutorizacao(isoUtc: string | null | undefined): string | null {
  if (!isoUtc) {
    return null
  }

  const data = new Date(isoUtc)
  if (Number.isNaN(data.getTime())) {
    return null
  }

  const dataTexto = data.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  const horaTexto = data.toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  return `${dataTexto} ${horaTexto}`
}

const ROTULO_PAGAMENTO_DANFE: Record<string, string> = {
  DINHEIRO: 'DINHEIRO',
  CARTAO_CREDITO: 'CARTAO DE CREDITO',
  CARTAO_DEBITO: 'CARTAO DE DEBITO',
  PIX_MAQUINETA: 'PIX',
  PIX_CNPJ: 'PIX',
  TALAO: 'OUTROS',
}

export function mapearItensPedidoParaDanfe(itens: PedidoItem[]): ItemDanfeNfce[] {
  return itens.filter(itemPedidoEstaAtivo).map((item, indice) => {
    const pizza = item.tipo === TIPO_PEDIDO_ITEM.PIZZA ? item.pizza : null
    const descricao = pizza
      ? `PIZZA ${pizza.tamanhoNomeSnapshot} ${pizza.sabores.map((sabor) => sabor.saborNomeSnapshot).join('/')}`
      : item.produtoNome

    return {
      codigo: String(indice + 1).padStart(3, '0'),
      descricao: descricao.toUpperCase(),
      quantidade: item.quantidade,
      unidade: 'UN',
      unitarioCentavos: item.precoUnitarioCentavos,
      totalCentavos: item.totalCentavos,
    }
  })
}

export function mapearPagamentosParaDanfe(pagamentos: PagamentoPedido[]): PagamentoDanfeNfce[] {
  return pagamentos
    .filter((pagamento) => pagamento.status === STATUS_PAGAMENTO_PEDIDO.CONFIRMADO)
    .filter((pagamento) => ROTULO_PAGAMENTO_DANFE[pagamento.formaPagamento])
    .map((pagamento) => ({
      forma:
        ROTULO_PAGAMENTO_DANFE[pagamento.formaPagamento] ??
        ROTULOS_FORMA_PAGAMENTO[pagamento.formaPagamento],
      valorCentavos: pagamento.valorCentavos,
    }))
}

function linhaEnderecoEmitente(emitente: EmitenteDanfeNfce): string | null {
  const partes = [
    emitente.endereco?.trim(),
    [emitente.municipio?.trim(), emitente.uf?.trim()].filter(Boolean).join(' - '),
  ].filter(Boolean)

  return partes.length > 0 ? partes.join(', ') : null
}

function linhasItemDanfe(item: ItemDanfeNfce): string[] {
  const cabeca = quebrarTexto(`${item.codigo}  ${item.descricao}`, 48)
  const quantidade = `${formatarQuantidadeDanfe(item.quantidade)} ${item.unidade} x ${formatarValorDanfe(item.unitarioCentavos)}`
  return [...cabeca, linhaEsquerdaDireita(quantidade, formatarValorDanfe(item.totalCentavos))]
}

export function montarDanfeNfce(entrada: {
  emitente?: EmitenteDanfeNfce | null
  itens?: ItemDanfeNfce[]
  pagamentos?: PagamentoDanfeNfce[]
  cpfDestinatario?: string | null
  valorTotalCentavos: number
  numero: number | null
  serie: number | null
  chaveAcesso: string | null
  protocoloAutorizacao: string | null
  autorizadoEm?: string | null
}): string[] {
  const emitente = entrada.emitente
  const ambienteHomologacao = (emitente?.ambiente ?? '').toUpperCase() === 'HOMOLOGACAO'
  const itens = [...(entrada.itens ?? [])]

  const linhas: string[] = []

  if (emitente?.nome) {
    linhas.push(centralizarLinha(emitente.nome.toUpperCase()))
  }
  if (emitente?.cnpj) {
    const ie = emitente.ie ? `  IE: ${emitente.ie}` : ''
    linhas.push(centralizarLinha(`CNPJ: ${formatarCnpj(emitente.cnpj)}${ie}`))
  }
  const endereco = emitente ? linhaEnderecoEmitente(emitente) : null
  if (endereco) {
    for (const parte of quebrarTexto(endereco, 48)) {
      linhas.push(centralizarLinha(parte))
    }
  }

  linhas.push(linhaSeparadora())
  linhas.push(centralizarLinha('DOCUMENTO AUXILIAR DA NOTA FISCAL'))
  linhas.push(centralizarLinha('DE CONSUMIDOR ELETRONICA'))
  if (ambienteHomologacao) {
    linhas.push(linhaSeparadora())
    for (const parte of quebrarTexto(TEXTO_HOMOLOGACAO_NFCE, 48)) {
      linhas.push(centralizarLinha(parte))
    }
  }
  linhas.push(linhaSeparadora())
  linhas.push('COD  DESCRICAO')
  linhas.push('     QTD UN   VL.UNITARIO         VL.TOTAL')
  linhas.push(linhaSeparadora())

  for (const item of itens) {
    linhas.push(...linhasItemDanfe(item))
  }

  linhas.push(linhaSeparadora())
  linhas.push(linhaEsquerdaDireita('QTD. TOTAL DE ITENS', String(itens.length)))
  linhas.push(
    linhaEsquerdaDireita('VALOR TOTAL R$', formatarValorDanfe(entrada.valorTotalCentavos)),
  )

  if ((entrada.pagamentos ?? []).length > 0) {
    linhas.push(linhaEsquerdaDireita('FORMA DE PAGAMENTO', 'VALOR PAGO'))
    for (const pagamento of entrada.pagamentos ?? []) {
      linhas.push(
        linhaEsquerdaDireita(pagamento.forma, formatarValorDanfe(pagamento.valorCentavos)),
      )
    }
  }

  linhas.push(linhaSeparadora())
  linhas.push(centralizarLinha('Via Consumidor'))
  linhas.push(centralizarLinha('Consulte pela Chave de Acesso em'))
  linhas.push(
    centralizarLinha(emitente?.urlConsulta || 'www.sefaz.rs.gov.br/nfce/consulta'),
  )

  if (entrada.chaveAcesso) {
    for (const linha of formatarChaveAcesso(entrada.chaveAcesso)) {
      linhas.push(centralizarLinha(linha))
    }
  }

  const numeroNfce = formatarNumeroNfce(entrada.numero, entrada.serie)
  if (numeroNfce) {
    linhas.push(centralizarLinha(numeroNfce))
  }
  if (entrada.protocoloAutorizacao) {
    linhas.push(centralizarLinha(`PROTOCOLO DE AUTORIZACAO: ${entrada.protocoloAutorizacao}`))
  }
  const dataAutorizacao = formatarDataAutorizacao(entrada.autorizadoEm)
  if (dataAutorizacao) {
    linhas.push(centralizarLinha(`DATA DE AUTORIZACAO: ${dataAutorizacao}`))
  }

  linhas.push(''.padEnd(48, '='))
  if (entrada.cpfDestinatario) {
    linhas.push(centralizarLinha('CONSUMIDOR'))
    linhas.push(centralizarLinha(`CPF: ${formatarCpf(entrada.cpfDestinatario)}`))
  } else {
    linhas.push(centralizarLinha('CONSUMIDOR NAO IDENTIFICADO'))
  }
  linhas.push(''.padEnd(48, '='))
  linhas.push('{QR}')
  return linhas
}
