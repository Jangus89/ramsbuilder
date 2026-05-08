import { NextResponse } from 'next/server';
import { getServerSupabase } from '../../lib/supabase';

export function bearerToken(request) {
  const header = request.headers.get('authorization') || '';
  return header.replace(/^Bearer\s+/i, '');
}

export async function requireUser(request) {
  const token = bearerToken(request);
  if (!token) throw new Error('Authentication required.');
  const supabase = getServerSupabase(token);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) throw new Error('Authentication required.');
  return { supabase, user: data.user, token };
}

export function authError(message = 'Authentication required.') {
  return NextResponse.json({ error: { message } }, { status: 401 });
}

export async function userOrgRole(supabase, userId, orgId) {
  const { data } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();
  return data?.role || null;
}

export async function canWriteOrg(supabase, userId, orgId) {
  const role = await userOrgRole(supabase, userId, orgId);
  return role === 'owner' || role === 'admin';
}

export async function addAuditLog(supabase, { documentId, userId, action, detail = {} }) {
  await supabase.from('audit_log').insert({
    document_id: documentId,
    user_id: userId,
    action,
    detail,
  });
}
