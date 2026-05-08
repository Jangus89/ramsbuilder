'use client';
import { useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export default function AuthScreen({ onDemo }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handle = async (e) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Restart the app to use local demo mode, or add Supabase environment variables to enable login.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');

    const { error } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
    } else if (mode === 'signup') {
      setMessage('Account created — check your email to confirm, then sign in.');
      setMode('login');
    }
    setLoading(false);
  };

  const inp = { style: { width: '100%', background: '#13151c', border: '1.5px solid #1e2128', borderRadius: 8, color: '#e8e8e4', fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '12px 14px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' } };

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 48 }}>
          <div style={{ width: 36, height: 36, background: '#00e5a0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#0f1117"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, fontWeight: 500, color: '#e8e8e4', letterSpacing: '-0.02em' }}>SafeFlow</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase' }}>RAMS Builder</div>
          </div>
        </div>

        {/* Card */}
        <div style={{ background: '#13151c', border: '1px solid #1e2128', borderRadius: 16, padding: 32 }}>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, fontWeight: 400, color: '#e8e8e4', marginBottom: 8 }}>
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h2>
          <p style={{ fontSize: 13, color: '#555', marginBottom: 28 }}>
            {mode === 'login' ? 'Access your company RAMS workspace.' : 'Set up your company RAMS workspace.'}
          </p>

          {message && (
            <div style={{ background: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.2)', borderRadius: 8, padding: '12px 14px', color: '#00e5a0', fontSize: 13, marginBottom: 20 }}>
              {message}
            </div>
          )}
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '12px 14px', color: '#ef4444', fontSize: 13, marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handle}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#888', fontWeight: 500, marginBottom: 6 }}>Email</label>
              <input {...inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required
                onFocus={e => e.target.style.borderColor = '#00e5a0'}
                onBlur={e => e.target.style.borderColor = '#1e2128'} />
            </div>
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#888', fontWeight: 500, marginBottom: 6 }}>Password</label>
              <input {...inp} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6}
                onFocus={e => e.target.style.borderColor = '#00e5a0'}
                onBlur={e => e.target.style.borderColor = '#1e2128'} />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', background: '#00e5a0', color: '#0f1117', border: 'none', borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, padding: '14px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, transition: 'all 0.2s' }}
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage(''); }}
              style={{ background: 'none', border: 'none', color: '#555', fontSize: 13, cursor: 'pointer' }}
            >
              {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>

          {onDemo && (
            <>
              <div style={{ height: 1, background: '#1e2128', margin: '24px 0' }} />
              <button
                type="button"
                onClick={onDemo}
                style={{ width: '100%', background: 'transparent', color: '#00e5a0', border: '1.5px solid rgba(0,229,160,0.3)', borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, padding: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Continue without signing in
              </button>
              <p style={{ fontSize: 11, color: '#555', lineHeight: 1.5, textAlign: 'center', marginTop: 10 }}>
                Local testing mode. Supabase-saved profile, history, and template storage are skipped.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
