import React, { useState } from 'react';
import { useAuth } from './AuthContext';

export default function Login() {
  const { login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const safeEmail = email.trim();
      const safePassword = password;
      if (mode === 'login') await login(safeEmail, safePassword);
      else await register(safeEmail, safePassword);
    } catch (e) {
      setError(e.code || e.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold text-2xl shadow-lg mb-4">
            M4U
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Med4U Connect</h1>
          <p className="text-gray-600">Doctor & Hospital Portal</p>
        </div>

        {/* Login Card */}
        <div className="card p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                placeholder="doctor@hospital.com"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input"
                required
              />
              {mode === 'register' && (
                <p className="helper-text">Password should be at least 6 characters</p>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign In'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Secure medical portal for healthcare professionals
        </p>
      </div>
    </div>
  );
}
