param(
  [Parameter(Mandatory = $true)]
  [string]$SourceDatabaseUrl,

  [Parameter(Mandatory = $true)]
  [string]$TargetDatabaseUrl,

  [string]$BackupFile = "railway-backup.dump"
)

$ErrorActionPreference = "Stop"

function Require-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command '$Name' is not available in PATH."
  }
}

function Invoke-Checked {
  param(
    [string]$Step,
    [scriptblock]$Command
  )

  Write-Host $Step
  & $Command
  if ($LASTEXITCODE -ne 0) {
    throw "Step failed with exit code $LASTEXITCODE: $Step"
  }
}

Require-Command "pg_dump"
Require-Command "pg_restore"
Require-Command "psql"
Require-Command "python"

Invoke-Checked "[1/5] Creating backup from source database..." {
  pg_dump --format=custom --no-owner --no-privileges --dbname "$SourceDatabaseUrl" --file "$BackupFile"
}

if (-not (Test-Path $BackupFile) -or ((Get-Item $BackupFile).Length -eq 0)) {
  throw "Backup file '$BackupFile' was not created or is empty."
}

Invoke-Checked "[2/5] Applying backup into target database..." {
  pg_restore --clean --if-exists --no-owner --no-privileges --dbname "$TargetDatabaseUrl" "$BackupFile"
}

Write-Host "[3/5] Running Alembic migrations on target (idempotent)..."
$env:DATABASE_URL = $TargetDatabaseUrl
Push-Location "backend"
try {
  python -m alembic upgrade head
  if ($LASTEXITCODE -ne 0) {
    throw "Step failed with exit code $LASTEXITCODE: [3/5] Running Alembic migrations on target"
  }
}
finally {
  Pop-Location
}

$counts = @"
SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users
UNION ALL
SELECT 'goals', COUNT(*) FROM goals
UNION ALL
SELECT 'habits', COUNT(*) FROM habits
UNION ALL
SELECT 'habit_versions', COUNT(*) FROM habit_versions
UNION ALL
SELECT 'habit_completions', COUNT(*) FROM habit_completions
ORDER BY table_name;
"@

Invoke-Checked "[4/5] Collecting row counts for key tables on target..." {
  psql "$TargetDatabaseUrl" -c "$counts"
}

Write-Host "[5/5] Completed successfully."
Write-Host "Source backup file: $BackupFile"
Write-Host "Next: point backend DATABASE_URL at the target DB and run smoke tests."
