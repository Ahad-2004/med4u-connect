import React, { useState } from 'react';
import { db } from '../../common/firebaseConfig';
import { QRCode } from 'qrcode.react';
import { Button, Card } from '@shadcn/ui';

export default function HospitalDashboard({ user }) {
  const [qr, setQr] = useState('');
  const [expiry, setExpiry] = useState(null);

  const generateQR = async () => {
    const expiresAt = Date.now() + 5 * 60 * 1000;
    const qrData = JSON.stringify({ hospitalId: user.uid, expiresAt });
    setQr(qrData);
    setExpiry(expiresAt);
    // Optionally call backend to store QR session
  };

  return (
    <Card>
      <h2>Hospital Dashboard</h2>
      <Button onClick={generateQR}>Generate QR (5 min expiry)</Button>
      {qr && <QRCode value={qr} />}
      {expiry && <div>Expires at: {new Date(expiry).toLocaleTimeString()}</div>}
      {/* Add upload/report features here */}
    </Card>
  );
}
