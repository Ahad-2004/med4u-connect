// Express backend for Med4U Connect
require('dotenv').config();
const express = require('express');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

console.log('[SERVER] Initializing Firebase Admin SDK...');

// Load Firebase Admin SDK config from environment variables or local file
let serviceAccount = null;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    console.log('[SERVER] Loading Firebase credentials from environment variable');
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    console.log('[SERVER] Firebase credentials loaded from env');
  } catch (e) {
    console.error('[SERVER] Error parsing FIREBASE_SERVICE_ACCOUNT:', e.message);
  }
}

if (!serviceAccount) {
  try {
    console.log('[SERVER] Attempting to load Firebase credentials from local file');
    const configPath = path.join(__dirname, 'config', 'serviceAccountKey.json');
    serviceAccount = require(configPath);
    
    // Replace template variables with environment values
    if (serviceAccount.private_key === '${FIREBASE_PRIVATE_KEY}') {
      serviceAccount.private_key = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    }
    if (serviceAccount.client_email === '${FIREBASE_CLIENT_EMAIL}') {
      serviceAccount.client_email = process.env.FIREBASE_CLIENT_EMAIL;
    }
    if (serviceAccount.client_id === '${FIREBASE_CLIENT_ID}') {
      serviceAccount.client_id = process.env.FIREBASE_CLIENT_ID;
    }
    console.log('[SERVER] Firebase credentials loaded and processed from file');
  } catch (e) {
    console.error('[SERVER] Error loading local Firebase credentials:', e.message);
  }
}

if (!admin.apps.length) {
  if (!serviceAccount) {
    console.error('[SERVER] FATAL: No Firebase service account available');
    throw new Error('Firebase service account not configured');
  }
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('[SERVER] Firebase Admin SDK initialized successfully');
}

const db = admin.firestore();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Utility: Encrypt report
function encryptReport(buffer, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(buffer);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return { iv: iv.toString('hex'), data: encrypted.toString('hex') };
}

// Utility: Generate short user code
function generateUserCode(length = 8) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

// Generate dynamic QR (hospital side)
app.post('/generate-hospital-qr', async (req, res) => {
  const { hospitalId } = req.body;
  const expiresAt = Date.now() + 5 * 60 * 1000;
  const qrToken = jwt.sign({ hospitalId, expiresAt }, process.env.JWT_SECRET, { expiresIn: '5m' });
  res.json({ qrToken, expiresAt });
});

// Generate user connect token (personal app shows this as QR)
// Body: { userId, scope: ['view','upload'], durationSeconds }
app.post('/generate-user-connect-token', async (req, res) => {
  try {
    const { userId, scope = ['view'], durationSeconds = 300 } = req.body;
    const expiresInMs = Math.max(60, Math.min(3600, durationSeconds)) * 1000;
    const expiresAt = Date.now() + expiresInMs;
    const qrToken = jwt.sign({ userId, scope, expiresAt }, process.env.JWT_SECRET, { expiresIn: Math.ceil(expiresInMs / 1000) });
    res.json({ qrToken, expiresAt });
  } catch (err) {
    res.status(400).json({ error: 'Failed to generate token' });
  }
});

// Hospital scans user's QR and exchanges for scoped access token
// Body: { qrToken, hospitalId, requestedScope: ['view','upload'], durationSeconds }
app.post('/exchange-user-token', async (req, res) => {
  try {
    const { qrToken, hospitalId, requestedScope = ['view'], durationSeconds = 1800 } = req.body;
    const decoded = jwt.verify(qrToken, process.env.JWT_SECRET);
    const allowed = Array.isArray(decoded.scope) ? decoded.scope : ['view'];
    const requested = Array.isArray(requestedScope) ? requestedScope : ['view'];
    const grantedScope = requested.filter(s => allowed.includes(s));
    if (grantedScope.length === 0) return res.status(403).json({ error: 'No scope granted' });
    const ttl = Math.max(300, Math.min(24 * 3600, durationSeconds));
    const accessToken = jwt.sign({ userId: decoded.userId, hospitalId, scope: grantedScope }, process.env.JWT_SECRET, { expiresIn: ttl });
    await db.collection('accessTokens').add({ userId: decoded.userId, hospitalId, scope: grantedScope, accessToken, createdAt: Date.now(), expiresAt: Date.now() + ttl * 1000 });
    res.json({ accessToken, scope: grantedScope });
  } catch (err) {
    res.status(400).json({ error: 'Invalid or expired QR token' });
  }
});

