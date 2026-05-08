import { parseJsonResponse, callOpenAIChat, getRateLimitRemaining } from '../openaiClient';

describe('parseJsonResponse', () => {
  it('strips markdown code fences', () => {
    const input = '```json\n{"key": "value"}\n```';
    expect(parseJsonResponse(input)).toEqual({ key: 'value' });
  });

  it('extracts JSON from mixed text', () => {
    const input = 'Here is the result:\n{"score": 85}\nDone.';
    expect(parseJsonResponse(input)).toEqual({ score: 85 });
  });

  it('throws with fallback message on invalid JSON', () => {
    expect(() => parseJsonResponse('not json at all', 'Custom error'))
      .toThrow('Custom error');
  });

  it('parses clean JSON directly', () => {
    expect(parseJsonResponse('{"a": 1}')).toEqual({ a: 1 });
  });

  it('extracts JSON array from mixed text', () => {
    const input = 'Result: [1, 2, 3] end';
    expect(parseJsonResponse(input)).toEqual([1, 2, 3]);
  });
});

describe('callOpenAIChat', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('calls /api/openai/chat with correct headers', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers(),
      json: async () => ({ choices: [{ message: { content: 'hi' } }] }),
    });

    const payload = { model: 'gpt-4o', messages: [{ role: 'user', content: 'test' }] };
    await callOpenAIChat(payload);

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/openai/chat',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );
  });

  it('throws on error response', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: new Headers(),
      json: async () => ({ error: { message: 'Server error' } }),
    });

    await expect(callOpenAIChat({})).rejects.toThrow('Server error');
  });

  it('tracks rate limit header', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'X-RateLimit-Remaining': '3' }),
      json: async () => ({ choices: [] }),
    });
    await callOpenAIChat({});
    expect(getRateLimitRemaining()).toBe(3);
  });

  it('reads streaming chunks', async () => {
    const { TextDecoder, TextEncoder } = require('util');
    const { ReadableStream } = require('stream/web');
    global.TextDecoder = TextDecoder;
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"Hel"}}]}\n\n'));
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"lo"}}]}\n\n'));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });
    const chunks = [];
    global.fetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers(),
      body: stream,
    });
    const data = await callOpenAIChat({ stream: true }, { onChunk: chunk => chunks.push(chunk) });
    expect(data.choices[0].message.content).toBe('Hello');
    expect(chunks).toEqual(['Hel', 'lo']);
  });
});
