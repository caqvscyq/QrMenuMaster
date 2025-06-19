# Force seeding by calling menu items endpoint which triggers ensureDataExists
Write-Host "Forcing data seeding..." -ForegroundColor Green

try {
    # Call menu items endpoint which triggers ensureDataExists in the code
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/menu-items" -Method GET -ErrorAction Stop
    Write-Host "✅ Data seeding triggered successfully" -ForegroundColor Green
    Write-Host "Menu items count: $($response.Length)" -ForegroundColor Cyan
}
catch {
    Write-Host "⚠️ Expected auth error (this still triggers seeding): $($_.Exception.Message)" -ForegroundColor Yellow
}

# Wait a moment for seeding to complete
Start-Sleep -Seconds 2

# Test desk 7 specifically
Write-Host "`nTesting desk ID 7 (Table B2)..." -ForegroundColor Yellow
try {
    $desk7Orders = Invoke-RestMethod -Uri "http://localhost:5000/api/orders/desk/7" -Method GET
    Write-Host "✅ Desk 7 now has $($desk7Orders.Length) orders" -ForegroundColor Green
    if ($desk7Orders.Length -gt 0) {
        Write-Host "   Order details:" -ForegroundColor Cyan
        Write-Host "   - ID: $($desk7Orders[0].id)" -ForegroundColor White
        Write-Host "   - Status: $($desk7Orders[0].status)" -ForegroundColor White
        Write-Host "   - Total: $($desk7Orders[0].total)" -ForegroundColor White
    }
}
catch {
    Write-Host "❌ Error checking desk 7: $($_.Exception.Message)" -ForegroundColor Red
}

# Test desk 8 specifically (Table B3)
Write-Host "`nTesting desk ID 8 (Table B3)..." -ForegroundColor Yellow
try {
    $desk8Orders = Invoke-RestMethod -Uri "http://localhost:5000/api/orders/desk/8" -Method GET
    Write-Host "✅ Desk 8 now has $($desk8Orders.Length) orders" -ForegroundColor Green
    if ($desk8Orders.Length -gt 0) {
        Write-Host "   Order details:" -ForegroundColor Cyan
        Write-Host "   - ID: $($desk8Orders[0].id)" -ForegroundColor White
        Write-Host "   - Status: $($desk8Orders[0].status)" -ForegroundColor White
        Write-Host "   - Total: $($desk8Orders[0].total)" -ForegroundColor White
    }
}
catch {
    Write-Host "❌ Error checking desk 8: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nCompleted forced seeding test." -ForegroundColor Green 