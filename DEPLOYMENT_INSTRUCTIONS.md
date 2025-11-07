# 🚀 Med4U Connect - Complete Deployment Guide

## Problem
Med4U Beta users are getting `ERR_CONNECTION_REFUSED` when trying to generate connect codes because the API is trying to connect to `localhost:4000` which isn't running.

## Solution
Deploy the Connect API to Vercel (or Render) so it's accessible from anywhere, then update Med4U Beta to use the deployed URL.

---

## 🎯 Quick Start (Recommended)

### Option 1: Automated Deployment

Run this command in PowerShell:

```powershell
cd e:\med4u_connect
.\deploy-complete.ps1
```

This script will:
1. Check if Vercel CLI is installed
2. Copy Firebase credentials to clipboard
3. Deploy to Vercel
4. Show you what to do next

### Option 2: Manual Deployment

Follow the steps below.

---

## 📋 Manual Deployment Steps

### Step 1: Install Vercel CLI

```powershell
npm install -g vercel
```

### Step 2: Login to Vercel

```powershell
vercel login
```

### Step 3: Deploy

```powershell
cd e:\med4u_connect
vercel --prod
```

Vercel will ask you some questions:
- **Set up and deploy?** Yes
- **Which scope?** Select your account
- **Link to existing project?** No (if first time)
- **Project name?** med4u-connect (or your choice)
- **Directory?** ./ (just press Enter)

After deployment, you'll get a URL like:
```
https://med4u-connect-xyz123.vercel.app
```

### Step 4: Set Environment Variables in Vercel

1. Go to https://vercel.com/dashboard
2. Click on your project (med4u-connect)
3. Go to **Settings** > **Environment Variables**
4. Add these variables:

**Variable 1:**
- Name: `JWT_SECRET`
- Value: `your_secure_random_string_here` (generate a strong random string)

**Variable 2:**
- Name: `FIREBASE_SERVICE_ACCOUNT`
- Value: Get it by running:
  ```powershell
  .\get-firebase-json.ps1
  ```
  This will copy the JSON to your clipboard. Paste it as the value.

5. Click **Save**
6. Go to **Deployments** tab and click **Redeploy** (important!)

### Step 5: Update Med4U Beta

Open `e:\med4u_beta\.env` and add:

```
REACT_APP_CONNECT_API_BASE=https://your-vercel-url.vercel.app/api
```

Replace `your-vercel-url` with your actual Vercel URL from Step 3.

For example:
```
REACT_APP_CONNECT_API_BASE=https://med4u-connect-xyz123.vercel.app/api
```

### Step 6: Restart Med4U Beta

```powershell
cd e:\med4u_beta
npm start
```

### Step 7: Test

1. Open Med4U Beta in browser
2. Create a new account or login
3. Go to Dashboard
4. You should see the "Hospital/Lab Connect" card with a QR code and connect code
5. Open browser console - no more `ERR_CONNECTION_REFUSED` errors!

---

## 🧪 Testing the Deployed API

Test your API directly:

```powershell
# Health check
curl https://your-vercel-url.vercel.app/api/health

# Register user code
curl -X POST https://your-vercel-url.vercel.app/api/register-user-code `
  -H "Content-Type: application/json" `
  -d '{"userId":"test-user-123"}'
```

You should get a response like:
```json
{"code":"ABCD1234"}
```

---

## 🔄 Alternative: Deploy to Render

If you prefer Render over Vercel:

### Step 1: Create Web Service on Render

1. Go to https://render.com/dashboard
2. Click **New** > **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name:** med4u-connect
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node backend/index.js`
   - **Plan:** Free

### Step 2: Add Environment Variables

In Render dashboard, add:
- `JWT_SECRET`: your secure random string
- `FIREBASE_SERVICE_ACCOUNT`: your Firebase JSON (run `.\get-firebase-json.ps1`)

### Step 3: Deploy

Click **Create Web Service**

Your API will be at: `https://med4u-connect.onrender.com`

### Step 4: Update Med4U Beta

In `e:\med4u_beta\.env`:
```
REACT_APP_CONNECT_API_BASE=https://med4u-connect.onrender.com
```

Note: Render URLs don't need the `/api` prefix.

---

## ✅ Verification Checklist

- [ ] Vercel/Render deployment successful
- [ ] Environment variables set (JWT_SECRET, FIREBASE_SERVICE_ACCOUNT)
- [ ] API health endpoint returns `{"status":"ok"}`
- [ ] User code registration works
- [ ] Med4U Beta `.env` updated with deployed URL
- [ ] Med4U Beta restarted
- [ ] Connect code generates successfully in Med4U Beta
- [ ] No `ERR_CONNECTION_REFUSED` errors in browser console

---

## 🐛 Troubleshooting

### "Firebase not initialized" error
- Make sure `FIREBASE_SERVICE_ACCOUNT` is set in Vercel/Render
- Redeploy after adding environment variables

### Still seeing localhost:4000 errors
- Check if `.env` file in Med4U Beta has the correct URL
- Restart Med4U Beta dev server
- Clear browser cache

### CORS errors
- The API is already configured to allow all origins
- Check if the URL is correct

### Connect code not generating
- Check Vercel/Render logs for errors
- Test API directly with curl
- Verify Firebase credentials are correct

---

## 📞 Need Help?

If you're still having issues:
1. Check Vercel/Render deployment logs
2. Check browser console for errors
3. Test API endpoints directly with curl
4. Verify all environment variables are set correctly

---

## 🎉 Success!

Once everything is working:
- All Med4U Beta users can generate connect codes
- Connect codes are stored in Firestore
- Hospitals/Labs can use these codes to connect
- Everything works from the cloud (no localhost needed)

**Your Med4U Connect API is now live and accessible from anywhere! 🚀**
