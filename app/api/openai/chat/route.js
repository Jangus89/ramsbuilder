import { NextResponse } from 'next/server';
import { DEFAULT_PROFILE } from '../../../../lib/companyProfile';
import { buildRamsMessages } from '../../../../lib/ramsPrompt';
import { getServerSupabase } from '../../../../lib/supabase';

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 20;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return RATE_LIMIT_MAX - 1;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) return -1;
  return RATE_LIMIT_MAX - entry.count;
}

async function buildSafeFlowBody(body) {
  const context = body.safeFlowContext;
  if (!context) return body;

  const accessToken = context.accessToken;
  if (!accessToken) {
    throw new Error('Supabase session is required to build a RAMS document.');
  }

  const supabase = getServerSupabase(accessToken);
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData?.user) {
    throw new Error('Could not verify the Supabase session.');
  }

  const userId = userData.user.id;
  const [{ data: profileRow }, { data: procedures }] = await Promise.all([
    supabase.from('company_profiles').select('data').eq('user_id', userId).single(),
    supabase.from('procedures').select('*').eq('user_id', userId).order('created_at'),
  ]);

  const { messages } = buildRamsMessages({
    ...context,
    profile: { ...DEFAULT_PROFILE, ...(profileRow?.data || {}) },
    procedures: procedures || [],
  });

  const imageContents = (context.photos || []).map(url => ({
    type: 'image_url',
    image_url: { url, detail: 'high' },
  }));

  return {
    model: body.model,
    max_tokens: body.max_tokens,
    temperature: body.temperature,
    stream: body.stream,
    messages: messages.map((message, index) => index === 1
      ? { ...message, content: [...imageContents, { type: 'text', text: message.content }] }
      : message
    ),
  };
}

export async function POST(request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: { message: 'OpenAI API key is not configured on the server.' } },
      { status: 500 }
    );
  }

  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const remaining = checkRateLimit(ip);
  if (remaining < 0) {
    return NextResponse.json(
      { error: { message: 'Too many requests. Please wait a moment and try again.' } },
      { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
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

  let openAIRequestBody;
  try {
    openAIRequestBody = await buildSafeFlowBody(body);
  } catch (err) {
    return NextResponse.json(
      { error: { message: err.message || 'Could not prepare RAMS request.' } },
      { status: 401 }
    );
  }

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(openAIRequestBody),
    });

    if (openAIRequestBody.stream) {
      return new Response(resp.body, {
        status: resp.status,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'X-RateLimit-Remaining': String(remaining),
        },
      });
    }

    const data = await resp.json();

    return NextResponse.json(data, {
      status: resp.status,
      headers: { 'X-RateLimit-Remaining': String(remaining) },
    });
  } catch (err) {
    return NextResponse.json(
      { error: { message: 'Failed to reach OpenAI. Please try again.' } },
      { status: 502 }
    );
  }
}
