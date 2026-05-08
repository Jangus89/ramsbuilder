import { parseJsonResponse, callOpenAIChat } from '../openaiClient';

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
      json: async () => ({ error: { message: 'Server error' } }),
    });

    await expect(callOpenAIChat({})).rejects.toThrow('Server error');
  });
});
