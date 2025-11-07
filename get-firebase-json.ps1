# Get Firebase Service Account JSON for Vercel
Write-Host "📋 Reading Firebase Service Account..." -ForegroundColor Cyan

$jsonPath = "e:\med4u_connect\common\firebaseServiceAccount.json"

if (Test-Path $jsonPath) {
    $json = Get-Content $jsonPath -Raw
    Write-Host "`n✅ Firebase Service Account JSON:" -ForegroundColor Green
    Write-Host $json -ForegroundColor Yellow
    
    Write-Host "`n📝 Copy the JSON above and paste it into Vercel:" -ForegroundColor Cyan
    Write-Host "1. Go to https://vercel.com/dashboard" -ForegroundColor White
    Write-Host "2. Select your project" -ForegroundColor White
    Write-Host "3. Go to Settings > Environment Variables" -ForegroundColor White
    Write-Host "4. Add new variable:" -ForegroundColor White
    Write-Host "   Name: FIREBASE_SERVICE_ACCOUNT" -ForegroundColor Yellow
    Write-Host "   Value: [paste the JSON above]" -ForegroundColor Yellow
    
    # Copy to clipboard
    $json | Set-Clipboard
    Write-Host "`n✅ JSON copied to clipboard!" -ForegroundColor Green
} else {
    Write-Host "❌ Firebase service account file not found at: $jsonPath" -ForegroundColor Red
}
