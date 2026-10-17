import type { PedidoItem } from '@shared/types/pedido'
import { TIPO_PEDIDO_ITEM, type PizzaPedidoItemResumo } from '@shared/types/pizza'

export interface LinhaSaborPizza {
  nome: string
  valorCentavos: number
}

const SIGLA_POR_NOME: Record<string, string> = {
  pequena: 'P',
  media: 'M',
  média: 'M',
  grande: 'G',
  familia: 'F',
  família: 'F',
  gigante: 'GG',
}

export function ratearCentavosProporcional(total: number, pesos: number[]): number[] {
  if (pesos.length === 0) {
    return []
  }

  const somaPesos = pesos.reduce((acc, peso) => acc + Math.max(0, peso), 0)
  if (somaPesos <= 0) {
    const base = Math.floor(total / pesos.length)
    const resto = total - base * pesos.length
    return pesos.map((_, indice) => base + (indice === pesos.length - 1 ? resto : 0))
  }

  const valores = pesos.map((peso) => Math.floor((total * Math.max(0, peso)) / somaPesos))
  const alocado = valores.reduce((acc, valor) => acc + valor, 0)
  valores[valores.length - 1] += total - alocado
  return valores
}

export function resolverSiglaTamanhoPizza(
  pizza: Pick<PizzaPedidoItemResumo, 'tamanhoNomeSnapshot'>,
  produtoNome?: string | null,
): string {
  const doProduto = produtoNome?.match(/Pizza\s+([A-Za-z]{1,3})\b/i)
  if (doProduto?.[1]) {
    return doProduto[1].toUpperCase()
  }

  const primeiroSabor = produtoNome?.split('+')[0]?.trim()
  const tokenFinal = primeiroSabor?.split(/\s+/).pop()
  if (tokenFinal && /^[A-Za-z]{1,3}$/.test(tokenFinal)) {
    return tokenFinal.toUpperCase()
  }

  const snapshot = pizza.tamanhoNomeSnapshot.trim()
  if (snapshot.length > 0 && snapshot.length <= 3) {
    return snapshot.toUpperCase()
  }

  return SIGLA_POR_NOME[snapshot.toLowerCase()] ?? snapshot
}

export function montarNomeLinhaSaborPizza(
  saborNome: string,
  sigla: string,
  quantidadeSabores: number,
): string {
  const fracao = quantidadeSabores > 1 ? `1/${quantidadeSabores} ` : ''
  return `${fracao}${saborNome} ${sigla}`.replace(/\s+/g, ' ').trim()
}

export function expandirLinhasSaborPizza(item: PedidoItem): LinhaSaborPizza[] | null {
  const pizza = item.tipo === TIPO_PEDIDO_ITEM.PIZZA ? item.pizza : null
  if (!pizza || pizza.sabores.length === 0) {
    return null
  }

  const sigla = resolverSiglaTamanhoPizza(pizza, item.produtoNome)
  const total = item.totalCentavos
  const valores = ratearCentavosProporcional(
    total,
    pizza.sabores.map((sabor) => sabor.valorSaborSnapshotCentavos),
  )

  return pizza.sabores.map((sabor, indice) => ({
    nome: montarNomeLinhaSaborPizza(sabor.saborNomeSnapshot, sigla, pizza.sabores.length),
    valorCentavos: valores[indice] ?? 0,
  }))
}
