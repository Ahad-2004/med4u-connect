# Deploy Med4U Connect API to Vercel

## Quick Deploy Steps

### 1. Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy from the project root
```bash
cd e:\med4u_connect
vercel --prod
```

### 4. Set Environment Variables in Vercel Dashboard

Go to your Vercel project settings and add these environment variables:

```
JWT_SECRET=your_secure_jwt_secret_here
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"med4u-86c5f",...}
```

**To get your Firebase Service Account JSON:**
```bash
# Read the file and copy the entire JSON
type e:\med4u_connect\common\firebaseServiceAccount.json
```

Copy the entire JSON output and paste it as the value for `FIREBASE_SERVICE_ACCOUNT` in Vercel.

### 5. Your API will be available at:
```
https://your-project-name.vercel.app/api/register-user-code
https://your-project-name.vercel.app/api/exchange-user-code
https://your-project-name.vercel.app/api/hospital-get-profile
... etc
```

### 6. Update Med4U Beta Frontend

Update the API base URL in Med4U Beta to point to your Vercel deployment:

**File: `e:\med4u_beta\.env`**
```
REACT_APP_CONNECT_API_BASE=https://your-project-name.vercel.app/api
```

**File: `e:\med4u_beta\src\services\connectApi.js`**
```javascript
const CONNECT_API_BASE = process.env.REACT_APP_CONNECT_API_BASE || 'https://your-project-name.vercel.app/api';
```

### 7. Test the Deployment

```bash
# Test health endpoint
curl https://your-project-name.vercel.app/api/health

# Test user code registration
curl -X POST https://your-project-name.vercel.app/api/register-user-code \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-123"}'
```

## Troubleshooting

### If you get "Firebase not initialized" error:
- Make sure `FIREBASE_SERVICE_ACCOUNT` is set in Vercel environment variables
- Redeploy after adding environment variables

### If you get CORS errors:
- The API is already configured to allow all origins
- Check browser console for specific CORS error messages

### If deployment fails:
- Check Vercel build logs
- Ensure all dependencies are in package.json
- Verify vercel.json configuration

## Alternative: Use Render Instead

If you prefer Render over Vercel:

1. Go to https://render.com
2. Create a new Web Service
3. Connect your GitHub repository
4. Set build command: `npm install`
5. Set start command: `node backend/index.js`
6. Add environment variables
7. Deploy

Your API will be at: `https://your-app.onrender.com/register-user-code`
