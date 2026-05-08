import { NextResponse } from 'next/server';

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

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

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
