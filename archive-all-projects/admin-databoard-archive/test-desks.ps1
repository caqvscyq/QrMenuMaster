# Test script to check desk/table mapping
Write-Host "Checking Desk/Table Mapping..." -ForegroundColor Green

try {
    # First, let's try to get admin token (this might fail, but let's see desk structure)
    Write-Host "Attempting to fetch desk information..." -ForegroundColor Yellow
    
    # Try without auth first to see the error structure
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/desks" -Method GET -ErrorAction Stop
        Write-Host "✅ Desk data retrieved successfully" -ForegroundColor Green
        
        foreach ($desk in $response) {
            Write-Host "Desk ID: $($desk.id), Number: $($desk.number), Name: $($desk.name)" -ForegroundColor Cyan
        }
    }
    catch {
        Write-Host "❌ Admin desks failed (expected - needs auth): $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Let's also check if we can create a test order for desk 3 and see if it shows
    Write-Host "`nChecking what orders exist for desk 3..." -ForegroundColor Yellow
    $ordersDesk3 = Invoke-RestMethod -Uri "http://localhost:5000/api/orders/desk/3" -Method GET
    Write-Host "Desk 3 has $($ordersDesk3.Length) orders" -ForegroundColor Green
    if ($ordersDesk3.Length -gt 0) {
        Write-Host "First order details:" -ForegroundColor Cyan
        Write-Host "  ID: $($ordersDesk3[0].id)" -ForegroundColor White
        Write-Host "  Status: $($ordersDesk3[0].status)" -ForegroundColor White
        Write-Host "  Customer: $($ordersDesk3[0].customerName)" -ForegroundColor White
        Write-Host "  Total: $($ordersDesk3[0].total)" -ForegroundColor White
    }
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nCompleted desk mapping check." -ForegroundColor Green 