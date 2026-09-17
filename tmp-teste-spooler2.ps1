param([string]$PrinterName = 'MP-4200 TH')
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class PdvRawT2 {
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

$linhas = "JARDINS SPOOLER LIMPO`n"
for ($l = 0; $l -lt 5; $l++) {
  $linhas += "Item ${l} x1 ...................... R$ 10,00`n"
}
$linhas += "`n`n`n"
$bytes = [byte[]](0x1b, 0x40) + [Text.Encoding]::ASCII.GetBytes($linhas) + [byte[]](0x1b, 0x69)

$h = [IntPtr]::Zero
if (-not [PdvRawT2]::OpenPrinter($PrinterName, [ref]$h, [IntPtr]::Zero)) {
  Write-Output ('OpenPrinter falhou win32=' + [Runtime.InteropServices.Marshal]::GetLastWin32Error())
  exit 1
}
$di = New-Object PdvRawT2+DOCINFOA
$di.pDocName = 'PDV Teste Limpo'
$di.pDataType = 'RAW'
$doc = [PdvRawT2]::StartDocPrinter($h, 1, $di)
[void][PdvRawT2]::StartPagePrinter($h)
$ptr = [Runtime.InteropServices.Marshal]::AllocHGlobal($bytes.Length)
[Runtime.InteropServices.Marshal]::Copy($bytes, 0, $ptr, $bytes.Length)
$w = 0
$ok = [PdvRawT2]::WritePrinter($h, $ptr, $bytes.Length, [ref]$w)
[Runtime.InteropServices.Marshal]::FreeHGlobal($ptr)
[void][PdvRawT2]::EndPagePrinter($h)
[void][PdvRawT2]::EndDocPrinter($h)
[void][PdvRawT2]::ClosePrinter($h)
Write-Output ('WRITE ok=' + $ok + ' bytes=' + $w)
Start-Sleep -Seconds 4
$jobs = @(Get-PrintJob -PrinterName $PrinterName -ErrorAction SilentlyContinue)
Write-Output ('Jobs na fila depois de 4s: ' + $jobs.Count)
foreach ($j in $jobs) { Write-Output ('  Job ' + $j.Id + ': ' + $j.JobStatus) }
