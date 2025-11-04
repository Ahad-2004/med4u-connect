# Med4U Connect Setup Instructions

## Prerequisites
- Node.js (v18+ recommended)
- npm
- Firebase project (with Firestore & Auth enabled)
- Service account JSON for backend (place in `common/firebaseServiceAccount.json`)

## 1. Install Dependencies

### Backend
```
cd backend
npm install
```

### Frontend
```
cd frontend
npm install
```

## 2. Configure Firebase
- Update `common/firebaseConfig.js` with your Firebase web config.
- Place your service account JSON in `common/firebaseServiceAccount.json`.

## 3. Start Backend
```
cd backend
node index.js
```

## 4. Start Frontend
```
cd frontend
npm run dev
```

## 5. Integration with med4u_beta
- Ensure both projects use the same Firebase project and shared config in `common/`.
- In `med4u_beta`, add a dashboard button: “Scan Hospital QR”.
- On scan, call `/user-grant-access` API with scanned QR and user consent.
- Backend issues temporary JWT access token.
- User can revoke access via `/revoke-access` API.

## 6. Testing Hospital ↔ User Connection
- Register/login as hospital/lab/doctor in Med4U Connect frontend.
- Generate QR from hospital dashboard.
- Scan QR in med4u_beta user dashboard, grant access.
- Upload/view reports as permitted.
- Revoke access and check audit logs.

## 7. Security
- All access tokens are JWT, expiring as per user consent.
- Reports should be encrypted before upload (implement in backend).
- Patients can view audit logs in their dashboard.

## 8. Push Notifications
- Use Firebase Cloud Messaging (FCM) for notifications when new reports are uploaded.

## 9. Role-Based Dashboards
- Hospital: manage staff, generate QR, view uploads.
- Doctor: view patient list, access reports.
- Lab: upload history, scan reports.

---

**Note:**
- Do not modify `med4u_beta` folder. Only use shared config from `common/`.
- For production, set strong JWT secret and enable HTTPS.
