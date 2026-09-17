$ErrorActionPreference = 'Stop'
$src = @'
using System;
using System.Runtime.InteropServices;
public class PdvComT3 {
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
    t.WriteTotalTimeoutMultiplier = 5;
    t.WriteTotalTimeoutConstant = 8000;
    SetCommTimeouts(h, ref t);
  }
}
'@
Add-Type -TypeDefinition $src

function Montar-Cupom([string]$titulo) {
  $linhas = "$titulo`n"
  for ($l = 0; $l -lt 10; $l++) {
    $linhas += "Item ${l} x1 ...................... R$ 10,00`n"
  }
  $linhas += "`n`n`n"
  return ,([byte[]](0x1b, 0x40) + [Text.Encoding]::ASCII.GetBytes($linhas) + [byte[]](0x1b, 0x69))
}

$h = [PdvComT3]::OpenCom('COM11')
if ($h -eq [IntPtr]::Zero -or $h -eq [IntPtr]::new(-1)) {
  Write-Output ('ABERTURA FALHOU win32=' + [Runtime.InteropServices.Marshal]::GetLastWin32Error())
  exit 1
}
[PdvComT3]::AplicarTimeoutEscrita($h)
[void][PdvComT3]::EscapeCommFunction($h, 5)
[void][PdvComT3]::EscapeCommFunction($h, 3)
Start-Sleep -Milliseconds 400

# Dois writes na MESMA conexao, 3s de intervalo
for ($i = 1; $i -le 2; $i++) {
  $bytes = Montar-Cupom("JARDINS MESMA SESSAO $i")
  $w = 0
  $inicio = Get-Date
  $ok = [PdvComT3]::WriteFile($h, $bytes, $bytes.Length, [ref]$w, [IntPtr]::Zero)
  $duracao = [int]((Get-Date) - $inicio).TotalMilliseconds
  $erro = [Runtime.InteropServices.Marshal]::GetLastWin32Error()
  Write-Output ("WRITE ${i}: ok=" + $ok + " bytes=" + $w + " win32=" + $erro + " duracaoMs=" + $duracao)
  Start-Sleep -Seconds 3
}

[void][PdvComT3]::CloseHandle($h)
Write-Output 'FECHOU'

# Reabre e tenta de novo
Start-Sleep -Seconds 2
$h2 = [PdvComT3]::OpenCom('COM11')
if ($h2 -eq [IntPtr]::Zero -or $h2 -eq [IntPtr]::new(-1)) {
  Write-Output ('REABERTURA FALHOU win32=' + [Runtime.InteropServices.Marshal]::GetLastWin32Error())
  exit 1
}
[PdvComT3]::AplicarTimeoutEscrita($h2)
[void][PdvComT3]::EscapeCommFunction($h2, 5)
[void][PdvComT3]::EscapeCommFunction($h2, 3)
Start-Sleep -Milliseconds 400
$bytes = Montar-Cupom('JARDINS REABERTA')
$w = 0
$inicio = Get-Date
$ok = [PdvComT3]::WriteFile($h2, $bytes, $bytes.Length, [ref]$w, [IntPtr]::Zero)
$duracao = [int]((Get-Date) - $inicio).TotalMilliseconds
Write-Output ("WRITE REABERTA: ok=" + $ok + " bytes=" + $w + " win32=" + [Runtime.InteropServices.Marshal]::GetLastWin32Error() + " duracaoMs=" + $duracao)
[void][PdvComT3]::CloseHandle($h2)
