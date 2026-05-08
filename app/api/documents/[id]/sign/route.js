import { NextResponse } from 'next/server';
import { addAuditLog, authError, requireUser } from '../../../_utils';

export async function POST(request, { params }) {
  try {
    const { supabase, user } = await requireUser(request);
    const body = await request.json();
    const role = String(body.role || '').trim();
    const fullName = String(body.fullName || '').trim();
    if (!role || !fullName) return NextResponse.json({ error: { message: 'Role and full name are required.' } }, { status: 400 });

    const { data: existing } = await supabase
      .from('signatures')
      .select('id')
      .eq('document_id', params.id)
      .eq('user_id', user.id)
      .eq('role', role)
      .maybeSingle();
    if (existing) return NextResponse.json({ error: { message: 'You have already signed this role.' } }, { status: 409 });

    const { data: signature, error } = await supabase.from('signatures').insert({
      document_id: params.id,
      user_id: user.id,
      role,
      full_name: fullName,
      ip_address: request.headers.get('x-forwarded-for') || '',
      user_agent: request.headers.get('user-agent') || '',
    }).select('*').single();
    if (error) throw error;
    await addAuditLog(supabase, { documentId: params.id, userId: user.id, action: 'signed', detail: { role, fullName } });
    return NextResponse.json({ signature });
  } catch (err) {
    return err.message?.includes('Authentication') ? authError(err.message) : NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}
