<#
.SYNOPSIS
    Піднімає весь локальний стек: Mongo в Docker + api / bot / admin / web у dev-режимі.

.DESCRIPTION
    Читає crypto/.env і віддає змінні кожному сервісу через оточення процесу.
    Це обов'язково: apps/api читає process.env.MONGO_URI у декораторі @Module,
    тобто ДО того, як ConfigModule встигне підвантажити .env з диска.

    MONGO_URI у .env написаний під docker-мережу (host = "mongo"). Для сервісів,
    які стартують тут, на хості, цей хост підмінюється на 127.0.0.1 — саме тому
    docker-compose публікує порт монги на loopback.

    Сервіс, чий порт уже зайнятий, пропускається (щоб не прибити вже піднятий
    dev-server apps/web). Перезапуск — через -Restart.

.PARAMETER Only
    Підняти лише вказані сервіси: mongo, api, bot, admin, web.

.PARAMETER Restart
    Спершу зупинити те, що вже слухає потрібні порти (через dev-down.ps1).

.PARAMETER SkipDocker
    Не чіпати Docker/Mongo взагалі.

.EXAMPLE
    .\scripts\dev-up.ps1
    .\scripts\dev-up.ps1 -Only admin,api -Restart
#>
[CmdletBinding()]
param(
    [ValidateSet('mongo', 'api', 'bot', 'admin', 'web')]
    [string[]]$Only,
    [switch]$Restart,
    [switch]$SkipDocker,
    [int]$DockerTimeoutSec = 240
)

$ErrorActionPreference = 'Stop'
$root    = Split-Path -Parent $PSScriptRoot
$logDir  = Join-Path $root '.dev-logs'
$pidFile = Join-Path $logDir 'services.json'

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "    OK  $msg" -ForegroundColor Green }
function Write-Skip($msg) { Write-Host "    --  $msg" -ForegroundColor DarkGray }
function Write-Note($msg) { Write-Host "    !!  $msg" -ForegroundColor Yellow }

# PowerShell 5.1 загортає кожен stderr-рядок нативної команди в ErrorRecord, а з
# $ErrorActionPreference = 'Stop' це валить скрипт навіть при exit code 0 (docker
# і npm пишуть у stderr звичайний прогрес). Тому всі зовнішні виклики — через це.
function Invoke-Native {
    param(
        [Parameter(Mandatory = $true)][string]$File,
        [string[]]$Arguments = @(),
        [switch]$Quiet
    )
    $prev = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        if ($Quiet) { & $File @Arguments 2>&1 | Out-Null }
        else        { & $File @Arguments 2>&1 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray } }
        return $LASTEXITCODE
    } finally { $ErrorActionPreference = $prev }
}

function Get-NativeOutput {
    param(
        [Parameter(Mandatory = $true)][string]$File,
        [string[]]$Arguments = @()
    )
    $prev = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try { return @(& $File @Arguments 2>$null) }
    finally { $ErrorActionPreference = $prev }
}

# ConvertTo-Json у PS 5.1 загортає масив, який прийшов пайпом, у {"value":[...],"Count":N}.
# Пишемо через -InputObject, а читаємо з урахуванням обох форматів — інакше
# dev-down.ps1 не знайде pid-ів і лишить cmd-обгортки живими (з ними — лок на лог).
function Write-ServiceState($path, $items) {
    ConvertTo-Json -InputObject ([object[]]$items) -Depth 4 | Out-File $path -Encoding utf8
}

function Read-ServiceState($path) {
    $parsed = Get-Content $path -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($null -ne $parsed -and $parsed.PSObject.Properties.Name -contains 'value') { return @($parsed.value) }
    return @($parsed)
}

function Read-DotEnv($path) {
    $map = @{}
    if (-not (Test-Path $path)) { throw ".env не знайдено: $path" }
    foreach ($line in (Get-Content $path -Encoding UTF8)) {
        $t = $line.Trim()
        if ($t -eq '' -or $t.StartsWith('#')) { continue }
        $i = $t.IndexOf('=')
        if ($i -lt 1) { continue }
        $k = $t.Substring(0, $i).Trim()
        $v = $t.Substring($i + 1).Trim()
        if ($v.Length -ge 2) {
            $q = $v.Substring(0, 1)
            if (($q -eq '"' -or $q -eq "'") -and $v.EndsWith($q)) {
                $v = $v.Substring(1, $v.Length - 2)
            }
        }
        $map[$k] = $v
    }
    return $map
}

function Test-PortBusy($port) {
    $c = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    return $null -ne $c
}

