import React, { useState } from 'react';

const API_BASE = import.meta.env.VITE_CONNECT_API_BASE || 'http://localhost:4000';

export default function CodeConnect({ hospitalId, onConnected }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const connect = async (e) => {
    e.preventDefault();
    setError('');
    const trimmed = code.trim();
    if (!trimmed) { setError('Enter a code'); return; }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/exchange-user-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: trimmed,
          hospitalId: hospitalId || 'unknown-hospital',
          requestedScope: ['view','upload'],
          durationSeconds: 3600
        })
      });
      if (!res.ok) throw new Error('Invalid code or access denied');
      const data = await res.json();
      onConnected && onConnected({ accessToken: data.accessToken, scope: data.scope, userId: data.userId });
    } catch (err) {
      setError('Failed to connect with code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={connect} className="flex items-start gap-2">
      <div className="flex-1">
        <label className="label">Patient Code</label>
        <input
          className="input font-mono tracking-widest"
          placeholder="e.g. ABCD1234"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
        />
      </div>
      <div className="pt-7">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Connecting…' : 'Connect'}
        </button>
      </div>
      {error && <div className="text-red-600 text-sm pt-9">{error}</div>}
    </form>
  );
}


