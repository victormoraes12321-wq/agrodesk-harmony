# ==============================================================================
# AgroDesk TI Harmony - Script de Restauração do Banco PostgreSQL
# Empresa: Casa do Campo
# ==============================================================================

param(
    [string]$BackupFile
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$RootDir = Resolve-Path (Join-Path $ScriptDir "..")
$BackupDir = Join-Path $RootDir "backups"
$EnvFile = Join-Path $RootDir "backend\.env"

# 1. Localizar pg_restore.exe
$PgRestoreCandidates = @(
    "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe",
    "C:\Program Files\PostgreSQL\17\bin\pg_restore.exe",
    "C:\Program Files\PostgreSQL\16\bin\pg_restore.exe",
    "C:\Program Files\PostgreSQL\15\bin\pg_restore.exe",
    "C:\Program Files\PostgreSQL\14\bin\pg_restore.exe"
)

$PgRestorePath = $null
foreach ($Candidate in $PgRestoreCandidates) {
    if (Test-Path $Candidate) {
        $PgRestorePath = $Candidate
        break
    }
}

if (-not $PgRestorePath) {
    try {
        $Cmd = Get-Command "pg_restore" -ErrorAction SilentlyContinue
        if ($Cmd) {
            $PgRestorePath = $Cmd.Source
        }
    } catch {}
}

if (-not $PgRestorePath) {
    Write-Host "[ERRO] pg_restore.exe não localizado no sistema." -ForegroundColor Red
    exit 1
}

# 2. Obter arquivo de backup se não informado
if (-not $BackupFile) {
    $Latest = Get-ChildItem -Path $BackupDir -Filter "agrodesk_ti_backup_*.dump" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $Latest) {
        Write-Host "Nenhum arquivo de backup encontrado na pasta backups." -ForegroundColor Yellow
        exit 1
    }
    $BackupFile = $Latest.FullName
    Write-Host "Utilizando o backup mais recente: $($Latest.Name)" -ForegroundColor Cyan
}

if (-not (Test-Path $BackupFile)) {
    Write-Host "[ERRO] Arquivo de backup não encontrado: $BackupFile" -ForegroundColor Red
    exit 1
}

# 3. Credenciais
$DbUser = "postgres"
$DbPass = "H0llyw00d26"
$DbHost = "localhost"
$DbPort = "5432"
$DbName = "agrodesk_ti"

if (Test-Path $EnvFile) {
    $EnvContent = Get-Content $EnvFile
    foreach ($Line in $EnvContent) {
        if ($Line -match '^DATABASE_URL\s*=\s*"postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)') {
            $DbUser = $Matches[1]
            $DbPass = $Matches[2]
            $DbHost = $Matches[3]
            $DbPort = $Matches[4]
            $DbName = $Matches[5]
            break
        }
    }
}

Write-Host "ATENÇÃO: A restauração irá sobrescrever os dados atuais do banco '$DbName' em ${DbHost}:${DbPort}." -ForegroundColor Yellow
$Confirm = Read-Host "Deseja prosseguir com a restauração? (S/N)"
if ($Confirm -ne "S" -and $Confirm -ne "s") {
    Write-Host "Operação cancelada pelo usuário." -ForegroundColor Gray
    exit 0
}

$env:PGPASSWORD = $DbPass
try {
    Write-Host "Restaurando banco de dados a partir de $BackupFile..." -ForegroundColor Cyan
    & "$PgRestorePath" -h $DbHost -p $DbPort -U $DbUser -d $DbName -c -v "$BackupFile"
    Write-Host "Restauração concluída com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "Erro durante a restauração: $_" -ForegroundColor Red
} finally {
    $env:PGPASSWORD = $null
}
