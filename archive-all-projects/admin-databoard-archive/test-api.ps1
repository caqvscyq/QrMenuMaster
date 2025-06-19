# Test script for order tracking API
Write-Host "Testing Order Tracking API..." -ForegroundColor Green

# Test different desk IDs to see which ones have orders
$deskIds = @(1, 2, 3, 4, 5, 6, 7, 8)

foreach ($deskId in $deskIds) {
    try {
        Write-Host "Testing desk ID: $deskId" -ForegroundColor Yellow
        $response = Invoke-RestMethod -Uri "http://localhost:5000/api/orders/desk/$deskId" -Method GET -ErrorAction Stop
        Write-Host "✅ Desk $deskId has $($response.Length) orders" -ForegroundColor Green
        if ($response.Length -gt 0) {
            Write-Host "   First order ID: $($response[0].id), Status: $($response[0].status)" -ForegroundColor Cyan
        }
    }
    catch {
        Write-Host "❌ Desk $deskId failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nCompleted API testing." -ForegroundColor Green 