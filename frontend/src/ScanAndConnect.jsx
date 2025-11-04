import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function ScanAndConnect({ hospitalId, onConnected }) {
  const [error, setError] = useState('');
  const [access, setAccess] = useState(null);
  const scannerRef = useRef(null);
  const containerId = 'qr-reader';

  const handleConnectWithUserId = async (userId) => {
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
    } catch (e) {
      setError('Failed to connect.');
    }
  };

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(containerId, { fps: 10, qrbox: 250 });
    scanner.render((decodedText) => {
      handleConnectWithUserId(decodedText);
      scanner.clear();
    }, (err) => {
      // ignore scan errors
    });
    scannerRef.current = scanner;
    return () => {
      try { scanner.clear(); } catch {}
    };
  }, []);

  return (
    <div>
      <h3>Scan Patient QR</h3>
      <div id={containerId} style={{ maxWidth: 360 }} />
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      {access && (
        <div style={{ marginTop: 8 }}>
          <div>Connected. Scope: {access.scope?.join(', ')}</div>
        </div>
      )}
    </div>
  );
}


