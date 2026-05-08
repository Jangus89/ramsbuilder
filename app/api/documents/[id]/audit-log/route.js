import { NextResponse } from 'next/server';
import { addAuditLog, authError, requireUser } from '../../../_utils';

export async function POST(request, { params }) {
  try {
    const { supabase, user } = await requireUser(request);
    const body = await request.json();
    await addAuditLog(supabase, {
      documentId: params.id,
      userId: user.id,
      action: body.action,
      detail: body.detail || {},
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return err.message?.includes('Authentication') ? authError(err.message) : NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}
