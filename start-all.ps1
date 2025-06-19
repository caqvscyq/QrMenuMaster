# Start-All.ps1
# This script starts all components of the QR Menu Master application

Write-Host "Starting QR Menu Master components..." -ForegroundColor Green

# Kill any existing Node.js processes
Write-Host "Stopping any existing Node.js processes..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null

# Start the unified server in a new window
Write-Host "Starting unified server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\unified-server' ; npm run dev"

# Wait for the server to start
Write-Host "Waiting for server to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start the Admin Dashboard frontend in a new window
Write-Host "Starting Admin Dashboard..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\Admin_databoard' ; npm run dev"

# Start the Client QR frontend in a new window
Write-Host "Starting Client QR frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\Client_QR' ; npm run dev"

Write-Host "All components started!" -ForegroundColor Green
Write-Host "Unified Server: http://localhost:5000" -ForegroundColor White
Write-Host "Admin Dashboard: http://localhost:5173" -ForegroundColor White
Write-Host "Client QR: http://localhost:5174" -ForegroundColor White 