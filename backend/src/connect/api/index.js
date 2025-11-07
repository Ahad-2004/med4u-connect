const express = require('express');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

console.log('[API] Starting initialization...');

let serviceAccount = null;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    console.log('[API] Loading Firebase credentials from environment variable');
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    console.log('[API] Firebase credentials loaded from env');
  } catch (e) {
    console.error('[API] Error parsing FIREBASE_SERVICE_ACCOUNT:', e.message);
  }
}

if (!serviceAccount) {
  try {
    console.log('[API] Attempting to load Firebase credentials from local file');
    serviceAccount = require('../../common/firebaseServiceAccount.json');
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    console.log('[API] Firebase credentials loaded from file');
  } catch (e) {
    console.error('[API] Error loading local Firebase credentials:', e.message);
  }
}

if (!admin.apps.length) {
  if (!serviceAccount) {
    console.error('[API] FATAL: No Firebase service account available');
    throw new Error('Firebase service account not configured');
  }
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('[API] Firebase Admin initialized');
}

const db = admin.firestore();
const app = express();

const corsOptions = {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(bodyParser.json());

app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  if (req.url.startsWith('/api/')) {
    req.url = req.url.slice(4);
    console.log(`[API] Stripped /api prefix, new URL: ${req.url}`);
  } else if (req.url === '/api') {
    req.url = '/';
  }
  next();
});

function encryptReport(buffer, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(buffer);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return { iv: iv.toString('hex'), data: encrypted.toString('hex') };
}

function generateUserCode(length = 8) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

app.get('/health', (req, res) => {
  console.log('[API] Health check called');
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/generate-hospital-qr', async (req, res) => {
  console.log('[API] Generate hospital QR requested');
  try {
    const { hospitalId } = req.body;
    if (!hospitalId) {
      return res.status(400).json({ error: 'hospitalId required' });
    }
    const expiresAt = Date.now() + 5 * 60 * 1000;
    const qrToken = jwt.sign({ hospitalId, expiresAt }, process.env.JWT_SECRET, { expiresIn: '5m' });
    console.log('[API] Hospital QR generated successfully');
    res.json({ qrToken, expiresAt });
  } catch (err) {
    console.error('[API] Error generating hospital QR:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/generate-user-connect-token', async (req, res) => {
  console.log('[API] Generate user connect token requested');
  try {
    const { userId, scope = ['view'], durationSeconds = 300 } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }
    const expiresInMs = Math.max(60, Math.min(3600, durationSeconds)) * 1000;
    const expiresAt = Date.now() + expiresInMs;
    const qrToken = jwt.sign({ userId, scope, expiresAt }, process.env.JWT_SECRET, { expiresIn: Math.ceil(expiresInMs / 1000) });
    console.log('[API] User connect token generated successfully');
    res.json({ qrToken, expiresAt });
  } catch (err) {
    console.error('[API] Error generating user connect token:', err);
    res.status(400).json({ error: 'Failed to generate token' });
  }
});

app.post('/exchange-user-token', async (req, res) => {
  console.log('[API] Exchange user token requested');
  try {
    const { qrToken, hospitalId, requestedScope = ['view'], durationSeconds = 1800 } = req.body;
    const decoded = jwt.verify(qrToken, process.env.JWT_SECRET);
    const allowed = Array.isArray(decoded.scope) ? decoded.scope : ['view'];
    const requested = Array.isArray(requestedScope) ? requestedScope : ['view'];
    const grantedScope = requested.filter(s => allowed.includes(s));
    if (grantedScope.length === 0) {
      console.log('[API] No scope granted');
      return res.status(403).json({ error: 'No scope granted' });
    }
    const ttl = Math.max(300, Math.min(24 * 3600, durationSeconds));
    const accessToken = jwt.sign({ userId: decoded.userId, hospitalId, scope: grantedScope }, process.env.JWT_SECRET, { expiresIn: ttl });
    await db.collection('accessTokens').add({ userId: decoded.userId, hospitalId, scope: grantedScope, accessToken, createdAt: Date.now(), expiresAt: Date.now() + ttl * 1000 });
    console.log('[API] User token exchanged successfully');
    res.json({ accessToken, scope: grantedScope });
  } catch (err) {
    console.error('[API] Error exchanging user token:', err);
    res.status(400).json({ error: 'Invalid or expired QR token' });
  }
});

app.post('/register-user-code', async (req, res) => {
  console.log('[API] Register user code requested');
  try {
    const { userId, code } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const existing = await db.collection('userCodes').where('userId', '==', userId).get();
    const batch = db.batch();
    existing.forEach(doc => batch.delete(doc.ref));
    if (!existing.empty) await batch.commit();

    let finalCode = (code || generateUserCode()).toUpperCase();
    for (let i = 0; i < 5; i++) {
      const snap = await db.collection('userCodes').doc(finalCode).get();
      if (!snap.exists) break;
      finalCode = generateUserCode();
    }
    await db.collection('userCodes').doc(finalCode).set({ userId, createdAt: Date.now() });
    console.log('[API] User code registered:', finalCode);
    res.json({ code: finalCode });
  } catch (err) {
    console.error('[API] Error registering user code:', err);
    res.status(400).json({ error: 'Failed to register code' });
  }
});

app.post('/exchange-user-code', async (req, res) => {
  console.log('[API] Exchange user code requested');
  try {
    const { code, hospitalId, requestedScope = ['view'], durationSeconds = 1800 } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'code required' });
    }
    const codeDoc = await db.collection('userCodes').doc(String(code).toUpperCase()).get();
    if (!codeDoc.exists) {
      console.log('[API] Code not found:', code);
      return res.status(404).json({ error: 'Code not found' });
    }
    const { userId } = codeDoc.data();
    const grantedScope = Array.isArray(requestedScope) ? requestedScope.filter(s => ['view','upload'].includes(s)) : ['view'];
    const ttl = Math.max(300, Math.min(24 * 3600, durationSeconds));
    const accessToken = jwt.sign({ userId, hospitalId, scope: grantedScope }, process.env.JWT_SECRET, { expiresIn: ttl });
    await db.collection('accessTokens').add({ userId, hospitalId, scope: grantedScope, accessToken, createdAt: Date.now(), expiresAt: Date.now() + ttl * 1000, via: 'code' });
    console.log('[API] User code exchanged successfully');
    res.json({ accessToken, scope: grantedScope, userId });
  } catch (err) {
    console.error('[API] Error exchanging user code:', err);
    res.status(400).json({ error: 'Failed to exchange code' });
  }
});

