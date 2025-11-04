import React, { useState } from 'react';
import { useAuth } from './AuthContext';

export default function Login() {
  const { login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const safeEmail = email.trim();
      const safePassword = password;
      if (mode === 'login') await login(safeEmail, safePassword);
      else await register(safeEmail, safePassword);
    } catch (e) {
      setError(e.code || e.message || 'Auth failed');
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: '64px auto' }}>
      <h2 style={{ marginBottom: 16 }}>{mode === 'login' ? 'Doctor Login' : 'Doctor Register'}</h2>
      <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
        <input type="email" placeholder="Email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit">{mode === 'login' ? 'Login' : 'Register'}</button>
        {error && <div style={{ color: 'red' }}>{error}</div>}
      </form>
      <div style={{ marginTop: 12 }}>
        {mode === 'login' ? (
          <button onClick={() => setMode('register')}>Need an account? Register</button>
        ) : (
          <button onClick={() => setMode('login')}>Have an account? Login</button>
        )}
      </div>
    </div>
  );
}
