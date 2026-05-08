import { NextResponse } from 'next/server';
import { authError, requireUser } from '../../_utils';

export async function POST(request) {
  try {
    const { supabase, user } = await requireUser(request);
    const body = await request.json();
    const name = String(body.name || '').trim();
    if (!name) return NextResponse.json({ error: { message: 'Organisation name is required.' } }, { status: 400 });

    const { data: org, error } = await supabase.from('organisations').insert({ name, created_by: user.id }).select('*').single();
    if (error) throw error;
    await supabase.from('org_members').insert({ org_id: org.id, user_id: user.id, role: 'owner', status: 'active' });
    return NextResponse.json({ org });
  } catch (err) {
    return err.message?.includes('Authentication') ? authError(err.message) : NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}
