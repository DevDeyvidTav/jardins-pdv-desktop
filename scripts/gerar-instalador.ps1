# Gera o instalador Windows (.exe) do Jardins PDV.
# Requer: Node 22+, Python (node-gyp), Visual Studio Build Tools.

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot\..

Write-Host '==> Instalando dependencias...'
npm ci

Write-Host '==> Recompilando better-sqlite3 para Electron...'
npm run rebuild:native

Write-Host '==> Gerando instalador (NSIS)...'
npm run dist:win

Write-Host ''
Write-Host 'Pronto. Instalador em apps/desktop/dist/'
Get-ChildItem dist -Filter *.exe | ForEach-Object { Write-Host "  $($_.FullName)" }
