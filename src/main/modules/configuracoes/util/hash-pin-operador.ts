import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const PREFIXO_HASH = 'scrypt1'
const TAMANHO_CHAVE = 32

export function hashPinOperador(pin: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(pin, salt, TAMANHO_CHAVE)
  return `${PREFIXO_HASH}:${salt.toString('base64url')}:${hash.toString('base64url')}`
}

export function verificarPinOperador(pin: string, armazenado: string): boolean {
  if (armazenado.startsWith(`${PREFIXO_HASH}:`)) {
    const partes = armazenado.split(':')
    if (partes.length !== 3) return false
    const salt = Buffer.from(partes[1]!, 'base64url')
    const esperado = Buffer.from(partes[2]!, 'base64url')
    const atual = scryptSync(pin, salt, TAMANHO_CHAVE)
    if (esperado.length !== atual.length) return false
    return timingSafeEqual(esperado, atual)
  }

  // Legado: PIN em texto puro (MVP anterior)
  return pin === armazenado
}

export function pinEstaHasheado(armazenado: string): boolean {
  return armazenado.startsWith(`${PREFIXO_HASH}:`)
}
