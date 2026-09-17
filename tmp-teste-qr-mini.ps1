$ErrorActionPreference = 'Stop'
$src = @'
using System;
using System.Runtime.InteropServices;
public class PdvMini {
  [DllImport("kernel32.dll", CharSet=CharSet.Auto, SetLastError=true)]
  public static extern IntPtr CreateFile(string n, uint a, uint s, IntPtr p, uint d, uint f, IntPtr t);
  [DllImport("kernel32.dll", SetLastError=true)]
  public static extern bool WriteFile(IntPtr h, byte[] b, int c, out int w, IntPtr o);
  [DllImport("kernel32.dll", SetLastError=true)]
  public static extern bool CloseHandle(IntPtr h);
  [DllImport("kernel32.dll", SetLastError=true)]
  public static extern bool EscapeCommFunction(IntPtr h, uint fn);
  public static IntPtr OpenCom(string port) {
    string path = new string((char)92, 2) + "." + (char)92 + port;
    return CreateFile(path, 1073741824, 0, IntPtr.Zero, 3, 0, IntPtr.Zero);
  }
}
'@
Add-Type -TypeDefinition $src

$h = [PdvMini]::OpenCom('COM11')
if ($h -eq [IntPtr]::Zero -or $h -eq [IntPtr]::new(-1)) {
  Write-Output ('ABERTURA FALHOU win32=' + [Runtime.InteropServices.Marshal]::GetLastWin32Error())
  exit 1
}
[void][PdvMini]::EscapeCommFunction($h, 5)
[void][PdvMini]::EscapeCommFunction($h, 3)
Start-Sleep -Milliseconds 400

$bytes = [IO.File]::ReadAllBytes('c:\Users\Deyvid\Desktop\jardins\apps\desktop\tmp-qr-mini.bin')
$w = 0
$ok = [PdvMini]::WriteFile($h, $bytes, $bytes.Length, [ref]$w, [IntPtr]::Zero)
Write-Output ('WRITE ok=' + $ok + ' written=' + $w + ' win32=' + [Runtime.InteropServices.Marshal]::GetLastWin32Error())
[void][PdvMini]::CloseHandle($h)
