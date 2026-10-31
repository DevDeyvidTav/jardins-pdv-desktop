import { execFileSync } from 'node:child_process'
import type { ImpressoraRedeDetectada } from '@shared/types/config-impressora'
import {
  PORTA_REDE_IMPRESSORA_PADRAO,
  normalizarEnderecoImpressora,
  normalizarMacImpressora,
} from '@shared/utils/endereco-impressora'

import { interpretarTabelaArp, type VizinhoArp } from './escolher-host-impressora-rede'

const SCRIPT_VARREDURA_REDE = `
$ErrorActionPreference = 'SilentlyContinue'
$meu = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.PrefixOrigin -ne 'WellKnown' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -First 1
if ($null -eq $meu) { Write-Output '[]'; exit 0 }
$base = ($meu.IPAddress -split '\\.')[0..2] -join '.'
$clientes = 1..254 | ForEach-Object {
  $ip = $base + '.' + $_
  $tcp = New-Object System.Net.Sockets.TcpClient
  [pscustomobject]@{ Ip = $ip; Tcp = $tcp; Ar = $tcp.BeginConnect($ip, 9100, $null, $null) }
}
Start-Sleep -Milliseconds 900
$abertos = New-Object System.Collections.Generic.List[string]
foreach ($item in $clientes) {
  if ($item.Tcp.Connected) { [void]$abertos.Add($item.Ip) }
  try { $item.Tcp.Close() } catch {}
}
$arp = @(arp -a)
$saida = @()
foreach ($ip in $abertos) {
  $mac = ''
  foreach ($linha in $arp) {
    if ($linha -like ('*' + $ip + '*') -and $linha -match '([0-9A-Fa-f]{2}-){5}[0-9A-Fa-f]{2}') {
      $mac = $Matches[0]
    }
  }
  $saida += [pscustomobject]@{ host = $ip; mac = $mac }
}
if ($saida.Count -eq 0) { Write-Output '[]' } else { Write-Output ($saida | ConvertTo-Json -Compress) }
`.trim()

function executarPowerShell(comando: string): string {
  return execFileSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', comando],
    {
      encoding: 'utf8',
      timeout: 20_000,
      stdio: ['ignore', 'pipe', 'ignore'],
      windowsHide: true,
    },
  )
}

export function lerVizinhosArp(executar = executarPowerShell): VizinhoArp[] {
  try {
    return interpretarTabelaArp(executar('arp -a'))
  } catch {
    return []
  }
}

export function aprenderMacImpressora(
  host: string,
  executar = executarPowerShell,
): string | null {
  const endereco = normalizarEnderecoImpressora(host)
  if (!endereco || process.env.NODE_ENV === 'test' || process.env.VITEST === 'true') {
    return null
  }

  const ip = endereco.host.replace(/'/g, '')
  try {
    const saida = executar(
      `$tcp = New-Object System.Net.Sockets.TcpClient; $espera = $tcp.BeginConnect('${ip}', ${PORTA_REDE_IMPRESSORA_PADRAO}, $null, $null); [void]$espera.AsyncWaitHandle.WaitOne(1200, $false); try { $tcp.Close() } catch {}; arp -a ${ip}`,
    )
    return interpretarTabelaArp(saida).find((vizinho) => vizinho.host === endereco.host)?.mac ?? null
  } catch {
    return null
  }
}

export function descobrirImpressorasRede(
  executar = executarPowerShell,
): ImpressoraRedeDetectada[] {
  if (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true') {
    return []
  }

  try {
    const saida = executar(SCRIPT_VARREDURA_REDE).trim()
    if (!saida || saida === '[]') {
      return []
    }

    const bruto = JSON.parse(saida) as
      | { host?: string; mac?: string }
      | Array<{ host?: string; mac?: string }>
    const lista = Array.isArray(bruto) ? bruto : [bruto]

    return lista.flatMap((item) => {
      const endereco = normalizarEnderecoImpressora(item.host)
      if (!endereco) {
        return []
      }

      return [
        {
          host: endereco.host,
          porta: PORTA_REDE_IMPRESSORA_PADRAO,
          mac: normalizarMacImpressora(item.mac),
        },
      ]
    })
  } catch {
    return []
  }
}
