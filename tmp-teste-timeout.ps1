$ErrorActionPreference = 'Stop'
$src = @'
using System;
using System.Runtime.InteropServices;
public class PdvComT2 {
  [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
  public static extern IntPtr CreateFile(string name, uint acc, uint share, IntPtr sec, uint disp, uint flags, IntPtr tmpl);
  [DllImport("kernel32.dll", SetLastError = true)]
  public static extern bool WriteFile(IntPtr h, byte[] buf, int count, out int written, IntPtr overlapped);
  [DllImport("kernel32.dll", SetLastError = true)]
  public static extern bool CloseHandle(IntPtr h);
  [DllImport("kernel32.dll", SetLastError = true)]
  public static extern bool EscapeCommFunction(IntPtr h, uint fn);
  [StructLayout(LayoutKind.Sequential)]
  public struct COMMTIMEOUTS {
    public uint ReadIntervalTimeout;
    public uint ReadTotalTimeoutMultiplier;
    public uint ReadTotalTimeoutConstant;
    public uint WriteTotalTimeoutMultiplier;
    public uint WriteTotalTimeoutConstant;
  }
  [DllImport("kernel32.dll", SetLastError = true)]
  public static extern bool SetCommTimeouts(IntPtr h, ref COMMTIMEOUTS t);
  public static IntPtr OpenCom(string port) {
    string path = new string((char)92, 2) + "." + (char)92 + port;
    return CreateFile(path, 1073741824, 0, IntPtr.Zero, 3, 0, IntPtr.Zero);
  }
  public static void AplicarTimeoutEscrita(IntPtr h) {
    COMMTIMEOUTS t = new COMMTIMEOUTS();
    t.ReadIntervalTimeout = 0;
    t.ReadTotalTimeoutMultiplier = 0;
    t.ReadTotalTimeoutConstant = 0;
    t.WriteTotalTimeoutMultiplier = 5;
    t.WriteTotalTimeoutConstant = 8000;
    SetCommTimeouts(h, ref t);
  }
}
'@
Add-Type -TypeDefinition $src

for ($i = 1; $i -le 2; $i++) {
  $h = [PdvComT2]::OpenCom('COM11')
  if ($h -eq [IntPtr]::Zero -or $h -eq [IntPtr]::new(-1)) {
    Write-Output ("TENTATIVA ${i}: ABERTURA FALHOU win32=" + [Runtime.InteropServices.Marshal]::GetLastWin32Error())
    exit 1
  }
  [PdvComT2]::AplicarTimeoutEscrita($h)
  [void][PdvComT2]::EscapeCommFunction($h, 5)
  [void][PdvComT2]::EscapeCommFunction($h, 3)
  Start-Sleep -Milliseconds 400

  $linhas = "JARDINS TESTE TIMEOUT $i`n"
  for ($l = 0; $l -lt 40; $l++) {
    $linhas += "Item de teste ${l} x1 .................... R$ 10,00`n"
  }
  $linhas += "`n`n`n"
  $bytes = [byte[]](0x1b, 0x40) + [Text.Encoding]::ASCII.GetBytes($linhas) + [byte[]](0x1b, 0x69)

  $w = 0
  $inicio = Get-Date
  $ok = [PdvComT2]::WriteFile($h, $bytes, $bytes.Length, [ref]$w, [IntPtr]::Zero)
  $duracao = [int]((Get-Date) - $inicio).TotalMilliseconds
  $erro = [Runtime.InteropServices.Marshal]::GetLastWin32Error()
  Write-Output ("TENTATIVA ${i}: ok=" + $ok + " bytes=" + $w + "/" + $bytes.Length + " win32=" + $erro + " duracaoMs=" + $duracao)
  Start-Sleep -Milliseconds 400
  [void][PdvComT2]::CloseHandle($h)
  Start-Sleep -Seconds 2
}
