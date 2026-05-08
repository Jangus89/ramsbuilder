import { NextResponse } from 'next/server';
import { authError, requireUser, userOrgRole } from '../../../_utils';

export async function DELETE(request, { params }) {
  try {
    const { supabase, user } = await requireUser(request);
    const { data: member } = await supabase.from('org_members').select('*').eq('id', params.memberId).single();
    const role = member ? await userOrgRole(supabase, user.id, member.org_id) : null;
    if (!['owner', 'admin'].includes(role)) return NextResponse.json({ error: { message: 'Forbidden.' } }, { status: 403 });
    await supabase.from('org_members').delete().eq('id', params.memberId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return err.message?.includes('Authentication') ? authError(err.message) : NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { supabase, user } = await requireUser(request);
    const body = await request.json();
    const { data: member } = await supabase.from('org_members').select('*').eq('id', params.memberId).single();
    const role = member ? await userOrgRole(supabase, user.id, member.org_id) : null;
    if (role !== 'owner') return NextResponse.json({ error: { message: 'Only owners can change roles.' } }, { status: 403 });
    const nextRole = ['admin', 'member'].includes(body.role) ? body.role : null;
    if (!nextRole) return NextResponse.json({ error: { message: 'Invalid role.' } }, { status: 400 });
    const { data, error } = await supabase.from('org_members').update({ role: nextRole }).eq('id', params.memberId).select('*').single();
    if (error) throw error;
    return NextResponse.json({ member: data });
  } catch (err) {
    return err.message?.includes('Authentication') ? authError(err.message) : NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}
