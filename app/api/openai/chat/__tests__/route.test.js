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
  jest.dontMock('../../../../../lib/supabase');
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
    expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toEqual({ model: 'gpt-4o', messages: [] });
  });

  it('returns 429 when rate limit exceeded', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    await loadRoute();
    global.fetch.mockResolvedValue({
      status: 200,
      json: async () => ({ choices: [] }),
    });

    let res;
    for (let i = 0; i < 21; i++) {
      res = await POST(makeRequest({ model: 'gpt-4o', messages: [] }));
    }
    expect(res.status).toBe(429);
  });

  it('builds SafeFlow RAMS context on the server from Supabase data', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';

    const profileQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { data: { companyName: 'Acme Civils' } } }),
    };
    const proceduresQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [{ title: 'Permit to Dig', text: 'Use permit to dig.' }] }),
    };
    const supabaseClient = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
      },
      from: jest.fn(table => table === 'company_profiles' ? profileQuery : proceduresQuery),
    };

    jest.doMock('../../../../../lib/supabase', () => ({
      getServerSupabase: jest.fn(() => supabaseClient),
      isSupabaseConfigured: true,
      supabase: {},
    }));

    await loadRoute();
    global.fetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({ choices: [{ message: { content: '{}' } }] }),
    });

    const res = await POST(makeRequest({
      model: 'gpt-4o',
      max_tokens: 8000,
      temperature: 0.2,
      safeFlowContext: {
        accessToken: 'sb-token',
        task: 'Excavation / Groundworks',
        taskType: 'Excavation / Groundworks',
        customTask: '',
        location: 'Bristol',
        additionalInfo: '',
        hasPhotos: false,
        photos: [],
        answers: {},
      },
    }));

    expect(res.status).toBe(200);
    expect(supabaseClient.auth.getUser).toHaveBeenCalledWith('sb-token');
    expect(supabaseClient.from).toHaveBeenCalledWith('company_profiles');
    expect(supabaseClient.from).toHaveBeenCalledWith('procedures');

    const [, fetchOptions] = global.fetch.mock.calls[0];
    const openAIBody = JSON.parse(fetchOptions.body);
    const prompt = openAIBody.messages[1].content[0].text;
    expect(openAIBody.messages[0].role).toBe('system');
    expect(prompt).toContain('Acme Civils');
    expect(prompt).toContain('Permit to Dig');
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
