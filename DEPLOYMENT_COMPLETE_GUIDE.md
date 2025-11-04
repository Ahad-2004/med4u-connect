# Med4U Connect - Complete Deployment Guide

## 🚀 Project Status: FIXED AND READY TO DEPLOY

All files have been updated with proper logging, error handling, and configuration for both local development and Vercel deployment.

---

## 📁 Project Structure

```
med4u_connect/
├── api/                          # Vercel Serverless Function
│   ├── index.js                 # ✅ FIXED - All routes with logging
│   └── package.json             # ✅ Dependencies configured
│
├── backend/                     # Local Development Server
│   ├── index.js                 # ✅ Working - Runs on port 4000
│   └── package.json             # ✅ Dependencies configured
│
├── frontend/                    # React Application
│   ├── src/                     # React components
│   ├── vite.config.js          # ✅ Proxy configured
│   ├── .env                     # ✅ API base set to /api
│   └── package.json             # ✅ Build scripts ready
│
├── common/                      # Shared Resources
│   └── firebaseServiceAccount.json  # ⚠️ MUST EXIST (see below)
│
├── vercel.json                  # ✅ FIXED - Proper builds & routes
└── .gitignore                   # ✅ Protects sensitive files
```

---

## 🔧 Local Development Setup

### Step 1: Install Dependencies

```powershell
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install API dependencies (for testing)
cd ../api
npm install
```

### Step 2: Configure Environment Variables

#### Backend `.env` (E:\med4u_connect\backend\.env)
```env
PORT=4000
JWT_SECRET=72c4c2309d86fccecf9cb977401bf819188e333a7963d38eaee69a526d72f973
NODE_ENV=development
```

### Step 3: Ensure Firebase Service Account Exists

Your Firebase service account file MUST be at:
```
E:\med4u_connect\common\firebaseServiceAccount.json
```

If you don't have it:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `med4u-86c5f`
3. Click Settings (⚙️) → Project settings
4. Go to "Service accounts" tab
5. Click "Generate new private key"
6. Save as `firebaseServiceAccount.json` in the `common/` folder

### Step 4: Start Development Servers

#### Option A: Start Both Servers Simultaneously (Recommended)
```powershell
# From project root
npm run dev
```

#### Option B: Start Separately
```powershell
# Terminal 1 - Backend
cd backend
node index.js
# Should see: "Med4U Connect backend running on port 4000"

# Terminal 2 - Frontend
cd frontend
npm run dev
# Should see: "Local: http://localhost:5173"
```

### Step 5: Test Local Setup

```powershell
# Test backend directly
Invoke-RestMethod -Uri "http://localhost:4000/health" -Method Get

# Test through Vite proxy
Invoke-RestMethod -Uri "http://localhost:5173/api/health" -Method Get

# Both should return: {"status":"ok","timestamp":"..."}
```

---

## ☁️ Vercel Deployment

### Step 1: Set Environment Variables in Vercel Dashboard

Go to your Vercel project → Settings → Environment Variables

Add these variables:

1. **JWT_SECRET**
   - Value: `72c4c2309d86fccecf9cb977401bf819188e333a7963d38eaee69a526d72f973`
   - Apply to: Production, Preview, Development

2. **FIREBASE_SERVICE_ACCOUNT** (IMPORTANT!)
   - Value: The ENTIRE contents of your `firebaseServiceAccount.json` as a single-line JSON string
   - How to format:
     ```powershell
     # In PowerShell, from project root:
     Get-Content common\firebaseServiceAccount.json -Raw | ConvertTo-Json -Compress
     ```
   - Apply to: Production, Preview, Development

3. **NODE_ENV**
   - Value: `production`
   - Apply to: Production only

### Step 2: Deploy to Vercel

#### Method 1: Git Push (Recommended)
```powershell
git add .
git commit -m "Fix: Complete API and deployment configuration"
git push origin main
```
Vercel will automatically detect the push and deploy.

#### Method 2: Vercel CLI
```powershell
# Install Vercel CLI (if not installed)
npm install -g vercel

# Deploy
cd E:\med4u_connect
vercel --prod
```

### Step 3: Verify Deployment

After deployment completes:

1. **Test API Health Check**
   ```powershell
   Invoke-RestMethod -Uri "https://your-project.vercel.app/api/health" -Method Get
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Test Frontend**
   - Visit: `https://your-project.vercel.app`
   - You should see your React app load

3. **Check Logs**
   - Go to Vercel Dashboard → Your Project → Logs
   - Look for `[API]` prefixed messages
   - All requests will be logged

---

## 🐛 Debugging

### Common Issues and Solutions

#### 1. 404 on API Routes
**Symptoms:** `/api/health` returns 404

