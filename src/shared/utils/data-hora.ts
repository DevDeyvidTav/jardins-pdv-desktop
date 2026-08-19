export function agoraEmIsoUtc(): string {
  return new Date().toISOString()
}

/** Competencia mensal no formato YYYY-MM a partir de um ISO UTC. */
export function competenciaDeIsoUtc(iso: string): string {
  return iso.slice(0, 7)
}

export function competenciaAtualUtc(agora = agoraEmIsoUtc()): string {
  return competenciaDeIsoUtc(agora)
}

export function obterVersaoDoPacote(): string {
  return process.env.npm_package_version ?? '0.1.0'
}
