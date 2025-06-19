# start-dev.ps1
# This script starts the development environment for QR Menu Master

# Function to check if a command exists
function Test-CommandExists {
    param ($command)
    $exists = $false
    try {
        if (Get-Command $command -ErrorAction SilentlyContinue) {
            $exists = $true
        }
    } catch {
        $exists = $false
    }
    return $exists
}

# Function to check if PostgreSQL is running
function Test-PostgreSQL {
    $isRunning = $false
    try {
        $pgProcess = Get-Process -Name postgres -ErrorAction SilentlyContinue
        if ($pgProcess) {
            $isRunning = $true
            Write-Host "PostgreSQL is running." -ForegroundColor Green
        } else {
            Write-Host "PostgreSQL is NOT running!" -ForegroundColor Red
        }
    } catch {
        Write-Host "Error checking PostgreSQL: $_" -ForegroundColor Red
    }
    return $isRunning
}

# Kill any existing Node.js processes
Write-Host "Stopping any existing Node.js processes..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null

# Check if PostgreSQL is running
if (-not (Test-PostgreSQL)) {
    Write-Host "Please start PostgreSQL before continuing." -ForegroundColor Red
    Write-Host "After starting PostgreSQL, run this script again." -ForegroundColor Yellow
    exit 1
}

# Check if the database exists and reset it
Write-Host "Resetting and seeding the database..." -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\unified-server"
node reset-db.js

# Start the unified server
Write-Host "Starting unified server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\unified-server'; npm run dev"

# Wait for the server to start
Write-Host "Waiting for server to initialize (10 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Start the Admin Dashboard frontend
Write-Host "Starting Admin Dashboard..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\Admin_databoard'; npm run dev"

# Start the Client QR frontend
Write-Host "Starting Client QR frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\Client_QR'; npm run dev"

Write-Host "All components started!" -ForegroundColor Green
Write-Host "Unified Server: http://localhost:5000" -ForegroundColor White
Write-Host "Admin Dashboard: http://localhost:5173" -ForegroundColor White
Write-Host "Client QR: http://localhost:5174" -ForegroundColor White

Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
Write-Host "- If you encounter database connection issues, check that PostgreSQL is running" -ForegroundColor White
Write-Host "- Make sure port 5000 is not in use by another application" -ForegroundColor White
Write-Host "- Check the terminal windows for specific error messages" -ForegroundColor White 