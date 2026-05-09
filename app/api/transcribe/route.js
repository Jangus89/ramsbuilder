import { NextResponse } from 'next/server';

export async function POST(request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: { message: 'OpenAI API key is not configured on the server.' } },
      { status: 500 }
    );
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: { message: 'Invalid form data.' } }, { status: 400 });
  }

  const audio = formData.get('audio');
  if (!audio) {
    return NextResponse.json({ error: { message: 'No audio file provided.' } }, { status: 400 });
  }

  const body = new FormData();
  body.append('file', audio, audio.name || 'recording.webm');
  body.append('model', 'whisper-1');

  try {
    const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body,
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      return NextResponse.json(
        { error: { message: err.error?.message || `Transcription failed (${resp.status})` } },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    return NextResponse.json({ text: data.text || '' });
  } catch {
    return NextResponse.json(
      { error: { message: 'Failed to reach OpenAI transcription API.' } },
      { status: 502 }
    );
  }
}
