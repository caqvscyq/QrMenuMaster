# Start-Dev-With-Options.ps1
# Enhanced development startup script with database management options

param(
    [switch]$Reset,
    [switch]$ForceSeed,
    [switch]$Help
)

function Show-Help {
    Write-Host "🚀 QR Menu Master - Development Startup Script" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\start-dev-with-options.ps1 [options]" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -Reset      Reset database completely (DESTRUCTIVE - clears all data)" -ForegroundColor Red
    Write-Host "  -ForceSeed  Force reseed database (DESTRUCTIVE - clears all data)" -ForegroundColor Red
    Write-Host "  -Help       Show this help message" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\start-dev-with-options.ps1                # Normal start (preserves data)"
    Write-Host "  .\start-dev-with-options.ps1 -Reset         # Start with database reset"
    Write-Host "  .\start-dev-with-options.ps1 -ForceSeed     # Start with forced reseed"
    Write-Host ""
    Write-Host "Database Management:" -ForegroundColor Cyan
    Write-Host "  cd unified-server"
    Write-Host "  node db-manager.js status      # Check database status"
    Write-Host "  node db-manager.js seed        # Smart seed (preserves data)"
    Write-Host "  node db-manager.js force-seed  # Force reseed (destructive)"
    Write-Host "  node db-manager.js reset       # Complete reset (destructive)"
}

if ($Help) {
    Show-Help
    exit 0
}

Write-Host "🚀 Starting QR Menu Master Development Environment..." -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Gray

# Kill any existing Node.js processes
Write-Host "🛑 Stopping any existing Node.js processes..." -ForegroundColor Yellow
try {
    taskkill /F /IM node.exe 2>$null
    Start-Sleep -Seconds 2
} catch {
    # Ignore errors if no processes to kill
}

# Navigate to unified-server directory
Set-Location -Path "$PSScriptRoot\unified-server"

# Handle database operations based on parameters
if ($Reset) {
    Write-Host "⚠️  DESTRUCTIVE OPERATION: Resetting database..." -ForegroundColor Red
    Write-Host "   This will delete ALL existing data including:" -ForegroundColor Yellow
    Write-Host "   - All orders and order history" -ForegroundColor Yellow
    Write-Host "   - All active sessions" -ForegroundColor Yellow
    Write-Host "   - All user data" -ForegroundColor Yellow
    Write-Host ""
    
    node db-manager.js reset
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Database reset failed!" -ForegroundColor Red
        exit 1
    }
} elseif ($ForceSeed) {
    Write-Host "⚠️  DESTRUCTIVE OPERATION: Force reseeding database..." -ForegroundColor Red
    Write-Host "   This will delete ALL existing data including:" -ForegroundColor Yellow
    Write-Host "   - All orders and order history" -ForegroundColor Yellow
    Write-Host "   - All active sessions" -ForegroundColor Yellow
    Write-Host "   - All user data" -ForegroundColor Yellow
    Write-Host ""
    
    node db-manager.js force-seed
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Database force seed failed!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "📊 Database will be initialized automatically (preserving existing data)..." -ForegroundColor Cyan
    Write-Host "   - Existing orders and sessions will be preserved" -ForegroundColor Green
    Write-Host "   - Database schema will be updated if needed" -ForegroundColor Green
    Write-Host "   - Only missing core data (shops, categories, admin user) will be added" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 To reset database, use: .\start-dev-with-options.ps1 -Reset" -ForegroundColor Yellow
}

# Start the unified server
Write-Host "🚀 Starting unified server..." -ForegroundColor Cyan
Write-Host "   Server will start on: http://localhost:5000" -ForegroundColor White
Write-Host "   Customer Interface: http://localhost:5000/?table=A1" -ForegroundColor White
Write-Host "   Admin Interface: http://localhost:5000/admin" -ForegroundColor White
Write-Host ""

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\unified-server'; Write-Host '🚀 Starting development server...' -ForegroundColor Green; npm run dev"

Write-Host "✅ Development environment started!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Quick Commands:" -ForegroundColor Cyan
Write-Host "   Database Status:    cd unified-server && node db-manager.js status" -ForegroundColor Gray
Write-Host "   Force Reseed:       cd unified-server && node db-manager.js force-seed" -ForegroundColor Gray
Write-Host "   Complete Reset:     cd unified-server && node db-manager.js reset" -ForegroundColor Gray
Write-Host ""
Write-Host "🔗 Access Points:" -ForegroundColor Cyan
Write-Host "   Customer: http://localhost:5000/?table=A1" -ForegroundColor White
Write-Host "   Admin:    http://localhost:5000/admin" -ForegroundColor White
Write-Host ""
Write-Host "Note: Server logs will appear in the new PowerShell window" -ForegroundColor Yellow
