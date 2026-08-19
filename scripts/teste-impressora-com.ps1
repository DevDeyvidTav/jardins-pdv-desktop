param([string]$Port = 'COM10', [string]$PrinterName = 'MP-4200 TH')
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class ComWriter {
  [DllImport("kernel32.dll", SetLastError=true, CharSet=CharSet.Auto)] public static extern IntPtr CreateFile(string lpFileName, uint dwDesiredAccess, uint dwShareMode, IntPtr lpSecurityAttributes, uint dwCreationDisposition, uint dwFlagsAndAttributes, IntPtr hTemplateFile);
  [DllImport("kernel32.dll", SetLastError=true)] public static extern bool WriteFile(IntPtr hFile, byte[] lpBuffer, uint nNumberOfBytesToWrite, out uint lpNumberOfBytesWritten, IntPtr lpOverlapped);
  [DllImport("kernel32.dll", SetLastError=true)] public static extern bool CloseHandle(IntPtr hObject);
  public static void Write(string port, byte[] data) {
    IntPtr h = CreateFile("\\\\.\\" + port, 0x40000000u, 0u, IntPtr.Zero, 3u, 0u, IntPtr.Zero);
    if (h.ToInt64() == -1) throw new Exception("CreateFile " + Marshal.GetLastWin32Error());
    try {
      uint w;
      if (!WriteFile(h, data, (uint)data.Length, out w, IntPtr.Zero)) throw new Exception("WriteFile " + Marshal.GetLastWin32Error());
      if (w != data.Length) throw new Exception("partial " + w + "/" + data.Length);
    } finally {
      CloseHandle(h);
    }
  }
}
"@
$bytes = [byte[]](0x1B,0x40) + [System.Text.Encoding]::ASCII.GetBytes("TESTE COM DIRETO PDV`n`n`n`n`n") + [byte[]](0x1B,0x69)
$nomeEscapado = $PrinterName.Replace("'", "''")
$printer = Get-CimInstance Win32_Printer -Filter "Name='$nomeEscapado'"
if ($null -ne $printer) {
  [void](Invoke-CimMethod -InputObject $printer -MethodName Pause)
  Get-PrintJob -PrinterName $PrinterName -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-PrintJob -PrinterName $PrinterName -ID $_.Id -ErrorAction SilentlyContinue
  }
  Start-Sleep -Milliseconds 500
}
try {
  [ComWriter]::Write($Port, $bytes)
  Start-Sleep -Milliseconds 1000
  Write-Output 'OK'
} finally {
  if ($null -ne $printer) {
    [void](Invoke-CimMethod -InputObject $printer -MethodName Resume)
  }
}
