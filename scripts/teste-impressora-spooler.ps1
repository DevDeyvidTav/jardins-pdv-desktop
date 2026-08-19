param([string]$PrinterName = 'MP-4200 TH', [string]$FilePath)
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
  Write-Output "FAIL:open"
  exit 1
}
try {
  $info = New-Object PdvRawPrinter+DOCINFOA
  $info.pDocName = 'PDV Jardins'
  $info.pDataType = 'RAW'
  if ([PdvRawPrinter]::StartDocPrinter($handle, 1, $info) -eq 0) {
    Write-Output 'FAIL:startdoc'
    exit 1
  }
  try {
    [void][PdvRawPrinter]::StartPagePrinter($handle)
    $ptr = [Runtime.InteropServices.Marshal]::AllocHGlobal($bytes.Length)
    try {
      [Runtime.InteropServices.Marshal]::Copy($bytes, 0, $ptr, $bytes.Length)
      $escritos = 0
      if (-not [PdvRawPrinter]::WritePrinter($handle, $ptr, $bytes.Length, [ref]$escritos)) {
        Write-Output 'FAIL:write'
        exit 1
      }
      Start-Sleep -Milliseconds 2000
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
Start-Sleep -Milliseconds 500
$job = Get-PrintJob -PrinterName $PrinterName -ErrorAction SilentlyContinue | Select-Object -First 1
$printer = Get-Printer -Name $PrinterName -ErrorAction SilentlyContinue
if ($null -ne $job -and [string]$job.JobStatus -match 'Error|Offline|Blocked|PaperOut|Retained') {
  Write-Output "FAIL:job $($job.JobStatus)"
  exit 1
}
if ($null -ne $printer -and [string]$printer.PrinterStatus -eq 'Error') {
  Write-Output 'FAIL:printer Error'
  exit 1
}
Write-Output 'OK'
