# Desativa a economia de energia USB no PC do caixa.
# Evita que o Windows desligue a porta da MP-4200 quando ela fica ociosa,
# que e a causa mais comum de "a impressora sumiu" / job preso na fila.
#
# Execute no PowerShell como Administrador:
#   powershell -ExecutionPolicy Bypass -File apps/desktop/scripts/desativar-economia-energia-usb.ps1

$ErrorActionPreference = 'Continue'

$identidade = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($identidade)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Write-Host 'Este script precisa ser executado como Administrador.' -ForegroundColor Red
  Write-Host 'Clique com o botao direito no PowerShell e escolha "Executar como administrador".'
  exit 1
}

# --- 1. Suspensao seletiva USB no plano de energia -------------------------
$subgrupoUsb = '2a737441-1930-4402-8d77-b2bebba308a3'
$configSuspensao = '48e6b7a6-50f5-4782-a5d4-53bb8f07e226'

Write-Host 'Desativando suspensao seletiva USB no plano de energia ...' -ForegroundColor Yellow
powercfg /setacvalueindex SCHEME_CURRENT $subgrupoUsb $configSuspensao 0
powercfg /setdcvalueindex SCHEME_CURRENT $subgrupoUsb $configSuspensao 0
powercfg /setactive SCHEME_CURRENT

# --- 2. "Permitir desligar este dispositivo" nos hubs USB -----------------
Write-Host 'Desativando desligamento automatico dos hubs USB ...' -ForegroundColor Yellow

$ajustados = 0
Get-CimInstance -Namespace 'root\wmi' -ClassName MSPower_DeviceEnable -ErrorAction SilentlyContinue |
  ForEach-Object {
    if ($_.Enable -ne $false) {
      try {
        Set-CimInstance -InputObject $_ -Property @{ Enable = $false } -ErrorAction Stop
        $ajustados += 1
      } catch {
        # alguns dispositivos nao aceitam o ajuste por WMI
      }
    }
  }

Write-Host "Dispositivos ajustados: $ajustados"

# --- 3. Impressao direta (sem fila) na MP-4200 ----------------------------
$impressora = Get-Printer -Name 'MP-4200 TH' -ErrorAction SilentlyContinue
if ($null -ne $impressora) {
  Write-Host 'Configurando a MP-4200 TH para imprimir direto (sem enfileirar) ...' -ForegroundColor Yellow
  $nomeEscapado = $impressora.Name.Replace("'", "''")
  $wmiPrinter = Get-CimInstance Win32_Printer -Filter "Name='$nomeEscapado'" -ErrorAction SilentlyContinue
  if ($null -ne $wmiPrinter) {
    try {
      Set-CimInstance -InputObject $wmiPrinter -Property @{ Direct = $true } -ErrorAction Stop
    } catch {
      Write-Host 'Nao foi possivel marcar "Imprimir diretamente" por script.' -ForegroundColor DarkYellow
      Write-Host 'Faca manual: Impressoras -> MP-4200 TH -> Propriedades -> Avancado.'
    }
  }
}

# --- 4. Conferencia ------------------------------------------------------
Write-Host ''
Write-Host '=== Estado final ===' -ForegroundColor Cyan
powercfg /query SCHEME_CURRENT $subgrupoUsb $configSuspensao |
  Select-String -Pattern 'Atuais|Current'

Write-Host ''
Write-Host 'Pronto. Reinicie o PC para o ajuste dos hubs USB valer.' -ForegroundColor Green
