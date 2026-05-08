export async function POST(request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: { message: 'OPENAI_API_KEY is not configured on the server.' } },
      { status: 500 }
    );
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { error: { message: 'Invalid AI request payload.' } },
      { status: 400 }
    );
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    let data;
    try {
      data = await response.json();
    } catch {
      data = { error: { message: 'OpenAI returned an unreadable response.' } };
    }

    return Response.json(data, { status: response.status });
  } catch {
    return Response.json(
      { error: { message: 'Could not connect to OpenAI. Please try again.' } },
      { status: 502 }
    );
  }
}