function Wait-Port($port, $timeoutSec, $label) {
    $deadline = (Get-Date).AddSeconds($timeoutSec)
    while ((Get-Date) -lt $deadline) {
        if (Test-PortBusy $port) { return $true }
        Start-Sleep -Milliseconds 700
    }
    Write-Note "$label не відповів на порту $port за $timeoutSec с — дивись лог"
    return $false
}

function Test-Wanted($name) {
    if (-not $Only) { return $true }
    return ($Only -contains $name)
}

# --- підготовка ---------------------------------------------------------
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }

$envMap = Read-DotEnv (Join-Path $root '.env')

$apiPort   = [int]$envMap['API_PORT']
$webPort   = [int]$envMap['WEB_PORT']
$adminPort = [int]$envMap['ADMIN_PORT']
$botPort   = [int]$envMap['BOT_PORT']

# docker-мережеві хости -> loopback, бо процеси йдуть на хості
$localMongoUri = $envMap['MONGO_URI'] -replace '@mongo:', '@127.0.0.1:'
$localApiUrl   = "http://127.0.0.1:$apiPort"

if ($Restart) {
    Write-Step 'Зупиняю попередній запуск'
    & (Join-Path $PSScriptRoot 'dev-down.ps1') -KeepMongo
}

# --- Mongo в Docker -----------------------------------------------------
if ((Test-Wanted 'mongo') -and -not $SkipDocker) {
    Write-Step 'Docker + Mongo'

    if ((Invoke-Native docker @('info') -Quiet) -ne 0) {
        $exe = 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
        if (-not (Test-Path $exe)) { throw "Docker Desktop не знайдено: $exe" }
        Write-Host '    docker engine лежить — стартую Docker Desktop...' -ForegroundColor DarkGray
        Start-Process $exe | Out-Null

        $deadline = (Get-Date).AddSeconds($DockerTimeoutSec)
        $up = $false
        while (-not $up -and (Get-Date) -lt $deadline) {
            Start-Sleep -Seconds 5
            $up = ((Invoke-Native docker @('info') -Quiet) -eq 0)
        }
        if (-not $up) { throw "docker engine не піднявся за $DockerTimeoutSec с" }
    }
    Write-Ok 'docker engine готовий'

    Push-Location $root
    try {
        if ((Invoke-Native docker @('compose', 'up', '-d', 'mongo')) -ne 0) {
            throw 'docker compose up -d mongo впав'
        }
    } finally { Pop-Location }

    if (Wait-Port 27017 90 'mongo') { Write-Ok 'mongo слухає 127.0.0.1:27017' }

    # У compose api/web/admin/bot мають restart: unless-stopped, тому Docker Desktop
    # піднімає їх сам при старті і вони забирають ті самі порти, що й dev-сервери.
    # У докері тримаємо ЛИШЕ базу — решту гасимо, аби порти дістались dev-режиму.
    $appContainers = @('api', 'web', 'admin', 'bot')
    Push-Location $root
    try {
        $running = @(Get-NativeOutput docker @('compose', 'ps', '--services', '--filter', 'status=running') |
            Where-Object { $appContainers -contains $_ })
        if ($running.Count -gt 0) {
            Write-Note "у докері крутяться апки: $($running -join ', ') — гашу, бо їх порти потрібні dev-серверам"
            Invoke-Native docker (@('compose', 'stop') + $running) -Quiet | Out-Null
            Write-Ok 'контейнери апок зупинено (у докері лишилась тільки mongo)'
        }
    } finally { Pop-Location }
}
elseif ($SkipDocker) { Write-Skip 'docker/mongo пропущено (-SkipDocker)' }

# --- prisma для бота (sqlite, локальний файл) ---------------------------
if (Test-Wanted 'bot') {
    # npm-workspaces піднімає .prisma у корінь монорепи, але при окремій установці
    # клієнт може лежати і всередині apps/bot — перевіряємо обидва місця.
    $prismaPaths = @(
        (Join-Path $root 'node_modules\.prisma\client'),
        (Join-Path $root 'apps\bot\node_modules\.prisma\client')
    )
    $hasClient = $false
    foreach ($p in $prismaPaths) { if (Test-Path $p) { $hasClient = $true } }

    if (-not $hasClient) {
        Write-Step 'prisma generate (apps/bot)'
        Push-Location $root
        try {
            if ((Invoke-Native 'npm.cmd' @('run', 'prisma:generate', '--workspace', 'apps/bot')) -ne 0) {
                # Найчастіша причина — EPERM на query_engine.dll, бо бот уже запущений
                # і тримає файл. Це не привід не піднімати стек.
                Write-Note 'prisma generate не пройшов — стартую бота на тому клієнті, що є'
            }
            else { Write-Ok 'prisma client згенеровано' }
        } finally { Pop-Location }
    }
    else { Write-Skip 'prisma client на місці' }
}