**Check:**
- Verify `vercel.json` has the correct routing
- Check Vercel build logs for errors
- Ensure `api/index.js` was deployed

**Solution:**
```powershell
# Redeploy with force
vercel --prod --force
```

#### 2. 500 Internal Server Error
**Symptoms:** API routes return 500

**Check Vercel Logs:**
1. Go to Vercel Dashboard → Your Project → Logs
2. Look for error messages with `[API]` prefix

**Common Causes:**
- Missing `JWT_SECRET` in Vercel environment variables
- Invalid `FIREBASE_SERVICE_ACCOUNT` JSON
- Firebase project not configured correctly

**Solution:**
- Verify all environment variables are set correctly
- Check that Firebase service account JSON is valid
- Ensure Firebase project allows Admin SDK access

#### 3. CORS Errors
**Symptoms:** Browser console shows CORS errors

**Check:**
- Verify the API is receiving OPTIONS requests
- Check `api/index.js` CORS configuration

**Solution:**
The API is already configured with permissive CORS. If issues persist:
```javascript
// In api/index.js, CORS is set to:
{
  origin: true,  // Allows all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}
```

#### 4. Local Backend Not Starting
**Symptoms:** "ECONNREFUSED" or backend won't start

**Check:**
- Is port 4000 already in use?
- Does `common/firebaseServiceAccount.json` exist?
- Is `JWT_SECRET` set in backend/.env?

**Solution:**
```powershell
# Check if port 4000 is in use
Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue

# If in use, kill the process
Stop-Process -Id <ProcessId> -Force

# Restart backend
cd backend
node index.js
```

---

## 📊 Monitoring and Logs

### View Logs in Real-Time

#### Local Development:
Watch the terminal where you started the backend. All requests will show:
```
[API] GET /health
[API] Health check called
```

#### Vercel Production:
1. Go to Vercel Dashboard
2. Select your project
3. Click "Logs" tab
4. Filter by function: `api/index.js`

All API requests are logged with the `[API]` prefix for easy filtering.

---

## ✅ Testing Checklist

### Local Testing
- [ ] Backend starts without errors on port 4000
- [ ] Frontend starts on port 5173
- [ ] `/api/health` returns 200 OK
- [ ] Firebase Admin initializes successfully
- [ ] No CORS errors in browser console

### Vercel Testing
- [ ] Deployment completes successfully
- [ ] `https://your-site.vercel.app` loads the React app
- [ ] `https://your-site.vercel.app/api/health` returns 200 OK
- [ ] Environment variables are set correctly
- [ ] Logs show API requests with `[API]` prefix
- [ ] No 404 or 500 errors on API routes

---

## 🎯 Quick Reference Commands

### Local Development
```powershell
# Start everything
npm run dev

# Or separately
cd backend && node index.js
cd frontend && npm run dev

# Test API
Invoke-RestMethod -Uri "http://localhost:4000/health" -Method Get
```

### Vercel Deployment
```powershell
# Deploy
vercel --prod

# View logs
vercel logs <deployment-url>

# Check environment
vercel env ls
```

### Testing
```powershell
# Test local backend
Invoke-RestMethod -Uri "http://localhost:4000/health" -Method Get

# Test local frontend proxy
Invoke-RestMethod -Uri "http://localhost:5173/api/health" -Method Get

# Test production
Invoke-RestMethod -Uri "https://your-site.vercel.app/api/health" -Method Get
```

---

## 🔐 Security Notes

1. **Never commit these files:**
   - `common/firebaseServiceAccount.json` (already in .gitignore)
   - `.env` files (already in .gitignore)

2. **Rotate JWT_SECRET** if:
   - You suspect it has been compromised
   - Moving from development to production
   - Generate new: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

3. **Firebase Security:**
   - Keep your service account JSON secure
   - Only set it as environment variable in Vercel
   - Never expose it in client-side code

---

## 📞 Support

If you encounter any issues:

1. **Check the logs** (local terminal or Vercel dashboard)
2. **Verify environment variables** are set correctly
3. **Ensure Firebase service account** file exists and is valid
4. **Test locally first** before deploying to Vercel

All API routes now include comprehensive logging with the `[API]` prefix, making it easy to trace issues.

---

## 🎉 Success Indicators

When everything is working correctly, you should see:

### Local:
- Backend logs: `Med4U Connect backend running on port 4000`
- API logs: `[API] Starting initialization...`
- API logs: `[API] Firebase Admin initialized`
- API logs: `[API] All routes registered`

### Vercel:
- Build: ✅ All builds completed successfully
- API calls return proper JSON responses
- Logs show `[API]` prefixed messages
- No 404/500 errors on `/api/*` routes

---

**Status:** ✅ ALL SYSTEMS GO - READY TO DEPLOY
