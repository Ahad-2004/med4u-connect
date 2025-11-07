# Med4U Connect - Complete Deployment Script
param(
    [string]$DeploymentType = "vercel"  # Options: vercel, render
)

Write-Host "🚀 Med4U Connect - Complete Deployment" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Check prerequisites
Write-Host "📋 Step 1: Checking prerequisites..." -ForegroundColor Yellow

if ($DeploymentType -eq "vercel") {
    $vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
    if (-not $vercelInstalled) {
        Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
        npm install -g vercel
        Write-Host "✅ Vercel CLI installed" -ForegroundColor Green
    } else {
        Write-Host "✅ Vercel CLI found" -ForegroundColor Green
    }
}

# Step 2: Get Firebase Service Account
Write-Host "`n📋 Step 2: Preparing Firebase credentials..." -ForegroundColor Yellow
$jsonPath = "e:\med4u_connect\common\firebaseServiceAccount.json"

if (Test-Path $jsonPath) {
    $firebaseJson = Get-Content $jsonPath -Raw
    $firebaseJson | Set-Clipboard
    Write-Host "✅ Firebase credentials copied to clipboard" -ForegroundColor Green
} else {
    Write-Host "❌ Firebase service account not found at: $jsonPath" -ForegroundColor Red
    exit 1
}

# Step 3: Deploy
Write-Host "`n📦 Step 3: Deploying to $DeploymentType..." -ForegroundColor Yellow

if ($DeploymentType -eq "vercel") {
    Write-Host "Running: vercel --prod" -ForegroundColor Gray
    vercel --prod
    
    Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
    Write-Host "`n⚠️  IMPORTANT: Set environment variables in Vercel Dashboard" -ForegroundColor Red
    Write-Host "1. Go to: https://vercel.com/dashboard" -ForegroundColor White
    Write-Host "2. Select your project" -ForegroundColor White
    Write-Host "3. Go to: Settings > Environment Variables" -ForegroundColor White
    Write-Host "4. Add these variables:" -ForegroundColor White
    Write-Host "`n   Variable Name: JWT_SECRET" -ForegroundColor Yellow
    Write-Host "   Variable Value: [your secure JWT secret]`n" -ForegroundColor Yellow
    Write-Host "   Variable Name: FIREBASE_SERVICE_ACCOUNT" -ForegroundColor Yellow
    Write-Host "   Variable Value: [paste from clipboard - already copied!]`n" -ForegroundColor Yellow
    Write-Host "5. Click 'Save' and redeploy" -ForegroundColor White
    
} elseif ($DeploymentType -eq "render") {
    Write-Host "For Render deployment:" -ForegroundColor White
    Write-Host "1. Go to: https://render.com/dashboard" -ForegroundColor White
    Write-Host "2. Create new Web Service" -ForegroundColor White
    Write-Host "3. Connect your GitHub repository" -ForegroundColor White
    Write-Host "4. Set build command: npm install" -ForegroundColor White
    Write-Host "5. Set start command: node backend/index.js" -ForegroundColor White
    Write-Host "6. Add environment variables (see above)" -ForegroundColor White
}

# Step 4: Instructions for Med4U Beta
Write-Host "`n📝 Step 4: Update Med4U Beta" -ForegroundColor Yellow
Write-Host "After deployment, update Med4U Beta .env file:" -ForegroundColor White
Write-Host "`nFile: e:\med4u_beta\.env" -ForegroundColor Gray
Write-Host "Add this line:" -ForegroundColor White
Write-Host "REACT_APP_CONNECT_API_BASE=https://your-project.vercel.app/api`n" -ForegroundColor Yellow

# Step 5: Testing
Write-Host "📋 Step 5: Testing" -ForegroundColor Yellow
Write-Host "After setting environment variables, test your API:" -ForegroundColor White
Write-Host "`ncurl https://your-project.vercel.app/api/health" -ForegroundColor Gray
Write-Host "curl -X POST https://your-project.vercel.app/api/register-user-code -H 'Content-Type: application/json' -d '{""userId"":""test-123""}'" -ForegroundColor Gray

Write-Host "`n🎉 Deployment process complete!" -ForegroundColor Green
Write-Host "Follow the steps above to complete the setup.`n" -ForegroundColor White

# Summary
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "✅ Prerequisites checked" -ForegroundColor Green
Write-Host "✅ Firebase credentials prepared (in clipboard)" -ForegroundColor Green
Write-Host "✅ Deployment initiated" -ForegroundColor Green
Write-Host "⏳ Waiting for you to set environment variables" -ForegroundColor Yellow
Write-Host "⏳ Waiting for you to update Med4U Beta .env" -ForegroundColor Yellow
