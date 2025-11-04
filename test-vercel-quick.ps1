# Quick Vercel Deployment Test
Write-Host "Vercel Deployment Quick Test" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

$vercelUrl = Read-Host "med4u-connect.vercel.app"

if (-not $vercelUrl) {
    Write-Host "No URL provided. Exiting." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "[1] Testing API Health..." -ForegroundColor Yellow
try {
    $apiHealth = Invoke-RestMethod -Uri "$vercelUrl/api/health" -Method Get -ErrorAction Stop
    Write-Host "✅ API Health: WORKING" -ForegroundColor Green
    Write-Host "   Response: $($apiHealth | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "❌ API Health: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check Vercel environment variables are set:" -ForegroundColor White
    Write-Host "   - JWT_SECRET" -ForegroundColor Gray
    Write-Host "   - FIREBASE_SERVICE_ACCOUNT" -ForegroundColor Gray
    Write-Host "2. Check Vercel logs for errors" -ForegroundColor White
    Write-Host "3. Redeploy if variables were just added" -ForegroundColor White
}

Write-Host ""
Write-Host "[2] Testing Frontend..." -ForegroundColor Yellow
try {
    $frontend = Invoke-WebRequest -Uri $vercelUrl -Method Get -ErrorAction Stop
    if ($frontend.StatusCode -eq 200) {
        Write-Host "✅ Frontend: WORKING" -ForegroundColor Green
        Write-Host "   Status: $($frontend.StatusCode)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Frontend: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "==============================" -ForegroundColor Cyan
Write-Host "Test Complete!" -ForegroundColor Cyan
Write-Host ""
