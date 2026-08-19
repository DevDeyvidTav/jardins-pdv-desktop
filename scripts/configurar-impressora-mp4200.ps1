# Configura a MP-4200 TH para impressao RAW ESC/POS no PDV Jardins.
# Execute no PowerShell como Administrador.

$ErrorActionPreference = 'Stop'
$nomeImpressora = 'MP-4200 TH'
$porta = 'COM10:'

Write-Host "Configurando $nomeImpressora ..."

if (-not (Get-PrinterDriver -Name 'Generic / Text Only' -ErrorAction SilentlyContinue)) {
  Add-PrinterDriver -Name 'Generic / Text Only'
  Write-Host 'Driver Generic / Text Only instalado.'
}

if (-not (Get-PrinterPort -Name $porta -ErrorAction SilentlyContinue)) {
  Add-PrinterPort -Name $porta
}

$impressora = Get-Printer -Name $nomeImpressora -ErrorAction SilentlyContinue
if ($null -eq $impressora) {
  throw "Impressora '$nomeImpressora' nao encontrada."
}

Set-Printer -Name $nomeImpressora -DriverName 'Generic / Text Only' -PortName $porta
Set-PrintConfiguration -PrinterName $nomeImpressora -DuplexingMode OneSided

$nomeEscapado = $nomeImpressora.Replace("'", "''")
$printer = Get-CimInstance Win32_Printer -Filter "Name='$nomeEscapado'" -ErrorAction SilentlyContinue
if ($null -ne $printer) {
  [void](Invoke-CimMethod -InputObject $printer -MethodName Resume -ErrorAction SilentlyContinue)
}
Get-PrintJob -PrinterName $nomeImpressora -ErrorAction SilentlyContinue | ForEach-Object {
  Remove-PrintJob -PrinterName $nomeImpressora -ID $_.Id -ErrorAction SilentlyContinue
}
if ($null -ne $printer) {
  [void](Invoke-CimMethod -InputObject $printer -MethodName Resume -ErrorAction SilentlyContinue)
}

Get-Printer -Name $nomeImpressora | Format-List Name, DriverName, PortName, PrinterStatus, JobCount

Write-Host ''
Write-Host 'Proximo passo obrigatorio:'
Write-Host '1. Abra o Bema User em Downloads\\driver-bematech-mp-4200\\Software Gerenciamente e Configuracao'
Write-Host '2. Selecione Tipo de comando = ESC/POS e clique Aplicar'
Write-Host '3. Desligue e ligue a impressora'
Write-Host '4. Reinicie o PDV (npm run dev)'
