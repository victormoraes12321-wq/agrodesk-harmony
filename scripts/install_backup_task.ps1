# ==============================================================================
# AgroDesk TI Harmony - Instalação de Tarefa Agendada no Windows
# Registra o backup automático diário às 23:00
# ==============================================================================

$TaskName = "AgroDesk_TI_Daily_Backup"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$BackupScript = Join-Path $ScriptDir "backup_database.ps1"

Write-Host "Registrando Tarefa Agendada '$TaskName' no Windows..." -ForegroundColor Cyan

$Action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$BackupScript`""
$Trigger = New-ScheduledTaskTrigger -Daily -At "23:00"
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

try {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "Backup diário automatizado do PostgreSQL do AgroDesk TI (Casa do Campo)" | Out-Null
    Write-Host "[SUCESSO] Tarefa agendada com sucesso! O backup será executado todos os dias às 23:00." -ForegroundColor Green
    Write-Host "Você também pode executar o backup manualmente a qualquer momento executando: powershell -File scripts/backup_database.ps1" -ForegroundColor Cyan
} catch {
    Write-Host "[AVISO] Para registrar tarefas no Agendador do Windows, execute o PowerShell como Administrador se necessário: $_" -ForegroundColor Yellow
}