app.post('/user-grant-access', async (req, res) => {
  console.log('[API] User grant access requested');
  try {
    const { userId, qrToken, scope, duration } = req.body;
    const decoded = jwt.verify(qrToken, process.env.JWT_SECRET);
    const accessToken = jwt.sign({ userId, hospitalId: decoded.hospitalId, scope, duration }, process.env.JWT_SECRET, { expiresIn: duration });
    await db.collection('accessTokens').add({ userId, hospitalId: decoded.hospitalId, scope, duration, accessToken, createdAt: Date.now() });
    console.log('[API] Access granted successfully');
    res.json({ accessToken });
  } catch (err) {
    console.error('[API] Error granting access:', err);
    res.status(400).json({ error: 'Invalid or expired QR token' });
  }
});

app.post('/hospital-upload-report', async (req, res) => {
  console.log('[API] Hospital upload report requested');
  try {
    const { accessToken, patientId, reportTitle, reportType, reportDate, reportUrl, fileSize, fileType, summary } = req.body;
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    if (!decoded.scope.includes('upload')) {
      console.log('[API] No upload permission');
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
      storageProvider: reportUrl ? 'external' : null,
      summary: summary || { findings: [{ name: 'No findings', value: '', unit: '', normal: '' }] }
    };
    await db.collection('reports').add(reportDoc);
    await db.collection('auditLogs').add({ patientId, action: 'upload', by: decoded.hospitalId, at: Date.now() });
    console.log('[API] Report uploaded successfully');
    res.json({ success: true });
  } catch (err) {
    console.error('[API] Error uploading report:', err);
    res.status(400).json({ error: 'Invalid or expired access token' });
  }
});

app.post('/hospital-get-reports', async (req, res) => {
  console.log('[API] Hospital get reports requested');
  try {
    const { accessToken, patientId } = req.body;
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    if (!decoded.scope.includes('view')) {
      console.log('[API] No view permission');
      return res.status(403).json({ error: 'No view permission' });
    }
    const snap = await db.collection('reports').where('userId', '==', patientId).get();
    const reports = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    await db.collection('auditLogs').add({ patientId, action: 'view_reports', by: decoded.hospitalId, at: Date.now() });
    console.log('[API] Reports fetched successfully, count:', reports.length);
    res.json({ reports });
  } catch (err) {
    console.error('[API] Error fetching reports:', err);
    res.status(400).json({ error: 'Invalid or expired access token' });
  }
});

app.post('/hospital-get-profile', async (req, res) => {
  console.log('[API] Hospital get profile requested');
  try {
    const { accessToken, patientId } = req.body;
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    if (!decoded.scope.includes('view')) {
      console.log('[API] No view permission');
      return res.status(403).json({ error: 'No view permission' });
    }

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
    console.log('[API] Profile fetched successfully');
    res.json({ medications, conditions, cases, recentReports: reports });
  } catch (err) {
    console.error('[API] Error fetching profile:', err);
    res.status(400).json({ error: 'Invalid or expired access token' });
  }
});

app.post('/revoke-access', async (req, res) => {
  console.log('[API] Revoke access requested');
  try {
    const { userId, hospitalId } = req.body;
    const tokensSnap = await db.collection('accessTokens').where('userId', '==', userId).where('hospitalId', '==', hospitalId).get();
    const batch = db.batch();
    tokensSnap.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    await db.collection('auditLogs').add({ patientId: userId, action: 'revoke', by: userId, at: Date.now() });
    console.log('[API] Access revoked successfully');
    res.json({ success: true });
  } catch (err) {
    console.error('[API] Error revoking access:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

console.log('[API] All routes registered');

module.exports = app;
