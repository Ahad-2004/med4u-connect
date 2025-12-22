// Express backend for Med4U Connect
require('dotenv').config();
const path = require('path');

// Environment validation
function validateEnvironment() {
  const required = ['JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('[FATAL] Missing required environment variables:', missing.join(', '));
    console.error('[FATAL] Please set these environment variables and restart the server');
    process.exit(1);
  }
  
  // Validate JWT_SECRET is sufficiently strong
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    console.error('[FATAL] JWT_SECRET must be at least 16 characters long for security');
    console.error('[FATAL] Current JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
    process.exit(1);
  }
  
  console.log('[ENV] All required environment variables validated');
  console.log('[ENV] JWT_SECRET length:', process.env.JWT_SECRET.length);
}

validateEnvironment();
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

// CORS configuration: reflect allowed origin and allow credentials
const FRONTEND_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && FRONTEND_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  // Always allow these headers for preflight and simple requests
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
// Parse JSON bodies with increased limit for file metadata
app.use(bodyParser.json({ limit: '10mb' }));

// Debug endpoint - local only. Returns service account and project info to help diagnose auth issues.
app.get('/debug-firebase', (req, res) => {
  try {
    const info = {
      initializedApps: admin.apps.length,
      projectId: (admin.app && admin.app().options && admin.app().options.projectId) || serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKeyPresent: !!serviceAccount.private_key
    };
    res.json(info);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read admin info', details: err && err.message });
  }
});

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
    
    console.log(`[API] Register user code request: userId=${userId}, code=${code}`);
    console.log(`[DEBUG] Request body:`, JSON.stringify(req.body));

    // Remove existing codes for this user
    console.log(`[DEBUG] Checking for existing codes for user: ${userId}`);
    const existing = await db.collection('userCodes').where('userId', '==', userId).get();
    console.log(`[DEBUG] Found ${existing.size} existing codes`);
    
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
    
    console.log(`[DEBUG] Writing code to Firestore: ${finalCode}`);
    await db.collection('userCodes').doc(finalCode).set({ userId, createdAt: Date.now() });
    console.log(`[SUCCESS] Code registered: ${finalCode}`);
    
    res.json({ code: finalCode });
  } catch (err) {
    console.error('[API] Register user code error:', err && err.message ? err.message : err);
    console.error('[API] Error code:', err && err.code);
    if (err && err.stack) console.error('[API] Stack:', err.stack);
    res.status(400).json({ 
      error: 'Failed to register code', 
      details: err && err.message,
      code: err && err.code
    });
  }
});

// JWT diagnostic endpoint
app.get('/debug-jwt', (req, res) => {
  try {
    console.log('[DEBUG] JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('[DEBUG] JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
    
    const testToken = jwt.sign({ test: 'data' }, process.env.JWT_SECRET, { expiresIn: 60 });
    const decoded = jwt.verify(testToken, process.env.JWT_SECRET);
    
    res.json({ 
      success: true,
      jwtSecretExists: !!process.env.JWT_SECRET,
      jwtSecretLength: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
      testTokenGenerated: true,
      testTokenDecoded: decoded
    });
  } catch (err) {
    console.error('[DEBUG] JWT test failed:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message,
      jwtSecretExists: !!process.env.JWT_SECRET,
      jwtSecretLength: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0
    });
  }
});

