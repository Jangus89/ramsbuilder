import { NextResponse } from 'next/server';
import { getServerSupabase } from '../../../../lib/supabase';

export async function GET(request, { params }) {
  const { token } = await params;
  const supabase = getServerSupabase();

  const { data: link, error } = await supabase
    .from('share_links')
    .select('document_id, expires_at')
    .eq('token', token)
    .single();

  if (error || !link) {
    return NextResponse.json(
      { error: { message: 'This link is no longer valid.' } },
      { status: 404 }
    );
  }

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return NextResponse.json(
      { error: { message: 'This link has expired.' } },
      { status: 410 }
    );
  }

  const { data: doc } = await supabase
    .from('rams_documents')
    .select('data, task_type, location, created_at')
    .eq('id', link.document_id)
    .single();

  if (!doc) {
    return NextResponse.json(
      { error: { message: 'Document not found.' } },
      { status: 404 }
    );
  }

  const { data: profileRow } = await supabase
    .from('company_profiles')
    .select('data')
    .eq('user_id', (
      await supabase.from('rams_documents').select('user_id').eq('id', link.document_id).single()
    ).data?.user_id)
    .single();

  return NextResponse.json({
    documentData: doc.data,
    taskType: doc.task_type,
    location: doc.location,
    createdAt: doc.created_at,
    companyName: profileRow?.data?.companyName || '',
  });
}
