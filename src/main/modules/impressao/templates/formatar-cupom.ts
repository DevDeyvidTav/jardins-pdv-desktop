import { formatarMoeda } from '@shared/utils/moeda'

/**
 * No modo ESC/POS a MP-4200 TH sempre trata o papel como 80mm/73.5mm
 * imprimivel (mesmo que a bobina fisica seja outra), e a largura padrao
 * (fonte normal, sem modo condensado) e de 48 colunas — ver "Table 1 -
 * Characters Per Line" do manual da impressora. Usar menos que isso deixa
 * uma faixa em branco do lado direito do cupom.
 */
export const LARGURA_CUPOM = 48

/** Intl.pt-BR usa NBSP entre R$ e o valor; na termica isso vira lixo. */
export function formatarMoedaCupom(valorCentavos: number): string {
  return formatarMoeda(valorCentavos).replace(/[\u00A0\u202F\u2007]/g, ' ')
}

export function centralizarLinha(texto: string, largura = LARGURA_CUPOM): string {
  const recorte = texto.slice(0, largura)
  const sobra = Math.max(0, largura - recorte.length)
  const esquerda = Math.floor(sobra / 2)
  return `${' '.repeat(esquerda)}${recorte}`
}

export function alinharDireita(texto: string, largura = LARGURA_CUPOM): string {
  return texto.slice(0, largura).padStart(largura)
}

export function linhaSeparadora(largura = LARGURA_CUPOM): string {
  return '-'.repeat(largura)
}

export const INDENTACAO_ITEM_CUPOM = '   '

export function quebrarTexto(texto: string, largura: number): string[] {
  const palavras = texto.trim().split(/\s+/).filter(Boolean)
  if (palavras.length === 0 || largura < 1) {
    return []
  }

  const linhas: string[] = []
  let atual = ''

  for (const palavra of palavras) {
    const candidato = atual ? `${atual} ${palavra}` : palavra
    if (candidato.length <= largura) {
      atual = candidato
      continue
    }

    if (atual) {
      linhas.push(atual)
    }

    if (palavra.length <= largura) {
      atual = palavra
      continue
    }

    let resto = palavra
    while (resto.length > largura) {
      linhas.push(resto.slice(0, largura))
      resto = resto.slice(largura)
    }
    atual = resto
  }

  if (atual) {
    linhas.push(atual)
  }

  return linhas
}

export function linhaEsquerdaDireita(
  esquerda: string,
  direita: string,
  largura = LARGURA_CUPOM,
): string {
  const maxEsquerda = Math.max(1, largura - direita.length - 1)
  const recorte = esquerda.slice(0, maxEsquerda)
  const espacos = largura - recorte.length - direita.length
  return `${recorte}${' '.repeat(Math.max(1, espacos))}${direita}`
}

export function linhasItemConta(item: {
  quantidade: number
  nome: string
  detalhes: string[]
  observacao: string | null
  totalCentavos: number
}): string[] {
  const valor = formatarMoedaCupom(item.totalCentavos)
  const larguraNome = LARGURA_CUPOM - valor.length - 1
  const larguraContinuacao = LARGURA_CUPOM - INDENTACAO_ITEM_CUPOM.length
  const partesNome = quebrarTexto(`${item.quantidade}  ${item.nome}`, larguraNome)
  const linhas = [
    linhaEsquerdaDireita(partesNome[0] ?? `${item.quantidade}`, valor),
    ...partesNome.slice(1).map((parte) => `${INDENTACAO_ITEM_CUPOM}${parte}`),
  ]

  if (item.detalhes.length > 0) {
    for (const parte of quebrarTexto(item.detalhes.join(' / '), larguraContinuacao)) {
      linhas.push(`${INDENTACAO_ITEM_CUPOM}${parte}`)
    }
  }

  if (item.observacao) {
    for (const parte of quebrarTexto(item.observacao, larguraContinuacao)) {
      linhas.push(`${INDENTACAO_ITEM_CUPOM}${parte}`)
    }
  }

  return linhas
}

export function linhasItemComanda(item: {
  quantidade: number
  nome: string
  detalhes: string[]
  observacao: string | null
}): string[] {
  const larguraContinuacao = LARGURA_CUPOM - INDENTACAO_ITEM_CUPOM.length
  const linhas = quebrarTexto(
    `${item.quantidade}x ${item.nome.toUpperCase()}`,
    LARGURA_CUPOM,
  )

  for (const detalhe of item.detalhes) {
    for (const parte of quebrarTexto(`- ${detalhe}`, larguraContinuacao)) {
      linhas.push(`${INDENTACAO_ITEM_CUPOM}${parte}`)
    }
  }

  if (item.observacao) {
    for (const parte of quebrarTexto(`OBS: ${item.observacao}`, larguraContinuacao)) {
      linhas.push(`${INDENTACAO_ITEM_CUPOM}${parte}`)
    }
  }

  return linhas
}

export function valorEntraNaContaImpressao(valorCentavos: number): boolean {
  return valorCentavos > 0
}

export function linhaRotuloValor(
  rotulo: string,
  valorCentavos: number,
  largura = LARGURA_CUPOM,
): string {
  const valor = formatarMoedaCupom(valorCentavos)
  const espacos = largura - rotulo.length - valor.length
  return `${rotulo}${' '.repeat(Math.max(1, espacos))}${valor}`
}

export function linhaRotuloValorOpcional(
  rotulo: string,
  valorCentavos: number,
  largura = LARGURA_CUPOM,
): string | null {
  if (!valorEntraNaContaImpressao(valorCentavos)) {
    return null
  }

  return linhaRotuloValor(rotulo, valorCentavos, largura)
}

export function formatarDataHoraCupom(isoUtc: string): { data: string; hora: string } {
  const data = new Date(isoUtc)
  return {
    data: data.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    hora: data.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }
}

export function rotuloOrigemPedido(
  tipoPedido: 'MESA' | 'BALCAO' | 'DELIVERY',
  mesaNumero: number | null,
): string {
  if (tipoPedido === 'MESA' && mesaNumero !== null) {
    return `Mesa ${mesaNumero}`
  }

  if (tipoPedido === 'BALCAO') {
    return 'Balcao'
  }

  return 'Delivery'
}
