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

# Database will be initialized automatically on server start (preserves existing data)
Write-Host "Database will be initialized automatically (existing data preserved)..." -ForegroundColor Cyan
Write-Host "To force database reset, run: cd unified-server && node db-manager.js reset" -ForegroundColor Yellow

# Start the unified server (contains both admin and customer interfaces)
Write-Host "Starting unified server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\unified-server'; npm run dev"

Write-Host "Unified server started!" -ForegroundColor Green
Write-Host "Customer Interface: http://localhost:5000" -ForegroundColor White
Write-Host "Admin Interface: http://localhost:5000/admin" -ForegroundColor White
Write-Host ""
Write-Host "Note: Legacy projects archived to _archive/ directory" -ForegroundColor Yellow

Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
Write-Host "- If you encounter database connection issues, check that PostgreSQL is running" -ForegroundColor White
Write-Host "- Make sure port 5000 is not in use by another application" -ForegroundColor White
Write-Host "- Check the terminal windows for specific error messages" -ForegroundColor White 