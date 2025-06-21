# Start-All.ps1
# This script starts all components of the QR Menu Master application

Write-Host "Starting QR Menu Master components..." -ForegroundColor Green

# Kill any existing Node.js processes
Write-Host "Stopping any existing Node.js processes..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null

# Start the unified server (contains both admin and customer interfaces)
Write-Host "Starting unified server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\unified-server' ; npm run dev"

Write-Host "Unified server started!" -ForegroundColor Green
Write-Host "Customer Interface: http://localhost:5000" -ForegroundColor White
Write-Host "Admin Interface: http://localhost:5000/admin" -ForegroundColor White
Write-Host ""
Write-Host "Note: Legacy projects archived to _archive/ directory" -ForegroundColor Yellow