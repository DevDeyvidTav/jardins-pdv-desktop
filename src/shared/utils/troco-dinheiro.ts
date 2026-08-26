import { FORMA_PAGAMENTO, type FormaPagamento } from '@shared/types/pagamento-pedido'

/** Menor moeda corrente no Brasil. Troco em dinheiro arredonda para este multiplo. */
export const MOEDA_MINIMA_CENTAVOS = 5

export const CEDULAS_ATALHO_CENTAVOS = [2000, 5000, 10000, 20000] as const

export const MENSAGEM_VALOR_RECEBIDO_INSUFICIENTE =
  'Valor recebido deve ser maior ou igual ao valor do pagamento.'

export interface CamposTrocoDinheiro {
  valorRecebidoCentavos: number | null
  trocoCentavos: number
}

/** Expressao SQL: dinheiro entra no caixa como recebido - troco (liquido fisico). */
export const SQL_VALOR_LIQUIDO_CAIXA = `(
  CASE
    WHEN forma_pagamento = 'DINHEIRO'
      THEN COALESCE(valor_recebido_centavos, valor_centavos) - COALESCE(troco_centavos, 0)
    ELSE valor_centavos
  END
)`

export function arredondarParaMoedaMinima(centavos: number): number {
  if (!Number.isInteger(centavos) || centavos <= 0) {
    return 0
  }

  return Math.round(centavos / MOEDA_MINIMA_CENTAVOS) * MOEDA_MINIMA_CENTAVOS
}

export function calcularTrocoDinheiro(
  valorAplicadoCentavos: number,
  valorRecebidoCentavos: number,
): number {
  const trocoExato = valorRecebidoCentavos - valorAplicadoCentavos
  if (trocoExato <= 0) {
    return 0
  }

  return arredondarParaMoedaMinima(trocoExato)
}

export function valorLiquidoCaixaDinheiro(
  valorCentavos: number,
  valorRecebidoCentavos: number | null | undefined,
  trocoCentavos: number | null | undefined,
): number {
  if (valorRecebidoCentavos == null) {
    return valorCentavos
  }

  return valorRecebidoCentavos - (trocoCentavos ?? 0)
}

export function mensagemErroValorRecebidoDinheiro(
  formaPagamento: FormaPagamento,
  valorCentavos: number,
  valorRecebidoCentavos: number | null | undefined,
): string | null {
  if (formaPagamento !== FORMA_PAGAMENTO.DINHEIRO) {
    return null
  }

  if (valorRecebidoCentavos == null) {
    return null
  }

  if (valorRecebidoCentavos < valorCentavos) {
    return MENSAGEM_VALOR_RECEBIDO_INSUFICIENTE
  }

  return null
}

export function resolverCamposTrocoDinheiro(entrada: {
  formaPagamento: FormaPagamento
  valorCentavos: number
  valorRecebidoCentavos?: number | null
}): CamposTrocoDinheiro {
  if (entrada.formaPagamento !== FORMA_PAGAMENTO.DINHEIRO) {
    return { valorRecebidoCentavos: null, trocoCentavos: 0 }
  }

  const valorRecebidoCentavos = entrada.valorRecebidoCentavos ?? entrada.valorCentavos

  return {
    valorRecebidoCentavos,
    trocoCentavos: calcularTrocoDinheiro(entrada.valorCentavos, valorRecebidoCentavos),
  }
}

export function cedulasAtalhoParaRecebido(valorAplicadoCentavos: number): number[] {
  return CEDULAS_ATALHO_CENTAVOS.filter((cedula) => cedula >= valorAplicadoCentavos)
}
