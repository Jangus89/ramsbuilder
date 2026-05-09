let lastRateLimitRemaining = null;

export function getRateLimitRemaining() {
  return lastRateLimitRemaining;
}

function rememberRateLimit(resp) {
  const value = resp.headers.get('X-RateLimit-Remaining');
  if (value !== null) lastRateLimitRemaining = Number(value);
}

function extractStreamText(eventData) {
  if (!eventData || eventData === '[DONE]') return '';
  try {
    const json = JSON.parse(eventData);
    return json.choices?.[0]?.delta?.content || '';
  } catch {
    return '';
  }
}

async function readError(resp) {
  try {
    const data = await resp.json();
    return data.error?.message || `Request failed (${resp.status})`;
  } catch {
    return `Request failed (${resp.status})`;
  }
}

export async function callOpenAIChat(payload, { onChunk } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), payload.stream ? 180_000 : 90_000);

  try {
    const resp = await fetch('/api/openai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    rememberRateLimit(resp);

    if (!resp.ok) {
      if (resp.status === 429) {
        const err = new Error('Rate limit reached — resets in 60 seconds');
        err.status = 429;
        throw err;
      }
      throw new Error(await readError(resp));
    }

    if (payload.stream) {
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let content = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const event of events) {
          const dataLines = event
            .split('\n')
            .filter(line => line.startsWith('data:'))
            .map(line => line.replace(/^data:\s?/, ''));
          const text = extractStreamText(dataLines.join('\n'));
          if (text) {
            content += text;
            onChunk?.(text, content);
          }
        }
      }

      return { choices: [{ message: { content } }] };
    }

    const data = await resp.json();

    if (data.error) {
      throw new Error(data.error?.message || `Request failed (${resp.status})`);
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`The request timed out after ${payload.stream ? 180 : 90} seconds. Please try again.`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function streamOpenAIChat(payload, onChunk) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180_000);

  try {
    const resp = await fetch('/api/openai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, stream: true }),
      signal: controller.signal,
    });

    rememberRateLimit(resp);

    if (!resp.ok) {
      if (resp.status === 429) {
        const err = new Error('Rate limit reached — resets in 60 seconds');
        err.status = 429;
        throw err;
      }
      throw new Error(await readError(resp));
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const event of events) {
        const dataLines = event
          .split('\n')
          .filter(line => line.startsWith('data:'))
          .map(line => line.replace(/^data:\s?/, ''));
        const text = extractStreamText(dataLines.join('\n'));
        if (text) onChunk(text);
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('The request timed out after 180 seconds. Please try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export function parseJsonResponse(text, fallbackMessage = 'Could not parse response.') {
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(clean);
  } catch {
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(clean.substring(start, end + 1));
      } catch {
        // fall through
      }
    }

    const arrStart = clean.indexOf('[');
    const arrEnd = clean.lastIndexOf(']');
    if (arrStart !== -1 && arrEnd > arrStart) {
      try {
        return JSON.parse(clean.substring(arrStart, arrEnd + 1));
      } catch {
        // fall through
      }
    }

    throw new Error(fallbackMessage);
  }
}
