import { NextResponse } from 'next/server';
import { getServerSupabase } from '../../../../../lib/supabase';

export async function GET(_request, { params }) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('org_invites')
    .select('id,email,role,accepted_at,created_at,organisations(name),invited_by')
    .eq('token', params.token)
    .single();
  if (error || !data) return NextResponse.json({ error: { message: 'Invite not found.' } }, { status: 404 });
  return NextResponse.json({ invite: data });
}
