# Fix 401 Errors - Comprehensive Solution
# This script fixes the 401 authentication errors by ensuring proper server setup

Write-Host "QR Menu System - 401 Error Fix" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Step 1: Kill any conflicting Node.js processes on port 5000
Write-Host "`n1. Checking for conflicting processes..." -ForegroundColor Yellow

$processes = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($processes) {
    Write-Host "Found processes using port 5000:" -ForegroundColor Red
    foreach ($proc in $processes) {
        $processInfo = Get-Process -Id $proc.OwningProcess -ErrorAction SilentlyContinue
        if ($processInfo) {
            Write-Host "  - PID $($proc.OwningProcess): $($processInfo.ProcessName)" -ForegroundColor Red
            Write-Host "    Killing process..." -ForegroundColor Yellow
            Stop-Process -Id $proc.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 2
} else {
    Write-Host "OK - No conflicting processes found" -ForegroundColor Green
}

# Step 2: Verify database connection
Write-Host "`n2. Verifying database connection..." -ForegroundColor Yellow

try {
    $env:PGPASSWORD = "2025"
    $dbTest = psql -U postgres -d qrmenu -c "SELECT COUNT(*) FROM sessions;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK - Database connection successful" -ForegroundColor Green
    } else {
        Write-Host "ERROR - Database connection failed" -ForegroundColor Red
        Write-Host "Please ensure PostgreSQL is running and the 'qrmenu' database exists" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "ERROR - Database test failed: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Clean up old sessions
Write-Host "`n3. Cleaning up expired sessions..." -ForegroundColor Yellow

try {
    $env:PGPASSWORD = "2025"
    $cleanupResult = psql -U postgres -d qrmenu -c "DELETE FROM sessions WHERE expires_at < NOW() OR status = 'expired';" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK - Expired sessions cleaned up" -ForegroundColor Green
    } else {
        Write-Host "WARNING - Session cleanup warning (this is usually fine)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "WARNING - Session cleanup failed: $_" -ForegroundColor Yellow
}

# Step 4: Verify environment configuration
Write-Host "`n4. Verifying environment configuration..." -ForegroundColor Yellow

if (Test-Path ".env") {
    $envContent = Get-Content ".env"
    $hasDbUrl = $envContent | Where-Object { $_ -match "^DATABASE_URL=" }
    $hasPort = $envContent | Where-Object { $_ -match "^PORT=" }

    if ($hasDbUrl) {
        Write-Host "OK - DATABASE_URL configured" -ForegroundColor Green
    } else {
        Write-Host "ERROR - DATABASE_URL not found in .env" -ForegroundColor Red
    }

    if ($hasPort) {
        Write-Host "OK - PORT configured" -ForegroundColor Green
    } else {
        Write-Host "WARNING - PORT not explicitly set (will use default 5000)" -ForegroundColor Yellow
    }
} else {
    Write-Host "ERROR - .env file not found" -ForegroundColor Red
    exit 1
}

# Step 5: Build the project
Write-Host "`n5. Building the project..." -ForegroundColor Yellow

try {
    npm run build 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK - Project built successfully" -ForegroundColor Green
    } else {
        Write-Host "ERROR - Build failed" -ForegroundColor Red
        Write-Host "Running npm install first..." -ForegroundColor Yellow
        npm install 2>&1 | Out-Null
        npm run build 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "OK - Project built successfully after npm install" -ForegroundColor Green
        } else {
            Write-Host "ERROR - Build still failing, but continuing..." -ForegroundColor Red
        }
    }
} catch {
    Write-Host "WARNING - Build process warning: $_" -ForegroundColor Yellow
}

# Step 6: Start the unified server
Write-Host "`n6. Starting the unified server..." -ForegroundColor Yellow

Write-Host "Starting server on port 5000..." -ForegroundColor Cyan
Write-Host "Customer frontend: http://localhost:5000/" -ForegroundColor Green
Write-Host "Admin frontend: http://localhost:5000/admin/" -ForegroundColor Green
Write-Host "Session test page: http://localhost:5000/test-fixed-session.html?table=A1" -ForegroundColor Green
Write-Host "`nPress Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Cyan

# Start the server
npm start
