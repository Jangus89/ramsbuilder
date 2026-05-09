import { NextResponse } from 'next/server';
import { getServerSupabase } from '../../../../../lib/supabase';

export async function POST(request, { params }) {
  const { token } = await params;
  const supabase = getServerSupabase();

  const { data: link } = await supabase
    .from('share_links')
    .select('document_id, expires_at')
    .eq('token', token)
    .single();

  if (!link) {
    return NextResponse.json(
      { error: { message: 'Invalid link.' } },
      { status: 404 }
    );
  }

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return NextResponse.json(
      { error: { message: 'This link has expired.' } },
      { status: 410 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { message: 'Invalid request body.' } },
      { status: 400 }
    );
  }

  if (!body.recipientName?.trim()) {
    return NextResponse.json(
      { error: { message: 'Recipient name is required.' } },
      { status: 400 }
    );
  }

  const ip = request.headers.get('x-forwarded-for') || '';
  const userAgent = request.headers.get('user-agent') || '';

  const { error } = await supabase.from('acknowledgements').insert({
    share_token: token,
    document_id: link.document_id,
    recipient_name: body.recipientName.trim(),
    recipient_company: body.recipientCompany?.trim() || null,
    ip_address: ip,
    user_agent: userAgent,
  });

  if (error) {
    return NextResponse.json(
      { error: { message: error.message || 'Could not save acknowledgement.' } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
