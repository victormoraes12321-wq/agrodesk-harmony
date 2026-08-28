# ==============================================================================
# AgroDesk TI Harmony - Script de Backup Automatizado do PostgreSQL
# Empresa: Casa do Campo
# Retenção: 30 dias com expurgo automático
# ==============================================================================

$ErrorActionPreference = "Stop"

# Diretórios
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$RootDir = Resolve-Path (Join-Path $ScriptDir "..")
$BackupDir = Join-Path $RootDir "backups"
$LogFile = Join-Path $BackupDir "backup.log"
$EnvFile = Join-Path $RootDir "backend\.env"

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

function Write-Log {
    param([string]$Message)
    $Timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    $LogEntry = "[$Timestamp] $Message"
    Write-Host $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry
}

Write-Log "--------------------------------------------------------"
Write-Log "Iniciando rotina de backup do banco AgroDesk TI (Casa do Campo)..."

# 1. Localizar pg_dump.exe
$PgDumpCandidates = @(
    "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe",
    "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe",
    "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe",
    "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe",
    "C:\Program Files\PostgreSQL\14\bin\pg_dump.exe"
)

$PgDumpPath = $null
foreach ($Candidate in $PgDumpCandidates) {
    if (Test-Path $Candidate) {
        $PgDumpPath = $Candidate
        break
    }
}

if (-not $PgDumpPath) {
    try {
        $Cmd = Get-Command "pg_dump" -ErrorAction SilentlyContinue
        if ($Cmd) {
            $PgDumpPath = $Cmd.Source
        }
    } catch {}
}

if (-not $PgDumpPath) {
    Write-Log "[ERRO CRÍTICO] pg_dump.exe não foi localizado no sistema. Verifique a instalação do PostgreSQL."
    exit 1
}

Write-Log "Utilitário de dump localizado: $PgDumpPath"

# 2. Extrair credenciais do backend/.env
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

Write-Log "Conectando ao banco $DbName em ${DbHost}:${DbPort} com usuário $DbUser..."

# 3. Executar o Backup
$TimestampFile = (Get-Date).ToString("yyyy-MM-dd_HHmmss")
$BackupFileName = "agrodesk_ti_backup_$TimestampFile.dump"
$BackupFilePath = Join-Path $BackupDir $BackupFileName

$env:PGPASSWORD = $DbPass

try {
    & "$PgDumpPath" -h $DbHost -p $DbPort -U $DbUser -d $DbName -F c -b -f "$BackupFilePath" 2>&1 | Out-Null
    
    if (Test-Path $BackupFilePath) {
        $FileSizeMB = [math]::Round(((Get-Item $BackupFilePath).Length / 1MB), 2)
        Write-Log "[SUCESSO] Backup gerado com sucesso: $BackupFileName ($FileSizeMB MB)"
    } else {
        throw "Arquivo de backup não foi criado."
    }
} catch {
    Write-Log "[ERRO] Falha ao executar pg_dump: $_"
    exit 1
} finally {
    $env:PGPASSWORD = $null
}

# 4. Expurgo de Backups Antigos (> 30 Dias)
Write-Log "Verificando retenção de backups (limite: 30 dias)..."
$CutoffDate = (Get-Date).AddDays(-30)
$OldBackups = Get-ChildItem -Path $BackupDir -Filter "agrodesk_ti_backup_*.dump" | Where-Object { $_.LastWriteTime -lt $CutoffDate }

$PurgedCount = 0
foreach ($Old in $OldBackups) {
    Remove-Item $Old.FullName -Force
    $PurgedCount++
    Write-Log "Backup expirado removido: $($Old.Name)"
}

if ($PurgedCount -gt 0) {
    Write-Log "Total de $PurgedCount backup(s) antigo(s) expurgado(s)."
} else {
    Write-Log "Nenhum backup antigo para expurgar. Retenção em dia."
}

Write-Log "Rotina de backup concluída com sucesso!"
Write-Log "--------------------------------------------------------"
