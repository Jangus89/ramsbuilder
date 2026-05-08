import { NextResponse } from 'next/server';
import { authError, requireUser } from '../../../../_utils';

export async function POST(request, { params }) {
  try {
    const { supabase, user } = await requireUser(request);
    const { data: invite, error } = await supabase.from('org_invites').select('*').eq('token', params.token).single();
    if (error || !invite) return NextResponse.json({ error: { message: 'Invite not found.' } }, { status: 404 });
    if (invite.accepted_at) return NextResponse.json({ error: { message: 'Invite already accepted.' } }, { status: 409 });
    await supabase.from('org_members').upsert({
      org_id: invite.org_id,
      user_id: user.id,
      role: invite.role || 'member',
      invited_email: invite.email,
      status: 'active',
    }, { onConflict: 'org_id,user_id' });
    await supabase.from('org_invites').update({ accepted_at: new Date().toISOString() }).eq('id', invite.id);
    return NextResponse.json({ ok: true, orgId: invite.org_id });
  } catch (err) {
    return err.message?.includes('Authentication') ? authError(err.message) : NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}
