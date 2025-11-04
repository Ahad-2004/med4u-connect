# 🚀 Quick Start Guide - Med4U Connect

## ✅ What Was Fixed

1. **API Serverless Function** (`api/index.js`)
   - ✅ Rewrote with proper CommonJS syntax
   - ✅ Added all API routes from backend
   - ✅ Added comprehensive logging with `[API]` prefix
   - ✅ Proper error handling
   - ✅ Correct Express app export

2. **Vercel Configuration** (`vercel.json`)
   - ✅ Added proper `builds` configuration
   - ✅ Configured routes for API and frontend
   - ✅ Added filesystem handler for static assets
   - ✅ SPA fallback for React Router

3. **Backend for Local Development** (`backend/index.js`)
   - ✅ Already working
   - ✅ Loads Firebase credentials from env or file
   - ✅ Runs on port 4000

4. **Frontend Configuration**
   - ✅ Vite proxy configured
   - ✅ API base URL set to `/api`
   - ✅ Build scripts ready

5. **Environment & Security**
   - ✅ `.gitignore` protects sensitive files
   - ✅ Backend `.env` created with JWT_SECRET
   - ✅ Firebase service account path configured

---

## 🎯 Start Local Development (3 Steps)

### Step 1: Ensure Firebase Service Account Exists
Make sure this file exists:
```
E:\med4u_connect\common\firebaseServiceAccount.json
```

If not, download it from [Firebase Console](https://console.firebase.google.com/) → Your Project → Settings → Service Accounts → Generate New Private Key

### Step 2: Start the Servers
```powershell
# Option A: Start both at once (recommended)
cd E:\med4u_connect
npm run dev

# Option B: Start separately
# Terminal 1:
cd E:\med4u_connect\backend
node index.js

# Terminal 2:
cd E:\med4u_connect\frontend
npm run dev
```

### Step 3: Test It
```powershell
# Test backend
Invoke-RestMethod -Uri "http://localhost:4000/health" -Method Get

# Test frontend
# Open browser: http://localhost:5173
```

---

## ☁️ Deploy to Vercel (3 Steps)

### Step 1: Set Environment Variables in Vercel

Go to: [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → Settings → Environment Variables

Add these 2 variables:

1. **JWT_SECRET**
   ```
   72c4c2309d86fccecf9cb977401bf819188e333a7963d38eaee69a526d72f973
   ```

2. **FIREBASE_SERVICE_ACCOUNT**
   - Copy the entire contents of `common/firebaseServiceAccount.json`
   - Paste as a single line (Vercel will handle the formatting)
   - Or format it in PowerShell:
     ```powershell
     Get-Content common\firebaseServiceAccount.json -Raw | ConvertTo-Json -Compress
     ```

### Step 2: Deploy
```powershell
# Push to Git (Vercel auto-deploys)
git add .
git commit -m "Fix: Complete deployment configuration"
git push origin main

# OR use Vercel CLI
vercel --prod
```

### Step 3: Test Production
```powershell
# Replace with your actual URL
Invoke-RestMethod -Uri "https://your-site.vercel.app/api/health" -Method Get
```

---

## 🧪 Automated Testing

Run the test script:
```powershell
cd E:\med4u_connect
.\test-deployment.ps1
```

This will test:
- ✅ Local backend (port 4000)
- ✅ Local frontend proxy (port 5173)
- ✅ Production API (if URL provided)
- ✅ Production frontend (if URL provided)

---

## 🐛 Troubleshooting

### Local Backend Won't Start
```powershell
# Check if port 4000 is in use
Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue

# If found, kill the process
Stop-Process -Id <ProcessId> -Force

# Restart
cd backend
node index.js
```

### API Returns 404 on Vercel
1. Check Vercel build logs
2. Verify environment variables are set
3. Force redeploy: `vercel --prod --force`

### API Returns 500 on Vercel
1. Go to Vercel Dashboard → Logs
2. Look for `[API]` prefixed error messages
3. Common causes:
   - Missing JWT_SECRET
   - Invalid FIREBASE_SERVICE_ACCOUNT JSON
   - Firebase project configuration issue

---

## 📊 View Logs

### Local
Watch the terminal where backend is running. All requests show:
```
[API] GET /health
[API] Health check called
```

### Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click "Logs" tab
4. Filter by function: `api/index.js`

---

## 📚 Full Documentation

For complete details, see:
- **DEPLOYMENT_COMPLETE_GUIDE.md** - Comprehensive deployment guide with troubleshooting
- **test-deployment.ps1** - Automated test script

---

## ✨ What's New

All API routes now include detailed logging:
- `[API]` prefix for easy filtering
- Request method and URL logged
- Success/error messages
- Firebase initialization status
- Route execution details

Example logs:
```
[API] Starting initialization...
[API] Loading Firebase credentials from environment variable
[API] Firebase credentials loaded from env
[API] Firebase Admin initialized
[API] All routes registered
[API] POST /exchange-user-code
[API] Exchange user code requested
[API] User code exchanged successfully
```

---

## 🎉 Success!

When everything works, you'll see:

**Local:**
```
Med4U Connect backend running on port 4000
[API] Starting initialization...
[API] Firebase Admin initialized
[API] All routes registered
```

**Vercel:**
```json
GET /api/health
→ {"status":"ok","timestamp":"2024-11-04T..."}
```

**You're all set! 🚀**
