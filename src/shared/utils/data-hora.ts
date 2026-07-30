export function agoraEmIsoUtc(): string {
  return new Date().toISOString()
}

export function obterVersaoDoPacote(): string {
  return process.env.npm_package_version ?? '0.1.0'
}
