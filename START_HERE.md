# 🎯 START HERE - Quick Deployment Guide

## The Problem You're Facing

When users create accounts in Med4U Beta, they get this error:
```
localhost:4000/register-user-code:1 Failed to load resource: net::ERR_CONNECTION_REFUSED
```

This happens because Med4U Beta is trying to connect to a local backend that isn't running.

## The Solution

Deploy your Connect API to the cloud (Vercel or Render) so it's always available.

---

## 🚀 Quick Fix (3 Steps)

### Step 1: Deploy to Vercel

Open PowerShell and run:

```powershell
cd e:\med4u_connect
.\deploy-complete.ps1
```

Follow the prompts. You'll get a URL like: `https://med4u-connect-xyz.vercel.app`

### Step 2: Set Environment Variables

1. Go to https://vercel.com/dashboard
2. Click your project
3. Go to Settings > Environment Variables
4. Add:
   - `JWT_SECRET` = any random secure string
   - `FIREBASE_SERVICE_ACCOUNT` = run `.\get-firebase-json.ps1` to copy it
5. Click Save
6. Redeploy

### Step 3: Update Med4U Beta

Edit `e:\med4u_beta\.env`:

```
REACT_APP_CONNECT_API_BASE=https://your-vercel-url.vercel.app/api
```

Restart Med4U Beta:
```powershell
cd e:\med4u_beta
npm start
```

---

## ✅ Done!

Now all users can generate connect codes from anywhere!

---

## 📚 Need More Details?

See `DEPLOYMENT_INSTRUCTIONS.md` for the complete guide.

## 🆘 Having Issues?

1. Check Vercel logs
2. Test API: `curl https://your-url.vercel.app/api/health`
3. Make sure environment variables are set
4. Restart Med4U Beta after changing .env

---

**That's it! Your API is now live and all users can get their connect codes! 🎉**
