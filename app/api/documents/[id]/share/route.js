import { NextResponse } from 'next/server';
import { requireUser, authError } from '../../../_utils';
import { getServerSupabase } from '../../../../../lib/supabase';

export async function POST(request, { params }) {
  let user, supabase;
  try {
    ({ user, supabase } = await requireUser(request));
  } catch {
    return authError();
  }

  const { id } = await params;

  const { data: doc } = await supabase
    .from('rams_documents')
    .select('id, user_id')
    .eq('id', id)
    .single();

  if (!doc || doc.user_id !== user.id) {
    return NextResponse.json({ error: { message: 'Document not found.' } }, { status: 404 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    // no body is fine
  }

  const expiresAt = body.expiresInDays
    ? new Date(Date.now() + body.expiresInDays * 86400000).toISOString()
    : null;

  const { data: link, error } = await supabase
    .from('share_links')
    .insert({
      document_id: id,
      created_by: user.id,
      expires_at: expiresAt,
    })
    .select('token')
    .single();

  if (error) {
    return NextResponse.json(
      { error: { message: error.message || 'Could not create share link.' } },
      { status: 500 }
    );
  }

  return NextResponse.json({
    token: link.token,
    url: `/view/${link.token}`,
  });
}
