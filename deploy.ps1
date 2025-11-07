# Med4U Connect - Deploy to Vercel
Write-Host "🚀 Deploying Med4U Connect to Vercel..." -ForegroundColor Cyan

# Check if Vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
}

# Deploy to Vercel
Write-Host "`n📦 Starting deployment..." -ForegroundColor Green
vercel --prod

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "`n📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Go to Vercel dashboard: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "2. Select your project" -ForegroundColor White
Write-Host "3. Go to Settings > Environment Variables" -ForegroundColor White
Write-Host "4. Add these variables:" -ForegroundColor White
Write-Host "   - JWT_SECRET" -ForegroundColor Yellow
Write-Host "   - FIREBASE_SERVICE_ACCOUNT" -ForegroundColor Yellow
Write-Host "5. Redeploy after adding environment variables" -ForegroundColor White
Write-Host "`n6. Update Med4U Beta .env with your Vercel URL:" -ForegroundColor Cyan
Write-Host "   REACT_APP_CONNECT_API_BASE=https://your-project.vercel.app/api" -ForegroundColor Yellow

Write-Host "`n🎉 Done! Your API is now live!" -ForegroundColor Green
