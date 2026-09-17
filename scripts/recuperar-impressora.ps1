# Recupera a MP-4200 TH quando a fila do Windows trava com job "Retained".
# Execute no PowerShell como Administrador.
#
#   powershell -ExecutionPolicy Bypass -File apps/desktop/scripts/recuperar-impressora.ps1

param(
  [string]$PrinterName = 'MP-4200 TH'
)

$ErrorActionPreference = 'Continue'

function Mostrar-Estado {
  param([string]$Titulo)
  Write-Host ''
  Write-Host "=== $Titulo ===" -ForegroundColor Cyan
  Get-Printer -Name $PrinterName -ErrorAction SilentlyContinue |
    Select-Object Name, PortName, PrinterStatus, JobCount | Format-Table -AutoSize
  Get-PrintJob -PrinterName $PrinterName -ErrorAction SilentlyContinue |
    Select-Object Id, JobStatus, Size, SubmittedTime | Format-Table -AutoSize
}

$identidade = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($identidade)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Write-Host 'Este script precisa ser executado como Administrador.' -ForegroundColor Red
  Write-Host 'Clique com o botao direito no PowerShell e escolha "Executar como administrador".'
  exit 1
}

Mostrar-Estado 'Antes'

Write-Host ''
Write-Host 'Removendo jobs da fila ...' -ForegroundColor Yellow
Get-PrintJob -PrinterName $PrinterName -ErrorAction SilentlyContinue | ForEach-Object {
  Remove-PrintJob -PrinterName $PrinterName -ID $_.Id -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 2

$restantes = @(Get-PrintJob -PrinterName $PrinterName -ErrorAction SilentlyContinue)
if ($restantes.Count -gt 0) {
  Write-Host 'Job preso: reiniciando o Spooler de Impressao ...' -ForegroundColor Yellow
  Stop-Service -Name Spooler -Force
  Start-Sleep -Seconds 2

  $spool = Join-Path $env:SystemRoot 'System32\spool\PRINTERS'
  Get-ChildItem -Path $spool -File -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-Item -Path $_.FullName -Force -ErrorAction SilentlyContinue
  }

  Start-Service -Name Spooler
  Start-Sleep -Seconds 3
}

Write-Host 'Retomando a impressora ...' -ForegroundColor Yellow
$nomeEscapado = $PrinterName.Replace("'", "''")
$printer = Get-CimInstance Win32_Printer -Filter "Name='$nomeEscapado'" -ErrorAction SilentlyContinue
if ($null -ne $printer) {
  [void](Invoke-CimMethod -InputObject $printer -MethodName Resume -ErrorAction SilentlyContinue)
}

Mostrar-Estado 'Depois'

$final = Get-Printer -Name $PrinterName -ErrorAction SilentlyContinue
if ($null -ne $final -and $final.JobCount -eq 0) {
  Write-Host ''
  Write-Host 'Fila limpa. Abra o PDV e use Configuracoes -> Impressoras -> Testar.' -ForegroundColor Green
} else {
  Write-Host ''
  Write-Host 'Ainda ha job na fila. Desligue a impressora pelo botao de tras,' -ForegroundColor Red
  Write-Host 'aguarde 5 segundos, ligue de novo e rode este script outra vez.' -ForegroundColor Red
}
