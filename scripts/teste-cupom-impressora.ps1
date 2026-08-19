# Envia cupom ESC/POS de teste via COM direto ou spooler RAW.
param(
  [ValidateSet('COM', 'SPOOLER')]
  [string]$Modo = 'COM',
  [string]$PortName = 'COM10',
  [string]$PrinterName = 'MP-4200 TH'
)

$ErrorActionPreference = 'Stop'
$texto = "TESTE PDV`n`n"
$bytes = [byte[]]@(0x1B, 0x40) + [Text.Encoding]::GetEncoding('latin1').GetBytes($texto) + [byte[]]@(0x1B, 0x69)

if ($Modo -eq 'COM') {
  $port = New-Object System.IO.Ports.SerialPort $PortName, 115200, 'None', 8, 'One'
  $port.Handshake = [System.IO.Ports.Handshake]::None
  $port.WriteTimeout = 8000
  $port.Open()
  try {
    $port.Write($bytes, 0, $bytes.Length)
    Start-Sleep -Milliseconds 500
    Write-Output "COM OK ($($bytes.Length) bytes)"
  } finally {
    if ($port.IsOpen) { $port.Close() }
    $port.Dispose()
  }
  exit 0
}

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

$handle = [IntPtr]::Zero
if (-not [PdvRawPrinter]::OpenPrinter($PrinterName, [ref]$handle, [IntPtr]::Zero)) {
  throw "Impressora nao encontrada: $PrinterName"
}
try {
  $info = New-Object PdvRawPrinter+DOCINFOA
  $info.pDocName = 'PDV Teste'
  $info.pDataType = 'RAW'
  [void][PdvRawPrinter]::StartDocPrinter($handle, 1, $info)
  try {
    [void][PdvRawPrinter]::StartPagePrinter($handle)
    $ptr = [Runtime.InteropServices.Marshal]::AllocHGlobal($bytes.Length)
    try {
      [Runtime.InteropServices.Marshal]::Copy($bytes, 0, $ptr, $bytes.Length)
      $escritos = 0
      [void][PdvRawPrinter]::WritePrinter($handle, $ptr, $bytes.Length, [ref]$escritos)
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

Write-Output "SPOOLER OK ($($bytes.Length) bytes)"
