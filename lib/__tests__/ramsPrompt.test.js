import { buildRamsMessages, buildRamsPrompt, buildStructuredAnswersContext } from '../ramsPrompt';
import { parseJsonResponse } from '../openaiClient';

describe('buildRamsPrompt', () => {
  it('includes task type in output', () => {
    expect(buildRamsPrompt({ task: 'Excavation / Trenching', taskType: 'Excavation / Trenching' })).toContain('Excavation / Trenching');
  });

  it('includes location when provided, omits it when not', () => {
    expect(buildRamsPrompt({ task: 'Road Works', taskType: 'Road Works', location: 'Leeds' })).toContain('Site Location: Leeds');
    expect(buildRamsPrompt({ task: 'Road Works', taskType: 'Road Works' })).not.toContain('Site Location:');
  });

  it('includes no-photos instruction when photos are absent', () => {
    expect(buildRamsPrompt({ task: 'Manual Handling', taskType: 'Manual Handling', hasPhotos: false })).toContain('Site Photos: None provided');
  });

  it('includes MANDATORY_HAZARDS when critical rules match', () => {
    expect(buildRamsPrompt({ task: 'Excavation / Trenching', taskType: 'Excavation / Trenching' })).toContain('MANDATORY_HAZARDS');
  });

  it('includes profile company name', () => {
    expect(buildRamsPrompt({ task: 'Road Works', taskType: 'Road Works', profile: { companyName: 'Acme Ltd' } })).toContain('Acme Ltd');
  });

  it('separates system and user messages', () => {
    const { messages } = buildRamsMessages({ task: 'Road Works', taskType: 'Road Works', hasPhotos: true });
    expect(messages[0].role).toBe('system');
    expect(messages[1].role).toBe('user');
    expect(messages[0].content).toContain('JSON schema');
  });

  it('categorises structured answers', () => {
    const result = buildStructuredAnswersContext({
      a: { question: 'How long is the job?', answer: 'Two days' },
      b: { question: 'What plant is used?', answer: 'Excavator' },
      c: { question: 'Ground condition?', answer: 'Wet ground' },
    });
    expect(result.scopeOfWorks).toContain('Two days');
    expect(result.hazards).toContain('Excavator');
    expect(result.siteObservations).toContain('Wet ground');
  });

  it('formats multi-select and other answers for prompt context', () => {
    const result = buildStructuredAnswersContext({
      a: {
        question: 'What plant and equipment will be used?',
        selections: ['Excavator', 'Dumper'],
        other: 'Vacuum excavator for services',
      },
    });
    expect(result.hazards).toContain('Excavator; Dumper; Other: Vacuum excavator for services');
    expect(result.all).toContain('Excavator; Dumper; Other: Vacuum excavator for services');
  });
});

describe('parseJsonResponse', () => {
  it('handles markdown-wrapped JSON', () => {
    expect(parseJsonResponse('```json\n{"ok":true}\n```')).toEqual({ ok: true });
  });

  it('throws useful message on invalid JSON', () => {
    expect(() => parseJsonResponse('nope', 'Useful error')).toThrow('Useful error');
  });
});
