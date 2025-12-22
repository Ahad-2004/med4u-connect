import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { apiRequest } from './services/api';

export default function ScanAndConnect({ hospitalId, onConnected }) {
  const [error, setError] = useState('');
  const [access, setAccess] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(true);
  const containerId = 'qr-reader';

  const handleConnectWithUserId = async (userId) => {
    setError('');
    try {
      // Get the current user (doctor) ID from Firebase Auth
      const { auth } = await import('./firebaseConfig');
      const { getAuth } = await import('firebase/auth');
      const firebaseAuth = getAuth();
      const uid = firebaseAuth.currentUser?.uid;

      // Exchange the scanned user code for a scoped access token from backend
      let token = null;
      let grantedScope = ['view'];
      let patientId = userId; // Start with scanned code as backup
      try {
        const resp = await apiRequest('/exchange-user-code', {
          method: 'POST',
          body: JSON.stringify({
            code: String(userId).toUpperCase(),
            hospitalId,
            doctorId: uid,
            requestedScope: ['view', 'upload']
          })
        });
        console.log('[FRONTEND] Token exchange response:', resp);
        token = resp.accessToken;
        grantedScope = resp.scope || grantedScope;
        patientId = resp.userId || userId; // Use the real Firebase user ID from backend
        console.log('[FRONTEND] Got token:', !!token, 'patientId:', patientId);
      } catch (err) {
        // If exchanging fails, continue but mark error
        console.error('[FRONTEND] Token exchange failed:', err.message);
        setError('Connected but token exchange failed');
      }

      if (!token) {
        console.error('[FRONTEND] No access token received from backend');
        setError('Failed to get access token');
        return;
      }

      const data = { accessToken: token, scope: grantedScope, userId: patientId };
      setAccess(data);
      onConnected && onConnected(data);
      window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', message: 'Connected to patient' } }))
    } catch (e) {
      console.error('[FRONTEND] Connection error:', e.message);
      setError('Failed to connect.');
    }
  };

  useEffect(() => {
    if (!scanning) return;
    const scanner = new Html5QrcodeScanner(containerId, { fps: 10, qrbox: 250 });
    scanner.render((decodedText) => {
      handleConnectWithUserId(decodedText);
      scanner.clear();
      setScanning(false);
    }, () => { });
    return () => {
      try { scanner.clear(); } catch { }
    };
  }, [scanning]);

  const onDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    try {
      const text = await Html5Qrcode.scanFile(file, true);
      if (text) return handleConnectWithUserId(text);
      setError('Could not read QR from image.');
    } catch {
      setError('Could not read QR from image.');
    }
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await Html5Qrcode.scanFile(file, true);
      if (text) return handleConnectWithUserId(text);
      setError('Could not read QR from image.');
    } catch {
      setError('Could not read QR from image.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Camera */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Scan Patient QR</h3>
            <button className="btn btn-secondary px-3 py-1.5 text-xs" onClick={() => setScanning(s => !s)}>
              {scanning ? 'Stop Camera' : 'Start Camera'}
            </button>
          </div>
          <div id={containerId} className="rounded-lg overflow-hidden" style={{ maxWidth: 360 }} />
        </div>

        {/* Manual Entry */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Manual Entry</h3>
          <div className="space-y-3">
            <div>
              <label className="label">Patient Code</label>
              <input
                className="input"
                placeholder="e.g., RM9X2A"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
              />
              <p className="helper-text">Enter the 6-character code from patient's app</p>
            </div>
            <button
              className="btn btn-primary w-full"
              onClick={() => manualCode && handleConnectWithUserId(manualCode.trim())}
              disabled={!manualCode.trim()}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M20 8v6m3-3h-6" />
              </svg>
              Connect to Patient
            </button>
          </div>
        </div>
      </div>

      {/* Upload QR Image */}
      <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Upload QR Image</h3>
          <label className="btn btn-secondary px-3 py-1.5 text-xs cursor-pointer">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <path d="M17 8l-5-5-5 5" />
              <path d="M12 3v12" />
            </svg>
            Choose File
            <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          </label>
        </div>
        <div
          className="rounded-lg bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 p-6 text-center transition-colors hover:border-blue-400 dark:hover:border-blue-500"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          <svg className="h-10 w-10 mx-auto text-gray-400 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          <p className="text-sm text-gray-600 dark:text-gray-300">Drag & drop QR code image here</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">or click "Choose File" above</p>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 flex items-start gap-2">
          <svg className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" />
          </svg>
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
      {access && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 flex items-start gap-2">
          <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1 14l-4-4 1.41-1.41L11 13.17l5.59-5.59L18 9l-7 7z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Connected successfully!</p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">Access granted: {access.scope?.join(', ')}</p>
          </div>
        </div>
      )}
    </div>
  );
}

