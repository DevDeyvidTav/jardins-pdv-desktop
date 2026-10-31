export const PORTA_REDE_IMPRESSORA_PADRAO = 9100

export interface EnderecoImpressoraRede {
  host: string
  porta: number
}

/** Aceita `10.0.70.11` ou `10.0.70.11:9100`. Sem porta, usa 9100. */
export function normalizarEnderecoImpressora(
  valor: string | null | undefined,
): EnderecoImpressoraRede | null {
  if (!valor?.trim()) {
    return null
  }

  const texto = valor.trim()
  const match = /^(\d{1,3}(?:\.\d{1,3}){3})(?::(\d{1,5}))?$/.exec(texto)
  if (!match) {
    return null
  }

  const octetos = match[1].split('.').map((parte) => Number(parte))
  if (octetos.some((octeto) => octeto > 255)) {
    return null
  }

  const porta = match[2] ? Number(match[2]) : PORTA_REDE_IMPRESSORA_PADRAO
  if (!Number.isInteger(porta) || porta < 1 || porta > 65535) {
    return null
  }

  return { host: match[1], porta }
}

/** MAC no formato do Windows: `AA-BB-CC-DD-EE-FF`. */
export function normalizarMacImpressora(valor: string | null | undefined): string | null {
  if (!valor?.trim()) {
    return null
  }

  const compacto = valor.trim().toUpperCase().replace(/[^0-9A-F]/g, '')
  if (compacto.length !== 12) {
    return null
  }

  if (compacto === '000000000000' || compacto === 'FFFFFFFFFFFF') {
    return null
  }

  return compacto.match(/.{2}/g)!.join('-')
}

export function formatarEnderecoImpressora(endereco: EnderecoImpressoraRede): string {
  if (endereco.porta === PORTA_REDE_IMPRESSORA_PADRAO) {
    return endereco.host
  }

  return `${endereco.host}:${endereco.porta}`
}
