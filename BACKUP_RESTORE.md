# BACKUP_RESTORE.md

Procedimentos de backup e restauracao do PostgreSQL do AgroDesk TI.

## 1. Backup manual

Criar pasta de backup:

```powershell
mkdir C:\AgroDesk\backups
```

Gerar arquivo `.backup`:

```powershell
pg_dump -h localhost -p 5432 -U postgres -d agrodesk_ti -F c -f C:\AgroDesk\backups\agrodesk_ti_%date:~6,4%-%date:~3,2%-%date:~0,2%.backup
```

Observacao:

- O comando usa o formato custom (`-F c`), ideal para `pg_restore`.

## 2. Backup com script `.bat`

Crie `C:\AgroDesk\scripts\backup_agrodesk.bat`:

```bat
@echo off
set PGHOST=localhost
set PGPORT=5432
set PGUSER=postgres
set PGDATABASE=agrodesk_ti
set BACKUP_DIR=C:\AgroDesk\backups
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm"') do set TS=%%i
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
pg_dump -F c -f "%BACKUP_DIR%\agrodesk_ti_%TS%.backup"
```

Agendar no Windows Task Scheduler:

- Frequencia recomendada: diario 23:00
- Retencao recomendada: 30 dias

## 3. Restaurar backup

Parar aplicacao antes de restaurar:

```powershell
pm2 stop all
```

Opcao A:

- Restaurar no mesmo banco, recriando objetos:

```powershell
pg_restore -h localhost -p 5432 -U postgres -d agrodesk_ti --clean --if-exists C:\AgroDesk\backups\agrodesk_ti_2026-05-28_23-00.backup
```

Opcao B:

- Restaurar em novo banco para validacao:

```powershell
createdb -h localhost -p 5432 -U postgres agrodesk_ti_restore
pg_restore -h localhost -p 5432 -U postgres -d agrodesk_ti_restore C:\AgroDesk\backups\agrodesk_ti_2026-05-28_23-00.backup
```

## 4. Pos-restauracao

1. Validar tabelas principais.
2. Validar login no sistema.
3. Subir servicos novamente.

```powershell
pm2 start ecosystem.config.cjs
pm2 save
```

## 5. Boas praticas

- Manter copia dos backups em disco secundario ou NAS interno.
- Testar restauracao pelo menos 1 vez por mes.
- Registrar responsavel e horario de cada restore em planilha de operacao.
- Nao sobrescrever o ultimo backup valido antes de testar o novo.
