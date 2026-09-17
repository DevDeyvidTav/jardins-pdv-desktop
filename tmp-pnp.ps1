$dev = Get-PnpDevice -Class Ports | Where-Object { $_.FriendlyName -like '*MP-4200*' -and $_.Status -eq 'OK' } | Select-Object -First 1
if (-not $dev) {
  Write-Output 'DISPOSITIVO NAO ENCONTRADO'
  exit 1
}
Write-Output ('InstanceId: ' + $dev.InstanceId)
Write-Output ('Status: ' + $dev.Status)
try {
  Disable-PnpDevice -InstanceId $dev.InstanceId -Confirm:$false -ErrorAction Stop
  Write-Output 'Desabilitado, aguardando...'
  Start-Sleep -Seconds 3
  Enable-PnpDevice -InstanceId $dev.InstanceId -Confirm:$false -ErrorAction Stop
  Start-Sleep -Seconds 3
  Write-Output 'Reabilitado.'
  [System.IO.Ports.SerialPort]::GetPortNames() | ForEach-Object { Write-Output ('Porta: ' + $_) }
} catch {
  Write-Output ('FALHOU: ' + $_.Exception.Message)
  exit 1
}
