# Update Med4U Beta to Use Deployed Connect API

After deploying the Connect API to Vercel, you need to update Med4U Beta to use the deployed URL instead of localhost.

## Step 1: Get Your Vercel URL

After deploying, Vercel will give you a URL like:
```
https://med4u-connect-xyz123.vercel.app
```

## Step 2: Update Med4U Beta Environment Variables

**File: `e:\med4u_beta\.env`**

Add or update this line:
```
REACT_APP_CONNECT_API_BASE=https://your-vercel-url.vercel.app/api
```

For example:
```
REACT_APP_CONNECT_API_BASE=https://med4u-connect-xyz123.vercel.app/api
```

## Step 3: Restart Med4U Beta

```bash
cd e:\med4u_beta
npm start
```

## Step 4: Test the Connection

1. Open Med4U Beta in your browser
2. Create a new account or login
3. Go to the Dashboard
4. You should see a "Hospital/Lab Connect" card with a QR code and connect code
5. The code should be generated from your Vercel API (not localhost)

## Verification

Open browser console and check the network tab:
- You should see requests going to `https://your-vercel-url.vercel.app/api/register-user-code`
- No more `ERR_CONNECTION_REFUSED` errors
- The connect code should be successfully generated

## Troubleshooting

### Still seeing localhost:4000 errors?
- Make sure you added `REACT_APP_CONNECT_API_BASE` to `.env`
- Restart the Med4U Beta dev server
- Clear browser cache

### Getting CORS errors?
- The API is already configured to allow all origins
- Check if the URL in `.env` is correct (should include `/api` at the end)

### Connect code not generating?
- Check Vercel logs for errors
- Verify environment variables are set in Vercel dashboard
- Test the API directly: `curl https://your-url.vercel.app/api/health`

## Alternative: Use Render

If you're using Render instead of Vercel:

**File: `e:\med4u_beta\.env`**
```
REACT_APP_CONNECT_API_BASE=https://med4u.onrender.com
```

Note: Render URLs don't need the `/api` prefix if you're using the backend/index.js directly.