# --- запуск сервісів ----------------------------------------------------
$services = @(
    @{ name = 'api';   port = $apiPort;   cmd = 'npm run start:dev --workspace apps/api'; env = @{ PORT = "$apiPort"; MONGO_URI = $localMongoUri } }
    @{ name = 'bot';   port = $botPort;   cmd = 'npm run start:dev --workspace apps/bot'; env = @{ PORT = "$botPort" } }
    @{ name = 'admin'; port = $adminPort; cmd = 'npm run dev --workspace apps/admin';     env = @{ PORT = "$adminPort"; NEXT_PUBLIC_API_URL = $localApiUrl; NEXT_PUBLIC_BOT_API_URL = "http://127.0.0.1:$botPort" } }
    @{ name = 'web';   port = $webPort;   cmd = 'npm run dev --workspace apps/web';       env = @{ PORT = "$webPort"; API_INTERNAL_URL = $localApiUrl } }
)

$started = @()
if (Test-Path $pidFile) {
    $started = @(Read-ServiceState $pidFile)
}

foreach ($svc in $services) {
    if (-not (Test-Wanted $svc.name)) { continue }

    Write-Step "$($svc.name) :$($svc.port)"

    if (Test-PortBusy $svc.port) {
        Write-Skip "порт $($svc.port) вже зайнятий — лишаю як є (перезапуск: -Restart)"
        continue
    }

    # .env + точкові оверрайди віддаємо процесу через оточення цієї сесії:
    # дочірній cmd.exe успадкує їх, а ми одразу відкотимо назад.
    $applied = New-Object System.Collections.Generic.List[string]
    foreach ($k in $envMap.Keys)  { $applied.Add($k) }
    foreach ($k in $svc.env.Keys) { if (-not $applied.Contains($k)) { $applied.Add($k) } }

    $backup = @{}
    foreach ($k in $applied) {
        $backup[$k] = [Environment]::GetEnvironmentVariable($k, 'Process')
        $val = $envMap[$k]
        if ($svc.env.ContainsKey($k)) { $val = $svc.env[$k] }
        [Environment]::SetEnvironmentVariable($k, $val, 'Process')
    }

    $log = Join-Path $logDir "$($svc.name).log"

    # Шапку в лог пише сам cmd: PowerShell не повинен тримати цей файл відкритим,
    # інакше наступний запуск впаде на локу від ще живої обгортки попереднього.
    $stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $line  = "cd /d ""$root"" && echo ===== $stamp :: $($svc.cmd) ===== >> ""$log"" && $($svc.cmd) >> ""$log"" 2>&1"

    try {
        $proc = Start-Process -FilePath 'cmd.exe' `
            -ArgumentList '/d', '/c', $line `
            -WindowStyle Hidden -PassThru
    } finally {
        foreach ($k in $applied) { [Environment]::SetEnvironmentVariable($k, $backup[$k], 'Process') }
    }

    $started = @($started | Where-Object { $_.name -ne $svc.name })
    $started += [pscustomobject]@{ name = $svc.name; pid = $proc.Id; port = $svc.port; log = $log }
    Write-Ok "запущено (pid $($proc.Id)), лог: .dev-logs\$($svc.name).log"
}

Write-ServiceState $pidFile $started

# --- чекаємо порти ------------------------------------------------------
Write-Step 'Чекаю, доки сервіси піднімуться'
foreach ($svc in $services) {
    if (-not (Test-Wanted $svc.name)) { continue }
    if (Wait-Port $svc.port 150 $svc.name) { Write-Ok "$($svc.name) слухає :$($svc.port)" }
}

Write-Host "`nСтек піднято:" -ForegroundColor Cyan
Write-Host "  лендінг   http://localhost:$webPort"
Write-Host "  адмінка   http://localhost:$adminPort"
Write-Host "  api       http://localhost:$apiPort/api"
Write-Host "  bot api   http://localhost:$botPort"
Write-Host "  mongo     127.0.0.1:27017 (docker)"
Write-Host ""
Write-Host "  логи:     Get-Content .dev-logs\admin.log -Wait -Tail 40"
Write-Host "  стоп:     .\scripts\dev-down.ps1"
Write-Host ""
