import { normalizarMacImpressora } from '@shared/utils/endereco-impressora'

export interface VizinhoArp {
  host: string
  mac: string
}

export interface ImpressoraRedeEncontrada {
  host: string
  mac: string | null
}

export function interpretarTabelaArp(saida: string): VizinhoArp[] {
  const vizinhos: VizinhoArp[] = []

  for (const linha of saida.split(/\r?\n/)) {
    const host = linha.match(/\b(\d{1,3}(?:\.\d{1,3}){3})\b/)?.[1]
    const mac = normalizarMacImpressora(linha.match(/([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}/)?.[0])
    if (!host || !mac) {
      continue
    }

    vizinhos.push({ host, mac })
  }

  return vizinhos
}

/**
 * O MAC memorizado escolhe a impressora. Sem MAC, só troca de IP quando
 * existe uma única térmica na porta 9100.
 */
export function escolherHostImpressoraRede(entrada: {
  hostSalvo: string
  macSalva: string | null
  arp: VizinhoArp[]
  encontradas: ImpressoraRedeEncontrada[] | null
}): { host: string; mac: string | null } | null {
  const macSalva = normalizarMacImpressora(entrada.macSalva)
  const macDoHost = (host: string) =>
    entrada.arp.find((vizinho) => vizinho.host === host)?.mac ?? null

  if (entrada.encontradas === null) {
    if (macSalva) {
      const peloMac = entrada.arp.find((vizinho) => vizinho.mac === macSalva)
      if (peloMac) {
        return { host: peloMac.host, mac: macSalva }
      }
    }

    return { host: entrada.hostSalvo, mac: macDoHost(entrada.hostSalvo) ?? macSalva }
  }

  const comMac = entrada.encontradas.map((impressora) => ({
    host: impressora.host,
    mac: normalizarMacImpressora(impressora.mac) ?? macDoHost(impressora.host),
  }))

  if (macSalva) {
    const mesma = comMac.find((impressora) => impressora.mac === macSalva)
    if (mesma) {
      return mesma
    }
  }

  if (comMac.some((impressora) => impressora.host === entrada.hostSalvo)) {
    return {
      host: entrada.hostSalvo,
      mac: macDoHost(entrada.hostSalvo) ?? macSalva,
    }
  }

  if (comMac.length === 1) {
    return comMac[0] ?? null
  }

  return null
}