// Register or regenerate a user's unique connection code
// Body: { userId, code? }
app.post('/register-user-code', async (req, res) => {
  try {
    const { userId, code } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    // Remove existing codes for this user
    const existing = await db.collection('userCodes').where('userId', '==', userId).get();
    const batch = db.batch();
    existing.forEach(doc => batch.delete(doc.ref));
    if (!existing.empty) await batch.commit();

    // Try a few times to avoid collisions
    let finalCode = (code || generateUserCode()).toUpperCase();
    for (let i = 0; i < 5; i++) {
      const snap = await db.collection('userCodes').doc(finalCode).get();
      if (!snap.exists) break;
      finalCode = generateUserCode();
    }
    await db.collection('userCodes').doc(finalCode).set({ userId, createdAt: Date.now() });
    res.json({ code: finalCode });
  } catch (err) {
    res.status(400).json({ error: 'Failed to register code' });
  }
});

// Exchange a user's code for a scoped access token
// Body: { code, hospitalId, requestedScope, durationSeconds }
app.post('/exchange-user-code', async (req, res) => {
  try {
    const { code, hospitalId, requestedScope = ['view'], durationSeconds = 1800 } = req.body;
    const codeDoc = await db.collection('userCodes').doc(String(code).toUpperCase()).get();
    if (!codeDoc.exists) return res.status(404).json({ error: 'Code not found' });
    const { userId } = codeDoc.data();
    const grantedScope = Array.isArray(requestedScope) ? requestedScope.filter(s => ['view','upload'].includes(s)) : ['view'];
    const ttl = Math.max(300, Math.min(24 * 3600, durationSeconds));
    const accessToken = jwt.sign({ userId, hospitalId, scope: grantedScope }, process.env.JWT_SECRET, { expiresIn: ttl });
    await db.collection('accessTokens').add({ userId, hospitalId, scope: grantedScope, accessToken, createdAt: Date.now(), expiresAt: Date.now() + ttl * 1000, via: 'code' });
    res.json({ accessToken, scope: grantedScope, userId });
  } catch (err) {
    res.status(400).json({ error: 'Failed to exchange code' });
  }
});

// User grants access after scanning QR
app.post('/user-grant-access', async (req, res) => {
  const { userId, qrToken, scope, duration } = req.body;
  try {
    const decoded = jwt.verify(qrToken, process.env.JWT_SECRET);
    const accessToken = jwt.sign({ userId, hospitalId: decoded.hospitalId, scope, duration }, process.env.JWT_SECRET, { expiresIn: duration });
    // Store access in Firestore
    await db.collection('accessTokens').add({ userId, hospitalId: decoded.hospitalId, scope, duration, accessToken, createdAt: Date.now() });
    res.json({ accessToken });
  } catch (err) {
    res.status(400).json({ error: 'Invalid or expired QR token' });
  }
});

// File upload configuration
const { upload } = require('./config/upload');

// File upload endpoint
app.post('/upload-report-file', upload.single('file'), async (req, res) => {
  console.log('[SERVER] File upload requested');
  try {
    if (!req.file) {
      throw new Error('No file uploaded');
    }
    console.log('[SERVER] File uploaded successfully:', req.file.path);
    res.json({
      success: true,
      fileUrl: req.file.path,
      fileSize: req.file.size,
      fileType: req.file.mimetype
    });
  } catch (err) {
    console.error('[SERVER] Error uploading file:', err);
    res.status(400).json({
      error: 'File upload failed',
      details: err.message
    });
  }
});

