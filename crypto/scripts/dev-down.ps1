<#
.SYNOPSIS
    Гасить локальний стек, піднятий через dev-up.ps1.

.DESCRIPTION
    Б'є по pid-ах із .dev-logs/services.json, а далі — контрольний прохід по портах
    з .env: dev-server міг бути піднятий руками, повз скрипт. Вбиваємо деревом
    (taskkill /T), бо кожен сервіс — це cmd.exe з node всередині.

.PARAMETER KeepMongo
    Не чіпати контейнер mongo (використовує dev-up.ps1 -Restart).

.PARAMETER Only
    Погасити лише вказані сервіси: mongo, api, bot, admin, web.
#>
[CmdletBinding()]
param(
    [ValidateSet('mongo', 'api', 'bot', 'admin', 'web')]
    [string[]]$Only,
    [switch]$KeepMongo
)

$ErrorActionPreference = 'Stop'
$root    = Split-Path -Parent $PSScriptRoot
$logDir  = Join-Path $root '.dev-logs'
$pidFile = Join-Path $logDir 'services.json'

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "    OK  $msg" -ForegroundColor Green }
function Write-Skip($msg) { Write-Host "    --  $msg" -ForegroundColor DarkGray }

function Test-Wanted($name) {
    if (-not $Only) { return $true }
    return ($Only -contains $name)
}

# PS 5.1 робить ErrorRecord з кожного stderr-рядка нативної команди, а з
# $ErrorActionPreference = 'Stop' це валить скрипт навіть при успішному exit code.
function Invoke-Native {
    param(
        [Parameter(Mandatory = $true)][string]$File,
        [string[]]$Arguments = @()
    )
    $prev = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        & $File @Arguments 2>&1 | Out-Null
        return $LASTEXITCODE
    } finally { $ErrorActionPreference = $prev }
}

function Stop-Tree($procId, $label) {
    if (-not (Get-Process -Id $procId -ErrorAction SilentlyContinue)) { return $false }
    Invoke-Native 'taskkill.exe' @('/PID', "$procId", '/T', '/F') | Out-Null
    Write-Ok "$label — прибито pid $procId"
    return $true
}

# порти беремо з .env, щоб не розходились із dev-up
$ports = @{}
foreach ($line in (Get-Content (Join-Path $root '.env') -Encoding UTF8)) {
    if ($line -match '^\s*(API_PORT|WEB_PORT|ADMIN_PORT|BOT_PORT)\s*=\s*(\d+)') {
        $ports[$Matches[1]] = [int]$Matches[2]
    }
}
$byName = @{
    api   = $ports['API_PORT']
    bot   = $ports['BOT_PORT']
    admin = $ports['ADMIN_PORT']
    web   = $ports['WEB_PORT']
}

Write-Step 'Гашу node-сервіси'

# 1) те, що ми самі стартували
if (Test-Path $pidFile) {
    # ConvertTo-Json у PS 5.1 уміє загорнути масив у {"value":[...]} — читаємо обидва формати.
    $parsed = Get-Content $pidFile -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($null -ne $parsed -and $parsed.PSObject.Properties.Name -contains 'value') { $saved = @($parsed.value) }
    else { $saved = @($parsed) }

    foreach ($s in $saved) {
        if (-not $s.name) { continue }
        if (-not (Test-Wanted $s.name)) { continue }
        Stop-Tree $s.pid $s.name | Out-Null
    }
    $kept = @($saved | Where-Object { $_.name -and -not (Test-Wanted $_.name) })
    if ($kept.Count -gt 0) { ConvertTo-Json -InputObject ([object[]]$kept) -Depth 4 | Out-File $pidFile -Encoding utf8 }
    else { Remove-Item $pidFile -Force }
}

# 2) контрольний прохід по портах — ловить процеси, підняті повз скрипт
foreach ($name in @('api', 'bot', 'admin', 'web')) {
    if (-not (Test-Wanted $name)) { continue }
    $port = $byName[$name]
    if (-not $port) { continue }

    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if (-not $conns) { Write-Skip "$name :$port вже вільний"; continue }

    foreach ($procId in ($conns.OwningProcess | Select-Object -Unique)) {
        Stop-Tree $procId "$name :$port" | Out-Null
    }
}

# 3) осиротілі cmd-обгортки: node уже вбито по порту, а cmd лишився і тримає лог
foreach ($proc in (Get-CimInstance Win32_Process -Filter "Name='cmd.exe'" -ErrorAction SilentlyContinue)) {
    if (-not $proc.CommandLine) { continue }
    if ($proc.CommandLine -notlike "*$logDir*") { continue }

    $match = $null
    foreach ($name in @('api', 'bot', 'admin', 'web')) {
        if ($proc.CommandLine -like "*\$name.log*") { $match = $name }
    }
    if ($match -and -not (Test-Wanted $match)) { continue }

    Stop-Tree $proc.ProcessId "cmd-обгортка$(if ($match) { " ($match)" })" | Out-Null
}

# 4) mongo
if (-not $KeepMongo -and (Test-Wanted 'mongo')) {
    Write-Step 'Гашу mongo'
    if ((Invoke-Native docker @('info')) -ne 0) {
        Write-Skip 'docker engine не запущений — нічого гасити'
    }
    else {
        Push-Location $root
        try {
            Invoke-Native docker @('compose', 'stop', 'mongo') | Out-Null
            Write-Ok 'контейнер mongo зупинено (дані в томі mongo-data лишились)'
        } finally { Pop-Location }
    }
}
elseif ($KeepMongo) { Write-Skip 'mongo лишаю піднятою (-KeepMongo)' }

Write-Host ''
