# Med4U Connect - Deployment Test Script
# This script tests both local and production deployments

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Med4U Connect - Deployment Test Script" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Test Local Backend
Write-Host "[1/4] Testing Local Backend (port 4000)..." -ForegroundColor Yellow
try {
    $localBackend = Invoke-RestMethod -Uri "http://localhost:4000/health" -Method Get -ErrorAction Stop
    Write-Host "✅ Local Backend: WORKING" -ForegroundColor Green
    Write-Host "   Response: $($localBackend | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Local Backend: NOT RUNNING" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host "   Start it with: cd backend && node index.js" -ForegroundColor Yellow
}
Write-Host ""

# Test Local Frontend Proxy
Write-Host "[2/4] Testing Local Frontend Proxy (port 5173)..." -ForegroundColor Yellow
try {
    $localProxy = Invoke-RestMethod -Uri "http://localhost:5173/api/health" -Method Get -ErrorAction Stop
    Write-Host "✅ Frontend Proxy: WORKING" -ForegroundColor Green
    Write-Host "   Response: $($localProxy | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Frontend Proxy: NOT RUNNING" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host "   Start it with: cd frontend && npm run dev" -ForegroundColor Yellow
}
Write-Host ""

# Test Production API (if URL provided)
Write-Host "[3/4] Testing Production API..." -ForegroundColor Yellow
$productionUrl = Read-Host "Enter your Vercel URL (e.g., https://your-site.vercel.app) or press Enter to skip"

if ($productionUrl) {
    $apiUrl = "$productionUrl/api/health"
    try {
        $production = Invoke-RestMethod -Uri $apiUrl -Method Get -ErrorAction Stop
        Write-Host "✅ Production API: WORKING" -ForegroundColor Green
        Write-Host "   Response: $($production | ConvertTo-Json -Compress)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Production API: ERROR" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
        Write-Host "   Check Vercel logs at: https://vercel.com/dashboard" -ForegroundColor Yellow
    }
} else {
    Write-Host "⏭️  Production test skipped" -ForegroundColor Gray
}
Write-Host ""

# Test Production Frontend
Write-Host "[4/4] Testing Production Frontend..." -ForegroundColor Yellow
if ($productionUrl) {
    try {
        $frontendResponse = Invoke-WebRequest -Uri $productionUrl -Method Get -ErrorAction Stop
        if ($frontendResponse.StatusCode -eq 200) {
            Write-Host "✅ Production Frontend: WORKING" -ForegroundColor Green
            Write-Host "   Status: $($frontendResponse.StatusCode)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "❌ Production Frontend: ERROR" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    }
} else {
    Write-Host "⏭️  Production test skipped" -ForegroundColor Gray
}
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Test Complete" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. If local tests failed, start the servers:" -ForegroundColor White
Write-Host "   - Backend: cd backend && node index.js" -ForegroundColor Gray
Write-Host "   - Frontend: cd frontend && npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "2. If production tests failed:" -ForegroundColor White
Write-Host "   - Check Vercel environment variables" -ForegroundColor Gray
Write-Host "   - Verify JWT_SECRET is set" -ForegroundColor Gray
Write-Host "   - Verify FIREBASE_SERVICE_ACCOUNT is set" -ForegroundColor Gray
Write-Host "   - Check Vercel logs for errors" -ForegroundColor Gray
Write-Host ""
Write-Host "3. For detailed instructions, see:" -ForegroundColor White
Write-Host "   DEPLOYMENT_COMPLETE_GUIDE.md" -ForegroundColor Gray
Write-Host ""
