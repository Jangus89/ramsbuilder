'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const btn = { background: 'transparent', border: '1px solid #2a2d35', borderRadius: 8, color: '#888', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '8px 12px' };
const input = { width: '100%', background: '#13151c', border: '1.5px solid #1e2128', borderRadius: 8, color: '#e8e8e4', fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '10px 12px', boxSizing: 'border-box' };

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${data.session?.access_token || ''}` };
}

export default function OrgSettings({ user, org, orgRole, onOrgChange }) {
  const [name, setName] = useState(org?.name || '');
  const [members, setMembers] = useState([]);
  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [message, setMessage] = useState('');
  const canAdmin = orgRole === 'owner' || orgRole === 'admin';

  useEffect(() => {
    setName(org?.name || '');
    if (!org?.id) return;
    supabase.from('org_members').select('*').eq('org_id', org.id).order('created_at').then(({ data }) => setMembers(data || []));
  }, [org?.id]);

  const createOrg = async () => {
    const res = await fetch('/api/org/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (data.org) {
      onOrgChange({ org: data.org, role: 'owner', memberCount: 1 });
      setMessage('Organisation created.');
    }
  };

  const saveOrgName = async () => {
    if (!org?.id || !canAdmin) return;
    const { data } = await supabase.from('organisations').update({ name }).eq('id', org.id).select('*').single();
    if (data) onOrgChange({ org: data, role: orgRole, memberCount: members.length });
  };

  const invite = async () => {
    const res = await fetch('/api/org/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify({ orgId: org.id, email, role: inviteRole }),
    });
    const data = await res.json();
    setMessage(data.inviteLink ? `Invite created: ${data.inviteLink}` : data.error?.message || 'Invite failed');
    setEmail('');
  };

  const removeMember = async (memberId) => {
    await fetch(`/api/org/members/${memberId}`, { method: 'DELETE', headers: await authHeaders() });
    setMembers(prev => prev.filter(member => member.id !== memberId));
  };

  const changeRole = async (memberId, role) => {
    const res = await fetch(`/api/org/members/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (data.member) setMembers(prev => prev.map(member => member.id === memberId ? data.member : member));
  };

  if (!org?.id) {
    return (
      <div>
        <h3 style={{ color: '#e8e8e4', fontSize: 18, marginBottom: 10 }}>Create your organisation</h3>
        <p style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>Team workspaces let members share RAMS history, procedures, templates, signatures, and audit trails.</p>
        <input style={input} value={name} onChange={event => setName(event.target.value)} placeholder="Organisation name" />
        <button style={{ ...btn, marginTop: 12, color: '#00e5a0' }} onClick={createOrg}>Create organisation</button>
        {message && <div style={{ color: '#00e5a0', fontSize: 12, marginTop: 10 }}>{message}</div>}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginBottom: 24 }}>
        <input style={input} value={name} onChange={event => setName(event.target.value)} disabled={!canAdmin} />
        <button style={btn} onClick={saveOrgName} disabled={!canAdmin}>Save</button>
      </div>

      <div style={{ fontFamily: "'DM Mono', monospace", color: '#555', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Members</div>
      {members.map(member => (
        <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, border: '1px solid #1e2128', borderRadius: 8, padding: 12, marginBottom: 8 }}>
          <div style={{ color: '#c0c0b8', fontSize: 13 }}>
            {member.user_id === user.id ? user.email : member.invited_email || member.user_id}
            <span style={{ marginLeft: 8, color: '#00e5a0', fontSize: 11, textTransform: 'uppercase' }}>{member.role}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {orgRole === 'owner' && member.role !== 'owner' && (
              <select value={member.role} onChange={event => changeRole(member.id, event.target.value)} style={{ ...input, width: 110, padding: '7px 8px' }}>
                <option value="admin">Admin</option>
                <option value="member">Member</option>
              </select>
            )}
            {canAdmin && member.role !== 'owner' && <button style={btn} onClick={() => removeMember(member.id)}>Remove</button>}
          </div>
        </div>
      ))}

      {canAdmin && (
        <div style={{ marginTop: 24, borderTop: '1px solid #1e2128', paddingTop: 20 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", color: '#555', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Invite member</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px auto', gap: 10 }}>
            <input style={input} type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="name@company.com" />
            <select style={input} value={inviteRole} onChange={event => setInviteRole(event.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button style={btn} onClick={invite}>Send invite</button>
          </div>
        </div>
      )}
      {message && <div style={{ color: '#00e5a0', fontSize: 12, marginTop: 12 }}>{message}</div>}
    </div>
  );
}
