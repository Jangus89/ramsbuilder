import { NextResponse } from 'next/server';
import { authError, requireUser } from '../../../_utils';

export async function GET(request, { params }) {
  try {
    const { supabase } = await requireUser(request);
    const [{ data: audit }, { data: signatures }] = await Promise.all([
      supabase.from('audit_log').select('*').eq('document_id', params.id).order('created_at', { ascending: true }),
      supabase.from('signatures').select('*').eq('document_id', params.id).order('signed_at', { ascending: true }),
    ]);
    return NextResponse.json({ audit: audit || [], signatures: signatures || [] });
  } catch (err) {
    return err.message?.includes('Authentication') ? authError(err.message) : NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}
