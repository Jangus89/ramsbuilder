import { NextResponse } from 'next/server';
import { authError, canWriteOrg, requireUser } from '../../_utils';

export async function POST(request) {
  try {
    const { supabase, user } = await requireUser(request);
    const body = await request.json();
    const orgId = body.orgId;
    if (!(await canWriteOrg(supabase, user.id, orgId))) {
      return NextResponse.json({ error: { message: 'Only org owners/admins can invite members.' } }, { status: 403 });
    }
    const role = ['admin', 'member'].includes(body.role) ? body.role : 'member';
    const email = String(body.email || '').trim().toLowerCase();
    if (!email) return NextResponse.json({ error: { message: 'Email is required.' } }, { status: 400 });
    const { data: invite, error } = await supabase.from('org_invites').insert({ org_id: orgId, invited_by: user.id, email, role }).select('*').single();
    if (error) throw error;
    try {
      await supabase.auth.admin.inviteUserByEmail(email, { data: { org_id: orgId, role } });
    } catch {
      // Email delivery is optional for local/dev environments; return the invite link either way.
    }
    return NextResponse.json({ invite, inviteLink: `/invite/${invite.token}` });
  } catch (err) {
    return err.message?.includes('Authentication') ? authError(err.message) : NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}
