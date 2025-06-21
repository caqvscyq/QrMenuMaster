# QR Menu Master - Server Startup Script
# This script helps you choose which server to run and prevents conflicts

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("unified", "admin", "client", "help")]
    [string]$Server = "help"
)

function Show-Help {
    Write-Host "🍽️  QR Menu Master - Server Startup Script" -ForegroundColor Cyan
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\start-server.ps1 -Server <option>" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Green
    Write-Host "  unified  - Start unified-server (RECOMMENDED)" -ForegroundColor White
    Write-Host "             Port: 5000" -ForegroundColor Gray
    Write-Host "             Features: Complete API, Admin UI, Customer UI" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  admin    - Start Admin_databoard (DEVELOPMENT ONLY)" -ForegroundColor White
    Write-Host "             Port: 5173" -ForegroundColor Gray
    Write-Host "             Features: Alternative admin interface" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  client   - Start Client_QR (DEVELOPMENT ONLY)" -ForegroundColor White
    Write-Host "             Port: 5174" -ForegroundColor Gray
    Write-Host "             Features: Alternative customer interface" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Green
    Write-Host "  .\start-server.ps1 -Server unified" -ForegroundColor Yellow
    Write-Host "  .\start-server.ps1 -Server admin" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "⚠️  WARNING: Only run ONE server at a time to avoid conflicts!" -ForegroundColor Red
}

function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

function Stop-ExistingServers {
    Write-Host "🔍 Checking for existing servers..." -ForegroundColor Yellow
    
    $ports = @(5000, 5173, 5174, 3000, 3001)
    $foundServers = @()
    
    foreach ($port in $ports) {
        if (Test-Port $port) {
            $foundServers += $port
        }
    }
    
    if ($foundServers.Count -gt 0) {
        Write-Host "⚠️  Found servers running on ports: $($foundServers -join ', ')" -ForegroundColor Red
        Write-Host "Please stop them manually before starting a new server." -ForegroundColor Red
        Write-Host "Use Ctrl+C in their terminal windows or Task Manager." -ForegroundColor Red
        return $false
    }
    
    Write-Host "✅ No conflicting servers found." -ForegroundColor Green
    return $true
}

function Start-UnifiedServer {
    Write-Host "🚀 Starting unified-server..." -ForegroundColor Green
    Write-Host "Port: 5000" -ForegroundColor Gray
    Write-Host "Admin UI: http://localhost:5000/admin/" -ForegroundColor Gray
    Write-Host "Customer UI: http://localhost:5000/?table=A1" -ForegroundColor Gray
    Write-Host ""

    if (-not (Stop-ExistingServers)) {
        return
    }

    Set-Location "unified-server"
    npm start
}

function Start-AdminDataboard {
    Write-Host "🚀 Starting Admin_databoard..." -ForegroundColor Green
    Write-Host "Port: 5173 (Vite dev server)" -ForegroundColor Gray
    Write-Host "Admin UI: http://localhost:5173" -ForegroundColor Gray
    Write-Host ""
    Write-Host "⚠️  WARNING: Admin_databoard has been archived!" -ForegroundColor Red
    Write-Host "⚠️  It is now located in _archive/Admin_databoard" -ForegroundColor Red
    Write-Host "⚠️  Use the unified-server instead for admin functionality" -ForegroundColor Red
    Write-Host ""

    if (-not (Stop-ExistingServers)) {
        return
    }

    Set-Location "_archive\Admin_databoard"
    npm run dev
}

function Start-ClientQR {
    Write-Host "🚀 Client_QR has been archived!" -ForegroundColor Red
    Write-Host "⚠️  Client_QR is now located in _archive/Client_QR" -ForegroundColor Red
    Write-Host "⚠️  The unified-server already includes the customer interface" -ForegroundColor Red
    Write-Host "⚠️  Use the unified-server instead:" -ForegroundColor Red
    Write-Host "     Customer UI: http://localhost:5000/" -ForegroundColor Yellow
    Write-Host "     Admin UI: http://localhost:5000/admin/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To start the unified server, run:" -ForegroundColor Green
    Write-Host ".\start-server.ps1 -Server unified" -ForegroundColor Green
}

# Main execution
switch ($Server) {
    "unified" { Start-UnifiedServer }
    "admin" { Start-AdminDataboard }
    "client" { Start-ClientQR }
    "help" { Show-Help }
    default { Show-Help }
}
