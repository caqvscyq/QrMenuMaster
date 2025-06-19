# Test desk ID 8 specifically (Table B3)
Write-Host "Testing Desk ID 8 (Table B3)..." -ForegroundColor Green

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/orders/desk/8" -Method GET
    Write-Host "✅ Desk 8 has $($response.Length) orders" -ForegroundColor Green
    
    if ($response.Length -gt 0) {
        Write-Host "Order details:" -ForegroundColor Cyan
        $order = $response[0]
        Write-Host "  ID: $($order.id)" -ForegroundColor White
        Write-Host "  Status: $($order.status)" -ForegroundColor White
        Write-Host "  Total: $($order.total)" -ForegroundColor White
        Write-Host "  Customer: $($order.customerName)" -ForegroundColor White
        
        if ($order.items -and $order.items.Length -gt 0) {
            Write-Host "  Items:" -ForegroundColor White
            foreach ($item in $order.items) {
                Write-Host "    - $($item.itemName) x$($item.quantity) = $($item.price)" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "❌ No orders found for desk 8!" -ForegroundColor Red
        Write-Host "The client order tracking will show 'no orders'." -ForegroundColor Yellow
    }
}
catch {
    Write-Host "❌ Error testing desk 8: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nNow try refreshing the order tracking modal!" -ForegroundColor Yellow 