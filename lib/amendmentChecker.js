import { callOpenAIChat, parseJsonResponse } from './openaiClient';

const EDITABLE_FIELDS = new Set([
  'scopeOfWorks',
  'methodStatement',
  'emergencyArrangements',
  'coshhAssessment',
  'welfareArrangements',
  'environmentalControls',
  'refuellingProcedure',
  'competencies',
]);

export async function checkAmendment(field, originalValue, newValue) {
  if (newValue === originalValue) return { weakened: false };
  if (!EDITABLE_FIELDS.has(field)) return { weakened: false };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const data = await callOpenAIChat({
      model: 'gpt-4o-mini',
      max_tokens: 100,
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content:
            'You are a UK HSQE safety auditor. Assess whether a RAMS document edit weakens a safety control.',
        },
        {
          role: 'user',
          content: `Field: ${field}\nOriginal: ${originalValue}\nRevised: ${newValue}\n\nDoes the revision weaken, remove, or qualify a safety control compared to the original? Reply with JSON only: { "weakened": true|false, "reason": "one sentence" }`,
        },
      ],
    });
    const text = data.choices?.[0]?.message?.content || '';
    return parseJsonResponse(text, '');
  } catch {
    return { weakened: false };
  } finally {
    clearTimeout(timeout);
  }
}
