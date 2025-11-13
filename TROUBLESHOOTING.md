# Med4U Connect - Complete Setup & Troubleshooting Guide

## Problem Analysis

The 400 error you're seeing is because:
1. Frontend tries to exchange code "XCFQJ6V3" for an access token
2. Backend looks for "XCFQJ6V3" in `userCodes` collection → **Not found**
3. Backend returns 400: "Code not found"

**Solution: You must FIRST register a user code before exchanging it.**

---

## Step-by-Step Fix

### ✅ Step 1: Verify Backend is Running
```bash
# In terminal at E:\med4u_connect
npm start

# You should see:
# [BACKEND] Med4U Connect backend running on port 4000
# [FRONTEND] ➜  Local:   http://localhost:5173
```

### ✅ Step 2: Register a Test User Code
Open **another terminal** and run:
```bash
cd E:\med4u_connect
node test-flow.js
```

This will:
- Register a code for user "test-patient-001"
- Exchange it for an access token
- Test that the full flow works

**Output should show:**
```
✅ User code registered: XXXX...
✅ Access token received
✨ All tests passed!
```

### ✅ Step 3: Use the Generated Code in Frontend

Once `test-flow.js` completes, it will show you:
```
📌 Configuration for frontend:
   - Hospital ID: hospital-001
   - Test Code: XXXX...
   - Test User ID: test-patient-001
```

**Update your frontend App.jsx with the shown values:**
```jsx
// In App.jsx line 13, replace the hospitalId
const [hospitalId] = useState('hospital-001')  // Use the one from test-flow output
```

### ✅ Step 4: Test in Browser

1. Open http://localhost:5173
2. Login with any Firebase account
3. In "Paste/Type Patient Code" field, enter the code from test-flow output
4. Click "Connect"
5. **Expected result:** "Connected. Scope: view,upload"

---

## Detailed Error Explanation

### Why was it returning 400?

**Backend `/exchange-user-code` endpoint:**
```javascript
app.post('/exchange-user-code', async (req, res) => {
  try {
    const { code, hospitalId, requestedScope } = req.body;
    // ❌ THIS LINE FAILED:
    const codeDoc = await db.collection('userCodes').doc(code).get();
    if (!codeDoc.exists) return res.status(404).json({ error: 'Code not found' });
    // ... rest of logic
  } catch (err) {
    res.status(400).json({ error: 'Failed to exchange code' });
  }
});
```

**What was happening:**
1. Code "XCFQJ6V3" was never registered
2. `codeDoc.exists === false`
3. But the error wasn't explicit because of the catch-all at the end

**Fix applied:**
- Added logging to show exactly what's failing
- Backend now logs: `[API] Exchange code error: [detailed message]`

---

## Testing Checklist

- [ ] Backend running on port 4000
- [ ] Frontend running on port 5173
- [ ] Ran `node test-flow.js` and saw "✨ All tests passed!"
- [ ] Updated App.jsx with correct hospitalId
- [ ] Pasted the test code into frontend and clicked Connect
- [ ] Saw success message: "Connected. Scope: view,upload"
- [ ] Patient data loaded successfully

---

## How the Flow Actually Works

```
┌─────────────────┐
│   Frontend      │
│ (React App)     │
└────────┬────────┘
         │ 1. User enters code
         │    or scans QR
         │
         ▼
┌─────────────────────────┐
│ /register-user-code     │  (FIRST - creates code)
│ POST                    │
│ Body: { userId }        │
│ Returns: { code }       │
└────────┬────────────────┘
         │
         ▼
         Firestore:
         userCodes/{CODE} = {
           userId: "user-123",
           createdAt: ...
         }
         │
         │
         ▼
┌─────────────────────────────┐
│ /exchange-user-code         │  (SECOND - exchanges code)
│ POST                        │
│ Body: {                     │
│   code,                     │
│   hospitalId,               │
│   requestedScope            │
│ }                           │
│ Returns: { accessToken }    │
└────────┬────────────────────┘
         │
         ▼
         Firestore:
         accessTokens/ = {
           userId: "user-123",
           hospitalId: "hospital-001",
           scope: ["view", "upload"],
           accessToken: "eyJhb...",
           ...
         }
         │
         │ accessToken
         ▼
┌─────────────────────────┐
│   Frontend              │
│ Uses token to call:     │
│ /hospital-get-reports   │
│ /hospital-get-profile   │
└─────────────────────────┘
```

---

## If Still Not Working

### Check Backend Logs
When you try to connect, look at the backend terminal. You should see:
```
[API] Exchange code request: code=XXXX, hospitalId=hospital-001
```

If you don't see this log, the request isn't reaching the backend. Check:
- [ ] Vite proxy is working (port 5173 should proxy to 4000)
- [ ] Browser Network tab shows the request going to `http://localhost:5173/api/exchange-user-code`
- [ ] Response headers show CORS headers (Access-Control-Allow-Origin)

### Check Firestore
1. Go to Firebase Console → med4u-86c5f project
2. Check **Firestore Database**
3. Look for collection: `userCodes`
4. You should see documents with your test codes
5. Each should have `userId` field

### Check Browser Console
Should NOT see:
- `POST http://localhost:5173/api/exchange-user-code 404`
- `POST http://localhost:5173/api/exchange-user-code 500`

Should see CORS headers in Network tab request to `/api/exchange-user-code`

---

## Key Files Modified

1. **backend/index.js** - Added logging to `/exchange-user-code`
2. **frontend/src/services/api.js** - Fixed API_BASE to use `/api` proxy in dev
3. **test-flow.js** - Created test script to validate flow
4. **frontend/src/App.jsx** - hospitalId must match what you register codes for

---

## Important Notes

⚠️ **The hospitalId must match!**
- When registering code: any userId can be used
- When exchanging code: hospitalId in request must exist in accessTokens
- Frontend passes `hospitalId = 'demo-hospital-123'` (from App.jsx)
- Backend stores this in accessTokens collection

⚠️ **Each code is single-use-per-registration!**
- Call `/register-user-code` → get code "ABC123"
- Use it once with `/exchange-user-code` → works ✅
- Try to use it again → fails, code is consumed

⚠️ **JWT_SECRET must be set!**
- Check: `cat E:\med4u_connect\backend\.env`
- Should have `JWT_SECRET=...` (currently set)

---

## Production Deployment (When Ready)

For Render + Vercel deployment:
- Frontend: Set `VITE_CONNECT_API_BASE=https://med4u-connect-api.onrender.com` 
- Backend: Set `JWT_SECRET`, `FIREBASE_SERVICE_ACCOUNT` env vars on Render
- Update Firebase CORS rules if needed

