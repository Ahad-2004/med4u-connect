import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';

export default function ScanAndConnect({ hospitalId, onConnected }) {
  const [error, setError] = useState('');
  const [access, setAccess] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(true);
  const containerId = 'qr-reader';

  const handleConnectWithUserId = async (userId) => {
    setError('');
    try {
      const data = { accessToken: null, scope: ['view','upload'], userId };
      setAccess(data);
      onConnected && onConnected(data);
      try {
        const { auth, db } = await import('./firebaseConfig');
        const { addDoc, collection } = await import('firebase/firestore');
        const { currentUser } = (await import('firebase/auth')).getAuth();
        const uid = auth.currentUser?.uid || currentUser?.uid;
        if (uid && userId) {
          await addDoc(collection(db, 'doctorPatients'), { doctorId: uid, patientId: userId, lastAccessed: Date.now() });
        }
      } catch {}
      window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', message: 'Connected to patient' } }))
    } catch (e) {
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
    }, () => {});
    return () => {
      try { scanner.clear(); } catch {}
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
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* Camera */}
        <div className="rounded-xl border border-dashed border-gray-300 p-3 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Scan Patient QR</h3>
            <button className="btn btn-secondary px-2 py-1 text-xs" onClick={() => setScanning(s => !s)}>{scanning ? 'Stop' : 'Start'}</button>
          </div>
          <div id={containerId} style={{ maxWidth: 360 }} />
        </div>

        {/* Drag & drop / upload */}
        <div className="rounded-xl border border-dashed border-gray-300 p-3 dark:border-gray-700">
          <h3 className="text-sm font-medium mb-2">Upload QR Image or Enter Code</h3>
          <label className="block">
            <span className="label">Paste/Type Patient Code</span>
            <input className="input" placeholder="e.g., RM9X2A" value={manualCode} onChange={e => setManualCode(e.target.value)} />
          </label>
          <div className="mt-2 flex items-center gap-2">
            <button className="btn btn-primary" onClick={() => manualCode && handleConnectWithUserId(manualCode.trim())}>Connect</button>
            <label className="btn btn-secondary cursor-pointer">
              Upload Image
              <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            </label>
          </div>
          <div
            className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-500 dark:bg-gray-900"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
          >
            Drag & drop QR image here
          </div>
        </div>
      </div>

      {error && <div className="text-rose-600 text-sm">{error}</div>}
      {access && (
        <div className="text-emerald-700 dark:text-emerald-400 text-sm">Connected. Scope: {access.scope?.join(', ')}</div>
      )}
    </div>
  );
}

