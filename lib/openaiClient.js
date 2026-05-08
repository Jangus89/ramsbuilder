export async function callOpenAIChat(payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);

  try {
    const resp = await fetch('/api/openai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const data = await resp.json();

    if (!resp.ok || data.error) {
      throw new Error(data.error?.message || `Request failed (${resp.status})`);
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('The request timed out after 90 seconds. Please try again.');
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
    // Try extracting JSON between first { and last }
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(clean.substring(start, end + 1));
      } catch {
        // fall through
      }
    }

    // Try extracting JSON array
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
