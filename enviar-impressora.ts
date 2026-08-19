import { execFileSync } from 'node:child_process'
import { unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export type DestinoImpressao =
  | { tipo: 'SIMULADO' }
  | { tipo: 'SPOOLER'; nome: string }
  | { tipo: 'COM'; porta: string }

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

  if (env.PDV_IMPRESSORA_PORTA?.trim()) {
    return { tipo: 'COM', porta: env.PDV_IMPRESSORA_PORTA.trim() }
  }

  return { tipo: 'SPOOLER', nome: obterNomeImpressoraLocal(env) }
}

export function enviarBufferImpressora(
  buffer: Buffer,
  destino = resolverDestinoImpressao(),
): void {
  if (destino.tipo === 'SIMULADO') {
    return
  }

  if (destino.tipo === 'COM') {
    writeFileSync(`\\\\.\\${destino.porta}`, buffer)
    return
  }

  enviarViaSpoolerWindows(buffer, destino.nome)
}

function enviarViaSpoolerWindows(buffer: Buffer, nomeImpressora: string): void {
  const sufixo = `${process.pid}-${Date.now()}`
  const arquivo = join(tmpdir(), `pdv-escpos-${sufixo}.bin`)
  const script = join(tmpdir(), `pdv-escpos-${sufixo}.ps1`)
  writeFileSync(arquivo, buffer)
  writeFileSync(script, SCRIPT_SPOOLER_RAW, 'utf8')

  try {
    execFileSync(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        script,
        '-PrinterName',
        nomeImpressora,
        '-FilePath',
        arquivo,
      ],
      {
        timeout: 20_000,
        windowsHide: true,
      },
    )
  } catch (erro) {
    const detalhe = erro instanceof Error ? erro.message : String(erro)
    throw new Error(
      `Nao foi possivel enviar para a impressora ${nomeImpressora}. ${detalhe}`,
    )
  } finally {
    for (const caminho of [arquivo, script]) {
      try {
        unlinkSync(caminho)
      } catch {
        // arquivo temporario
      }
    }
  }
}

const SCRIPT_SPOOLER_RAW = `
param([string]$PrinterName, [string]$FilePath)
$ErrorActionPreference = 'Stop'
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
`