// Hospital uploads report (align with Med4U 'reports' collection schema)
// Body: { accessToken, patientId, reportTitle, reportType, reportDate, reportUrl, fileSize, fileType, summary }
app.post('/hospital-upload-report', async (req, res) => {
  console.log('[API] Hospital upload report requested');
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  const { patientId, reportTitle, reportType, reportDate, reportUrl, fileSize, fileType, summary } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.scope.includes('upload')) {
      console.log('[API] Upload permission denied');
      return res.status(403).json({ error: 'No upload permission' });
    }
    const reportDoc = {
      title: reportTitle || 'Hospital Upload',
      type: reportType || 'Lab Results',
      date: reportDate || new Date().toISOString().slice(0, 10),
      userId: patientId,
      uploadedAt: new Date().toISOString(),
      uploadedBy: decoded.hospitalId,
      downloadURL: reportUrl || null,
      fileSize: fileSize || null,
      fileType: fileType || null,
      storageProvider: reportUrl ? 'cloudinary' : null,
      summary: summary || { findings: [{ name: 'No findings', value: '', unit: '', normal: '' }] }
    };
    const docRef = await db.collection('reports').add(reportDoc);
    await db.collection('auditLogs').add({ patientId, action: 'upload', by: decoded.hospitalId, reportId: docRef.id, at: Date.now() });
    console.log('[SERVER] Report uploaded successfully:', docRef.id);
    res.json({ success: true, reportId: docRef.id });
  } catch (err) {
    console.error('[SERVER] Error uploading report:', err);
    res.status(400).json({ error: 'Invalid or expired access token' });
  }
});

// Hospital fetches reports (from 'reports' collection filtered by userId)
app.post('/hospital-get-reports', async (req, res) => {
  const { accessToken, patientId } = req.body;
  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    if (!decoded.scope.includes('view')) return res.status(403).json({ error: 'No view permission' });
    const snap = await db.collection('reports').where('userId', '==', patientId).get();
    const reports = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    await db.collection('auditLogs').add({ patientId, action: 'view_reports', by: decoded.hospitalId, at: Date.now() });
    res.json({ reports });
  } catch (err) {
    res.status(400).json({ error: 'Invalid or expired access token' });
  }
});

// Hospital fetches key patient profile data
// Body: { accessToken, patientId }
app.post('/hospital-get-profile', async (req, res) => {
  const { accessToken, patientId } = req.body;
  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    if (!decoded.scope.includes('view')) return res.status(403).json({ error: 'No view permission' });

    async function getByCollection(name) {
      const qs = await db.collection(name).where('userId', '==', patientId).get();
      return qs.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    const [medications, conditions, cases, reports] = await Promise.all([
      getByCollection('medications'),
      getByCollection('conditions'),
      getByCollection('cases'),
      (await db.collection('reports').where('userId', '==', patientId).limit(5).get()).docs.map(d => ({ id: d.id, ...d.data() }))
    ]);

    await db.collection('auditLogs').add({ patientId, action: 'view_profile', by: decoded.hospitalId, at: Date.now() });
    res.json({ medications, conditions, cases, recentReports: reports });
  } catch (err) {
    res.status(400).json({ error: 'Invalid or expired access token' });
  }
});

// User revokes access
app.post('/revoke-access', async (req, res) => {
  const { userId, hospitalId } = req.body;
  // Remove access tokens from Firestore
  const tokensSnap = await db.collection('accessTokens').where('userId', '==', userId).where('hospitalId', '==', hospitalId).get();
  const batch = db.batch();
  tokensSnap.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  // Audit log
  await db.collection('auditLogs').add({ patientId: userId, action: 'revoke', by: userId, at: Date.now() });
  res.json({ success: true });
});

// TODO: Push notification endpoint

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Med4U Connect backend running on port ${PORT}`));
