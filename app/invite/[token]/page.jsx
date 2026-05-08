'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function InvitePage({ params }) {
  const [invite, setInvite] = useState(null);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`/api/org/invite/${params.token}`).then(res => res.json()).then(data => setInvite(data.invite));
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
  }, [params.token]);

  const signIn = async (event) => {
    event.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message);
    else setUser(data.user);
  };

  const accept = async () => {
    const { data } = await supabase.auth.getSession();
    const res = await fetch(`/api/org/invite/${params.token}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${data.session?.access_token || ''}` },
    });
    const result = await res.json();
    if (result.ok) window.location.href = '/';
    else setMessage(result.error?.message || 'Could not accept invite.');
  };

  return (
    <main style={{ minHeight: '100vh', background: '#0f1117', color: '#e8e8e4', display: 'grid', placeItems: 'center', padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 440, background: '#13151c', border: '1px solid #1e2128', borderRadius: 14, padding: 28 }}>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, marginBottom: 8 }}>Team invite</h1>
        {invite ? (
          <p style={{ color: '#888', lineHeight: 1.5 }}>You have been invited to join <strong style={{ color: '#00e5a0' }}>{invite.organisations?.name}</strong> as {invite.role}.</p>
        ) : <p style={{ color: '#888' }}>Loading invite…</p>}
        {!user ? (
          <form onSubmit={signIn} style={{ display: 'grid', gap: 12, marginTop: 20 }}>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={{ padding: 12, borderRadius: 8, background: '#0f1117', color: '#e8e8e4', border: '1px solid #2a2d35' }} />
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" style={{ padding: 12, borderRadius: 8, background: '#0f1117', color: '#e8e8e4', border: '1px solid #2a2d35' }} />
            <button style={{ minHeight: 44, borderRadius: 8, border: 0, background: '#00e5a0', color: '#0f1117', fontWeight: 700 }}>Sign in to accept</button>
          </form>
        ) : (
          <button onClick={accept} style={{ minHeight: 44, marginTop: 20, borderRadius: 8, border: 0, background: '#00e5a0', color: '#0f1117', fontWeight: 700, width: '100%' }}>Accept invite</button>
        )}
        {message && <p style={{ color: '#ef4444', marginTop: 12 }}>{message}</p>}
      </div>
    </main>
  );
}
