# Mede o tempo do caminho rapido de envio serial usado pelo PDV.
# Uso: powershell -ExecutionPolicy Bypass -File scripts/medir-envio-com.ps1 -PortName COM10
param([string]$PortName = 'COM10')

$ErrorActionPreference = 'Stop'
$bytes = [Text.Encoding]::GetEncoding('latin1').GetBytes("`n`n")

$relogio = [Diagnostics.Stopwatch]::StartNew()
$port = New-Object System.IO.Ports.SerialPort $PortName, 115200, 'None', 8, 'One'
$port.Handshake = [System.IO.Ports.Handshake]::None
$port.WriteTimeout = 8000
$port.Open()
try {
  $port.Write($bytes, 0, $bytes.Length)
  $drenagem = [Diagnostics.Stopwatch]::StartNew()
  while ($port.BytesToWrite -gt 0 -and $drenagem.ElapsedMilliseconds -lt 8000) {
    Start-Sleep -Milliseconds 20
  }
} finally {
  if ($port.IsOpen) { $port.Close() }
  $port.Dispose()
}

Write-Output ("OK em " + $relogio.ElapsedMilliseconds + " ms")
