/**
 * @jest-environment node
 */

let POST;

beforeEach(() => {
  jest.resetModules();
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
  delete process.env.OPENAI_API_KEY;
});

async function loadRoute() {
  const mod = await import('../route');
  POST = mod.POST;
}

function makeRequest(body) {
  return {
    json: async () => body,
    headers: new Map([['x-forwarded-for', '127.0.0.1']]),
  };
}

describe('POST /api/openai/chat', () => {
  it('returns 500 when OPENAI_API_KEY not set', async () => {
    delete process.env.OPENAI_API_KEY;
    await loadRoute();
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error.message).toContain('not configured');
  });

  it('returns 400 on invalid request body', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    await loadRoute();
    const req = {
      json: async () => { throw new Error('bad json'); },
      headers: new Map([['x-forwarded-for', '127.0.0.2']]),
    };
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('proxies request to OpenAI and returns response', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    await loadRoute();
    const mockResponse = { choices: [{ message: { content: 'hello' } }] };
    global.fetch.mockResolvedValueOnce({
      status: 200,
      json: async () => mockResponse,
    });

    const res = await POST(makeRequest({ model: 'gpt-4o', messages: [] }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.choices[0].message.content).toBe('hello');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer sk-test',
        }),
      })
    );
  });

  it('returns 502 on network failure', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    await loadRoute();
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    const res = await POST(makeRequest({ model: 'gpt-4o', messages: [] }));
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error.message).toContain('Failed to reach OpenAI');
  });
});