// Exchange a user's code for a scoped access token
// Body: { code, hospitalId, requestedScope, durationSeconds, doctorId? }
app.post('/exchange-user-code', async (req, res) => {
  try {
    const { code, hospitalId, requestedScope = ['view'], durationSeconds = 1800, doctorId } = req.body;
    console.log(`[API] Exchange code request: code=${code}, hospitalId=${hospitalId}, doctorId=${doctorId}, scope=${JSON.stringify(requestedScope)}`);
    console.log(`[DEBUG] Full request body:`, JSON.stringify(req.body));
    
    console.log(`[DEBUG] Looking up code: ${code}`);
    const codeDoc = await db.collection('userCodes').doc(String(code).toUpperCase()).get();
    
    if (!codeDoc.exists) {
      console.log(`[DEBUG] Code not found: ${code}`);
      return res.status(404).json({ error: 'Code not found' });
    }
    
    const { userId } = codeDoc.data();
    console.log(`[DEBUG] Code found, userId: ${userId}`);
    
    const grantedScope = Array.isArray(requestedScope) ? requestedScope.filter(s => ['view','upload'].includes(s)) : ['view'];
    const ttl = Math.max(300, Math.min(24 * 3600, durationSeconds));
    const accessToken = jwt.sign({ userId, hospitalId, scope: grantedScope }, process.env.JWT_SECRET, { expiresIn: ttl });
    
    console.log(`[DEBUG] Generated access token, storing to Firestore`);
    await db.collection('accessTokens').add({ userId, hospitalId, scope: grantedScope, accessToken, createdAt: Date.now(), expiresAt: Date.now() + ttl * 1000, via: 'code' });
    
    // Track doctor-patient connection if doctorId is provided
    if (doctorId && hospitalId) {
      console.log(`[DEBUG] Recording doctor-patient connection: doctorId=${doctorId}, patientId=${userId}`);
      try {
        await db.collection('doctorPatients').add({ 
          doctorId, 
          patientId: userId, 
          hospitalId,
          lastAccessed: Date.now() 
        });
      } catch (connErr) {
        console.warn(`[WARN] Failed to record doctor-patient connection: ${connErr.message}`);
        // Non-blocking - don't fail the token exchange if connection tracking fails
      }
    }
    
    console.log(`[SUCCESS] Token exchange complete for userId: ${userId}`);
    res.json({ accessToken, scope: grantedScope, userId });
  } catch (err) {
    console.error('[API] Exchange code error:', err && err.message ? err.message : err);
    console.error('[API] Error code:', err && err.code);
    if (err && err.stack) console.error('[API] Stack:', err.stack);
    res.status(400).json({ 
      error: 'Failed to exchange code', 
      details: err && err.message,
      code: err && err.code
    });
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
  console.log('[API] ========== Hospital upload report requested ==========');
  console.log('[DEBUG] Content-Type:', req.get('Content-Type'));
  console.log('[DEBUG] Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('[DEBUG] typeof req.body:', typeof req.body);
  console.log('[DEBUG] req.body keys:', req.body ? Object.keys(req.body) : 'body is null/undefined');
  console.log('[DEBUG] Full Request body:', JSON.stringify(req.body, null, 2));
  
  // Support token supplied either in Authorization header (Bearer ...) or in request body.accessToken
  const headerToken = req.headers.authorization?.split('Bearer ')[1];
  const bodyToken = req.body?.accessToken;
  const { patientId, reportTitle, reportType, reportDate, reportUrl, fileSize, fileType, summary } = req.body || {};
  const token = headerToken || bodyToken;
  
  console.log('[DEBUG] Extracted values:');
  console.log('  - headerToken present:', !!headerToken);
  console.log('  - bodyToken value:', bodyToken ? bodyToken.substring(0, 20) + '...' : 'undefined');
  console.log('  - token present:', !!token);
  console.log('  - patientId:', patientId);
  
  if (!token) {
    console.error('[API] ❌ No token provided - header:', !!headerToken, ', body:', !!bodyToken);
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[DEBUG] Token decoded:', decoded);
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
  // Support token supplied either in Authorization header (Bearer ...) or in request body.accessToken
  const headerToken = req.headers.authorization?.split('Bearer ')[1];
  const { accessToken: bodyToken, patientId } = req.body;
  const token = headerToken || bodyToken;
  if (!token) return res.status(401).json({ error: 'No authorization token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.scope.includes('view')) return res.status(403).json({ error: 'No view permission' });
    const snap = await db.collection('reports').where('userId', '==', patientId).get();
    const reports = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    await db.collection('auditLogs').add({ patientId, action: 'view_reports', by: decoded.hospitalId, at: Date.now() });
    res.json({ reports });
  } catch (err) {
    console.error('[API] Error in /hospital-get-reports:', err.message);
    res.status(400).json({ error: 'Invalid or expired access token', details: err.message });
  }
});

// Hospital fetches key patient profile data
// Body: { accessToken, patientId }
app.post('/hospital-get-profile', async (req, res) => {
  // Support token supplied either in Authorization header (Bearer ...) or in request body.accessToken
  const headerToken = req.headers.authorization?.split('Bearer ')[1];
  const { accessToken: bodyToken, patientId } = req.body;
  const token = headerToken || bodyToken;
  if (!token) return res.status(401).json({ error: 'No authorization token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.scope.includes('view')) return res.status(403).json({ error: 'No view permission' });

    async function getByCollection(name) {
      const qs = await db.collection(name).where('userId', '==', patientId).get();
      return qs.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    const [medications, conditions, cases, reports] = await Promise.all([
      getByCollection('medications'),
      getByCollection('conditions'),
      getByCollection('cases'),
      (await db.collection('reports').where('userId', '==', patientId).get()).docs.map(d => ({ id: d.id, ...d.data() }))
    ]);

    await db.collection('auditLogs').add({ patientId, action: 'view_profile', by: decoded.hospitalId, at: Date.now() });
    res.json({ medications, conditions, cases, recentReports: reports });
  } catch (err) {
    console.error('[API] Error in /hospital-get-profile:', err.message);
    res.status(400).json({ error: 'Invalid or expired access token', details: err.message });
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

// Global error handler for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[SERVER] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[SERVER] Uncaught Exception:', error);
  process.exit(1);
});

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => console.log(`Med4U Connect backend running on port ${PORT}`));

// Handle server errors
server.on('error', (err) => {
  console.error('[SERVER] Server error:', err);
});
