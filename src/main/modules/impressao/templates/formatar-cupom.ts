import { formatarMoeda } from '@shared/utils/moeda'

export const LARGURA_CUPOM = 42

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
