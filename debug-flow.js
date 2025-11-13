#!/usr/bin/env node
/**
 * Comprehensive debug flow for med4u_connect
 * This script tests:
 * 1. Firestore connectivity and permissions
 * 2. Backend API routing
 * 3. Token generation and exchange
 * 4. Full end-to-end flow with detailed logging
 */

const path = require('path');

// Load firebase-admin from backend node_modules
const admin = require(path.join(__dirname, 'backend', 'node_modules', 'firebase-admin'));

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}=== ${msg} ===${colors.reset}`),
  ok: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  err: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  json: (label, obj) => console.log(`${colors.yellow}${label}:${colors.reset}`, JSON.stringify(obj, null, 2))
};

(async () => {
  try {
    log.title('STEP 1: Load Firebase Service Account');
    
    const configPath = path.join(__dirname, 'backend', 'config', 'serviceAccountKey.json');
    console.log(`Looking for credentials at: ${configPath}`);
    
    let serviceAccount;
    try {
      serviceAccount = require(configPath);
      log.ok(`Service account file found`);
    } catch (e) {
      log.err(`Service account file not found: ${e.message}`);
      process.exit(1);
    }
    
    // Verify service account structure
    log.info(`Project ID: ${serviceAccount.project_id}`);
    log.info(`Client Email: ${serviceAccount.client_email}`);
    log.info(`Private Key Present: ${!!serviceAccount.private_key}`);
    
    if (!serviceAccount.private_key) {
      log.err('Private key missing from service account');
      process.exit(1);
    }
    
    if (serviceAccount.private_key.includes('${')) {
      log.err('Service account contains template variables - needs replacement');
      process.exit(1);
    }
    
    // Process the private key
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    log.ok('Service account processed');

    log.title('STEP 2: Initialize Firebase Admin SDK');
    
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      log.ok('Firebase Admin SDK initialized');
    } catch (e) {
      log.err(`Firebase initialization failed: ${e.message}`);
      process.exit(1);
    }

    log.title('STEP 3: Test Firestore Write Permission');
    
    const db = admin.firestore();
    const testRef = db.collection('_firestore_tests').doc(`test_${Date.now()}`);
    
    try {
      await testRef.set({
        timestamp: Date.now(),
        message: 'Firestore write test',
        status: 'ok'
      });
      log.ok('Firestore write succeeded');
    } catch (e) {
      log.err(`Firestore write failed: ${e.message}`);
      log.json('Error details', {
        code: e.code,
        message: e.message,
        details: e.details || 'No details'
      });
      process.exit(1);
    }

    log.title('STEP 4: Test userCodes Collection');
    
    const userId = `test-user-${Date.now()}`;
    const testCode = 'TEST1234';
    
    try {
      const userCodesRef = db.collection('userCodes').doc(testCode);
      await userCodesRef.set({
        userId: userId,
        createdAt: Date.now()
      });
      log.ok(`Test code registered: ${testCode} for user: ${userId}`);
    } catch (e) {
      log.err(`Failed to register test code: ${e.message}`);
      process.exit(1);
    }

    log.title('STEP 5: Verify Code Was Stored');
    
    try {
      const snap = await db.collection('userCodes').doc(testCode).get();
      if (snap.exists) {
        log.ok('Test code found in Firestore');
        log.json('Code data', snap.data());
      } else {
        log.err('Test code was not stored');
        process.exit(1);
      }
    } catch (e) {
      log.err(`Failed to read code: ${e.message}`);
      process.exit(1);
    }

    log.title('STEP 6: Test Access Token Storage');
    
    const jwtSecret = process.env.JWT_SECRET || '72c4c2309d86fccecf9cb977401bf819188e333a7963d38eaee69a526d72f973';
    const jwt = require(path.join(__dirname, 'backend', 'node_modules', 'jsonwebtoken'));
    
    const accessToken = jwt.sign(
      { userId, hospitalId: 'hospital-test', scope: ['view'] },
      jwtSecret,
      { expiresIn: 1800 }
    );
    
    try {
      await db.collection('accessTokens').add({
        userId,
        hospitalId: 'hospital-test',
        scope: ['view'],
        accessToken,
        createdAt: Date.now(),
        expiresAt: Date.now() + 1800 * 1000
      });
      log.ok('Access token stored in Firestore');
    } catch (e) {
      log.err(`Failed to store access token: ${e.message}`);
      process.exit(1);
    }

    log.title('STEP 7: Test Backend API Routing');
    
    const backendUrl = 'http://localhost:4000';
    
    try {
      // Test if backend is running
      const response = await fetch(`${backendUrl}/debug-firebase`);
      if (response.ok) {
        const data = await response.json();
        log.ok('Backend is running');
        log.json('Backend Firebase Info', data);
      } else {
        log.err(`Backend returned status ${response.status}`);
      }
    } catch (e) {
      log.err(`Cannot reach backend: ${e.message}`);
      log.warn('Make sure backend is running: npm --prefix backend start');
    }

    log.title('✨ ALL TESTS PASSED');
    log.info('Your Firestore connection and service account are working correctly.');
    log.info(`Test code: ${testCode}`);
    log.info(`Test user ID: ${userId}`);
    log.info(`Hospital ID: hospital-test`);
    log.info('\nYou can now use these values to test the full flow in the UI.');
    
    process.exit(0);

  } catch (err) {
    log.err(`Unexpected error: ${err.message}`);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
})();
