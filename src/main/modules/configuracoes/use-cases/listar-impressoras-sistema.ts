import { execFileSync } from 'node:child_process'
import type {
  ImpressoraDetectada,
  ImpressorasSistemaResposta,
  PortaComDetectada,
} from '@shared/types/config-impressora'

const COMANDO_LISTAR_IMPRESSORAS = `
$ErrorActionPreference = 'SilentlyContinue'
$padrao = (Get-Printer | Where-Object { $_.Default -eq $true } | Select-Object -First 1 -ExpandProperty Name)
$impressoras = @(Get-Printer | ForEach-Object {
  $porta = $_.PortName
  if ($porta -match '^COM\\d+') { $porta = $porta.TrimEnd(':') }
  [PSCustomObject]@{
    nome = $_.Name
    porta = $porta
    status = [string]$_.PrinterStatus
    padrao = ($_.Name -eq $padrao)
  }
})
$mapa = @{}
foreach ($item in $impressoras) {
  if ($item.porta -match '^COM\\d+$') { $mapa[$item.porta] = $item.nome }
}
$portasCom = @([System.IO.Ports.SerialPort]::GetPortNames() | Sort-Object | ForEach-Object {
  [PSCustomObject]@{ porta = $_; impressora = $mapa[$_] }
})
[PSCustomObject]@{
  impressoras = $impressoras
  portasCom = $portasCom
} | ConvertTo-Json -Compress -Depth 4
`.trim()

export function executarConsultaPowerShellConfig(comando: string): string {
  return execFileSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', comando],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true },
  )
}

function normalizarPortaCom(porta: string | null | undefined): string | null {
  if (!porta?.trim()) {
    return null
  }

  const limpa = porta.trim().replace(/:$/, '')
  return limpa.match(/^COM\d+$/i) ? limpa.toUpperCase() : limpa
}

function parseRespostaImpressorasSistema(json: string): ImpressorasSistemaResposta {
  if (!json.trim()) {
    return { impressoras: [], portasCom: [] }
  }

  const bruto = JSON.parse(json) as {
    impressoras?: ImpressoraDetectada | ImpressoraDetectada[]
    portasCom?: PortaComDetectada | PortaComDetectada[]
  }

  const impressorasBrutas = bruto.impressoras
    ? Array.isArray(bruto.impressoras)
      ? bruto.impressoras
      : [bruto.impressoras]
    : []

  const portasBrutas = bruto.portasCom
    ? Array.isArray(bruto.portasCom)
      ? bruto.portasCom
      : [bruto.portasCom]
    : []

  return {
    impressoras: impressorasBrutas.map((item) => ({
      nome: String(item.nome ?? '').trim(),
      porta: normalizarPortaCom(item.porta),
      status: item.status ? String(item.status) : null,
      padrao: Boolean(item.padrao),
    })),
    portasCom: portasBrutas.map((item) => ({
      porta: normalizarPortaCom(item.porta) ?? String(item.porta ?? ''),
      impressora: item.impressora ? String(item.impressora) : null,
    })),
  }
}

export function listarImpressorasSistema(
  executarConsulta?: (comando: string) => string,
  env: NodeJS.ProcessEnv = process.env,
): ImpressorasSistemaResposta {
  if (env.PDV_IMPRESSORA_MOCK === '1') {
    return { impressoras: [], portasCom: [] }
  }

  if (env.NODE_ENV === 'test' && !executarConsulta) {
    return { impressoras: [], portasCom: [] }
  }

  if (!executarConsulta && process.platform !== 'win32') {
    return { impressoras: [], portasCom: [] }
  }

  const executar = executarConsulta ?? executarConsultaPowerShellConfig

  try {
    const saida = executar(COMANDO_LISTAR_IMPRESSORAS)
    return parseRespostaImpressorasSistema(saida)
  } catch {
    return { impressoras: [], portasCom: [] }
  }
}
