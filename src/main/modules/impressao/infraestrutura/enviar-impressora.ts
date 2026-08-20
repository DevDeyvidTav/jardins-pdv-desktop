import { execFileSync } from 'node:child_process'
import { unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/** Legado: lock em arquivo ficava orfao apos reinicio do Electron no dev. */
const CAMINHO_LOCK_LEGADO = join(tmpdir(), 'pdv-impressora.lock')
const TIMEOUT_SCRIPT_MS = 20_000
const SCRIPT_IMPRESSORA_COM = join(tmpdir(), `pdv-impressora-com-${process.pid}.ps1`)
const SCRIPT_SPOOLER = join(tmpdir(), `pdv-impressora-spooler-${process.pid}.ps1`)

/** Falha antes de qualquer byte sair: reenviar nao duplica o cupom. */
const PREFIXO_FALHA_SEGURA = 'ABERTURA:'

let scriptComInicializado = false
let scriptSpoolerInicializado = false
let impressaoEmAndamento = false

export function impressoraEstaOcupada(): boolean {
  return impressaoEmAndamento
}

export function removerLockImpressoraLegado(
  caminho = CAMINHO_LOCK_LEGADO,
  remover = unlinkSync,
): void {
  try {
    remover(caminho)
  } catch {
    // lock legado inexistente ou ja removido
  }
}

export type DestinoImpressao =
  | { tipo: 'SIMULADO' }
  | { tipo: 'SPOOLER'; nome: string }
  | { tipo: 'COM'; porta: string; nomeImpressora: string }

export function deveSimularImpressora(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.NODE_ENV === 'test' || env.PDV_IMPRESSORA_MOCK === '1'
}

export function obterNomeImpressoraLocal(
  env: NodeJS.ProcessEnv = process.env,
): string {
  return env.PDV_IMPRESSORA_NOME?.trim() || 'MP-4200 TH'
}

export function obterPortaImpressoraLocal(
  env: NodeJS.ProcessEnv = process.env,
): string {
  return env.PDV_IMPRESSORA_PORTA?.trim() || 'COM10'
}

export function resolverDestinoImpressao(
  env: NodeJS.ProcessEnv = process.env,
): DestinoImpressao {
  if (deveSimularImpressora(env)) {
    return { tipo: 'SIMULADO' }
  }

  if (env.PDV_IMPRESSORA_COM === '1') {
    return {
      tipo: 'COM',
      porta: obterPortaImpressoraLocal(env),
      nomeImpressora: obterNomeImpressoraLocal(env),
    }
  }

  return { tipo: 'SPOOLER', nome: obterNomeImpressoraLocal(env) }
}

export function falhaPermiteReenvio(erro: unknown): boolean {
  const mensagem = erro instanceof Error ? erro.message : String(erro)
  return mensagem.startsWith(PREFIXO_FALHA_SEGURA)
}

export function enviarBufferImpressora(
  buffer: Buffer,
  destino = resolverDestinoImpressao(),
): void {
  if (destino.tipo === 'SIMULADO') {
    return
  }

  executarComLockImpressora(() => {
    if (destino.tipo === 'COM') {
      enviarViaComWindows(buffer, destino.porta, destino.nomeImpressora)
      return
    }

    enviarViaSpoolerWindows(buffer, destino.nome)
  })
}

function executarComLockImpressora<T>(operacao: () => T): T {
  if (impressaoEmAndamento) {
    throw new Error('Impressora ocupada. Aguarde o cupom anterior terminar.')
  }

  impressaoEmAndamento = true
  removerLockImpressoraLegado()

  try {
    return operacao()
  } finally {
    impressaoEmAndamento = false
  }
}

function garantirScriptCom(): void {
  if (scriptComInicializado) {
    return
  }

  writeFileSync(SCRIPT_IMPRESSORA_COM, SCRIPT_ENVIAR_COM, 'utf8')
  scriptComInicializado = true
}

export function retomarImpressoraWindows(
  nomeImpressora: string,
  executarScript = executarScriptPowerShellArquivo,
): void {
  garantirScriptCom()
  executarScript(SCRIPT_IMPRESSORA_COM, {
    PrinterName: nomeImpressora,
    PortName: obterPortaImpressoraLocal(),
    FilePath: '',
    Modo: 'Retomar',
  })
}

export function limparFilaImpressora(
  nomeImpressora: string,
  executarScript = executarScriptPowerShellArquivo,
): void {
  garantirScriptCom()
  executarScript(SCRIPT_IMPRESSORA_COM, {
    PrinterName: nomeImpressora,
    PortName: obterPortaImpressoraLocal(),
    FilePath: '',
    Modo: 'Limpar',
  })
}

function enviarViaComWindows(
  buffer: Buffer,
  porta: string,
  nomeImpressora: string,
): void {
  try {
    executarEnvioCom(buffer, porta, nomeImpressora)
    return
  } catch (erro) {
    if (!falhaPermiteReenvio(erro)) {
      throw new Error(
        obterMensagemErroImpressora(nomeImpressora, extrairDetalhe(erro)),
      )
    }
  }

  limparFilaImpressora(nomeImpressora)

  try {
    executarEnvioCom(buffer, porta, nomeImpressora)
    return
  } catch (erro) {
    if (!falhaPermiteReenvio(erro)) {
      throw new Error(
        obterMensagemErroImpressora(nomeImpressora, extrairDetalhe(erro)),
      )
    }
  }

  /** A Bematech reenumera a porta COM a cada reconexao USB; a configurada pode ter ficado obsoleta. */
  const portaDetectada = detectarPortaComAtual(nomeImpressora)

  if (portaDetectada && portaDetectada !== porta) {
    try {
      executarEnvioCom(buffer, portaDetectada, nomeImpressora)
      return
    } catch (erro) {
      if (!falhaPermiteReenvio(erro)) {
        throw new Error(
          obterMensagemErroImpressora(nomeImpressora, extrairDetalhe(erro)),
        )
      }
    }
  }

  enviarViaSpoolerWindows(buffer, nomeImpressora, portaDetectada ?? porta)
}

export function detectarPortaComAtual(
  nomeImpressora: string,
  executarConsulta = executarConsultaPowerShell,
): string | null {
  try {
    const termoEscapado = nomeImpressora.replace(/'/g, "''")
    const saida = executarConsulta(
      `(Get-PnpDevice | Where-Object { $_.Present -and $_.FriendlyName -like '*${termoEscapado}*' -and $_.FriendlyName -match '\\(COM\\d+\\)' } | Select-Object -First 1 -ExpandProperty FriendlyName)`,
    ).trim()

    const combinacao = saida.match(/\(COM(\d+)\)/i)
    return combinacao ? `COM${combinacao[1]}` : null
  } catch {
    return null
  }
}

function enviarViaSpoolerWindows(
  buffer: Buffer,
  nomeImpressora: string,
  porta = obterPortaImpressoraLocal(),
): void {
  try {
    executarEnvioRawSpooler(buffer, nomeImpressora)
  } catch (erroSpooler) {
    try {
      executarEnvioCom(buffer, porta, nomeImpressora)
    } catch (erroCom) {
      limparFilaImpressora(nomeImpressora)
      const detalheSpooler = extrairDetalhe(erroSpooler)
      const detalheCom = extrairDetalhe(erroCom)
      throw new Error(
        obterMensagemErroImpressora(
          nomeImpressora,
          `Spooler: ${detalheSpooler}. COM: ${detalheCom}`,
        ),
      )
    }
  }
}

function extrairDetalhe(erro: unknown): string {
  const mensagem = erro instanceof Error ? erro.message : String(erro)
  return mensagem.startsWith(PREFIXO_FALHA_SEGURA)
    ? mensagem.slice(PREFIXO_FALHA_SEGURA.length).trim()
    : mensagem
}

function executarEnvioCom(
  buffer: Buffer,
  porta: string,
  nomeImpressora: string,
): void {
  garantirScriptCom()

  const arquivo = criarArquivoTemporario(buffer)

  try {
    executarScriptPowerShellArquivo(SCRIPT_IMPRESSORA_COM, {
      PrinterName: nomeImpressora,
      PortName: porta,
      FilePath: arquivo,
      Modo: 'Imprimir',
    })
  } finally {
    removerArquivoTemporario(arquivo)
  }
}

function executarEnvioRawSpooler(buffer: Buffer, nomeImpressora: string): void {
  if (!scriptSpoolerInicializado) {
    writeFileSync(SCRIPT_SPOOLER, SCRIPT_SPOOLER_RAW, 'utf8')
    scriptSpoolerInicializado = true
  }

  const arquivo = criarArquivoTemporario(buffer)

  try {
    executarScriptPowerShellArquivo(SCRIPT_SPOOLER, {
      PrinterName: nomeImpressora,
      FilePath: arquivo,
    })
  } finally {
    removerArquivoTemporario(arquivo)
  }
}

function criarArquivoTemporario(buffer: Buffer): string {
  const arquivo = join(tmpdir(), `pdv-escpos-${process.pid}-${Date.now()}.bin`)
  writeFileSync(arquivo, buffer)
  return arquivo
}

function removerArquivoTemporario(arquivo: string): void {
  try {
    unlinkSync(arquivo)
  } catch {
    // arquivo temporario
  }
}

export function obterMensagemErroImpressora(
  nomeImpressora: string,
  detalhe: string,
  consultarStatus = consultarStatusImpressoraWindows,
): string {
  const status = consultarStatus(nomeImpressora)
  if (status?.printerStatus === 'Paused') {
    return `A impressora ${nomeImpressora} esta pausada no Windows. Abra a fila de impressao, desmarque "Pausar impressao" no menu Impressora, ou reinicie o PDV (ele retoma automaticamente). ${detalhe}`
  }

  if (status?.printerStatus === 'Error') {
    return `A impressora ${nomeImpressora} nao responde. Desligue-a (botao atras), aguarde 5 segundos, ligue de novo e tente outra vez. ${detalhe}`
  }

  if (status && status.jobCount > 0) {
    return `A fila da impressora ${nomeImpressora} ainda tem ${status.jobCount} job(s) preso(s). ${detalhe}`
  }

  return `Nao foi possivel enviar para a impressora ${nomeImpressora}. ${detalhe}`
}

export interface StatusImpressoraWindows {
  printerStatus: string
  jobCount: number
}

export function consultarStatusImpressoraWindows(
  nomeImpressora: string,
  executarConsulta = executarConsultaPowerShell,
): StatusImpressoraWindows | null {
  try {
    const nomeEscapado = nomeImpressora.replace(/'/g, "''")
    const saida = executarConsulta(
      `$p = Get-Printer -Name '${nomeEscapado}' -ErrorAction Stop; "$($p.PrinterStatus)|$($p.JobCount)"`,
    ).trim()

    const [printerStatus = 'Unknown', jobCountTexto = '0'] = saida.split('|')
    return {
      printerStatus,
      jobCount: Number(jobCountTexto) || 0,
    }
  } catch {
    return null
  }
}

function executarConsultaPowerShell(comando: string): string {
  return execFileSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', comando],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true },
  )
}

function executarScriptPowerShellArquivo(
  script: string,
  parametros: Record<string, string>,
): void {
  const argumentos = [
    '-NoProfile',
    '-NonInteractive',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    script,
  ]

  for (const [nome, valor] of Object.entries(parametros)) {
    argumentos.push(`-${nome}`, valor)
  }

  const saida = execFileSync('powershell.exe', argumentos, {
    timeout: TIMEOUT_SCRIPT_MS,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    windowsHide: true,
  }).trim()

  if (saida === 'OK') {
    return
  }

  if (saida.startsWith('FAIL:')) {
    throw new Error(saida.slice(5).trim())
  }

  throw new Error(saida || 'Falha desconhecida ao enviar para a impressora.')
}

/**
 * Caminho rapido nao consulta WMI: cada Get-CimInstance custa segundos e ja
 * estourou o timeout do Node, o que reenviava um cupom ja impresso.
 */
const SCRIPT_ENVIAR_COM = `
param(
  [string]$PrinterName = '',
  [string]$PortName,
  [string]$FilePath = '',
  [ValidateSet('Imprimir', 'Limpar', 'Retomar')]
  [string]$Modo = 'Imprimir'
)

$ErrorActionPreference = 'Stop'

function Retomar-Impressora {
  param([string]$Nome)
  if ([string]::IsNullOrWhiteSpace($Nome)) { return }
  $nomeEscapado = $Nome.Replace("'", "''")
  $printer = Get-CimInstance Win32_Printer -Filter "Name='$nomeEscapado'" -ErrorAction SilentlyContinue
  if ($null -ne $printer) {
    [void](Invoke-CimMethod -InputObject $printer -MethodName Resume -ErrorAction SilentlyContinue)
  }
}

if ($Modo -eq 'Retomar') {
  try {
    Retomar-Impressora -Nome $PrinterName
    Write-Output 'OK'
    exit 0
  } catch {
    Write-Output ("FAIL:ABERTURA:" + $_.Exception.Message)
    exit 1
  }
}

if ($Modo -eq 'Limpar') {
  try {
    Retomar-Impressora -Nome $PrinterName
    for ($t = 0; $t -lt 3; $t++) {
      $jobs = @(Get-PrintJob -PrinterName $PrinterName -ErrorAction SilentlyContinue)
      if ($jobs.Count -eq 0) { break }
      foreach ($job in $jobs) {
        Remove-PrintJob -PrinterName $PrinterName -ID $job.Id -ErrorAction SilentlyContinue
      }
      Start-Sleep -Milliseconds 80
    }
    Retomar-Impressora -Nome $PrinterName
    Write-Output 'OK'
    exit 0
  } catch {
    Retomar-Impressora -Nome $PrinterName
    Write-Output ("FAIL:ABERTURA:" + $_.Exception.Message)
    exit 1
  }
}

try {
  $bytes = [IO.File]::ReadAllBytes($FilePath)
  $port = New-Object System.IO.Ports.SerialPort $PortName, 115200, 'None', 8, 'One'
  $port.Handshake = [System.IO.Ports.Handshake]::None
  $port.WriteTimeout = 8000
  # Sem DTR/RTS ativos a porta virtual USB da Bematech nao aceita bytes e trava
  # com "tempo limite do semaforo expirou", mesmo com o dispositivo presente e OK.
  $port.DtrEnable = $true
  $port.RtsEnable = $true
} catch {
  Write-Output ("FAIL:ABERTURA:" + $_.Exception.Message)
  exit 1
}

try {
  $port.Open()
  Start-Sleep -Milliseconds 300
} catch {
  Write-Output ("FAIL:ABERTURA:" + $_.Exception.Message)
  exit 1
}

try {
  $port.Write($bytes, 0, $bytes.Length)
  $relogio = [Diagnostics.Stopwatch]::StartNew()
  while ($port.BytesToWrite -gt 0 -and $relogio.ElapsedMilliseconds -lt 8000) {
    Start-Sleep -Milliseconds 20
  }
  if ($port.BytesToWrite -gt 0) {
    throw "A impressora nao consumiu $($port.BytesToWrite) bytes."
  }
  Write-Output 'OK'
  exit 0
} catch {
  Write-Output ("FAIL:" + $_.Exception.Message)
  exit 1
} finally {
  try {
    if ($port.IsOpen) { $port.Close() }
    $port.Dispose()
  } catch {}
}
`

const SCRIPT_SPOOLER_RAW = `
param([string]$PrinterName, [string]$FilePath)
$ErrorActionPreference = 'Stop'
try {
  Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class PdvRawPrinter {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
  public class DOCINFOA {
    [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
    [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
    [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
  }
  [DllImport("winspool.drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi)]
  public static extern bool OpenPrinter(string szPrinter, out IntPtr hPrinter, IntPtr pd);
  [DllImport("winspool.drv", EntryPoint = "ClosePrinter", SetLastError = true)]
  public static extern bool ClosePrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi)]
  public static extern int StartDocPrinter(IntPtr hPrinter, int level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);
  [DllImport("winspool.drv", EntryPoint = "EndDocPrinter", SetLastError = true)]
  public static extern bool EndDocPrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", EntryPoint = "StartPagePrinter", SetLastError = true)]
  public static extern bool StartPagePrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", EntryPoint = "EndPagePrinter", SetLastError = true)]
  public static extern bool EndPagePrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", EntryPoint = "WritePrinter", SetLastError = true)]
  public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);
}
"@
  $bytes = [IO.File]::ReadAllBytes($FilePath)
  $handle = [IntPtr]::Zero
  if (-not [PdvRawPrinter]::OpenPrinter($PrinterName, [ref]$handle, [IntPtr]::Zero)) {
    throw "Impressora nao encontrada: $PrinterName"
  }
  try {
    $info = New-Object PdvRawPrinter+DOCINFOA
    $info.pDocName = 'PDV Jardins'
    $info.pDataType = 'RAW'
    if ([PdvRawPrinter]::StartDocPrinter($handle, 1, $info) -eq 0) {
      throw 'Falha ao iniciar documento na impressora.'
    }
    try {
      [void][PdvRawPrinter]::StartPagePrinter($handle)
      $ptr = [Runtime.InteropServices.Marshal]::AllocHGlobal($bytes.Length)
      try {
        [Runtime.InteropServices.Marshal]::Copy($bytes, 0, $ptr, $bytes.Length)
        $escritos = 0
        if (-not [PdvRawPrinter]::WritePrinter($handle, $ptr, $bytes.Length, [ref]$escritos)) {
          throw 'Falha ao escrever na impressora.'
        }
        Start-Sleep -Milliseconds 250
      } finally {
        [Runtime.InteropServices.Marshal]::FreeHGlobal($ptr)
      }
      [void][PdvRawPrinter]::EndPagePrinter($handle)
    } finally {
      [void][PdvRawPrinter]::EndDocPrinter($handle)
    }
  } finally {
    [void][PdvRawPrinter]::ClosePrinter($handle)
  }
  Write-Output 'OK'
  exit 0
} catch {
  Write-Output ("FAIL:" + $_.Exception.Message)
  exit 1
}
`
