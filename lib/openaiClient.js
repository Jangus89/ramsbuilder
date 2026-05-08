export async function callOpenAIChat(payload) {
  let response;
  try {
    response = await fetch('/api/openai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Could not reach the AI service. Check your connection and try again.');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('The AI service returned an unreadable response. Please try again.');
  }

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || `AI request failed with status ${response.status}.`);
  }

  return data;
}

export function parseJsonResponse(text, fallbackMessage) {
  const clean = (text || '').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return JSON.parse(clean);
  } catch {
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(clean.slice(start, end + 1));
      } catch {}
    }
    throw new Error(fallbackMessage);
  }
}
