'use client';
import { useState, useEffect } from 'react';
import { callOpenAIChat, parseJsonResponse } from '../lib/openaiClient';

export function buildAnswersContext(answers) {
  if (!answers || Object.keys(answers).length === 0) return '';
  const lines = Object.entries(answers).map(([, v]) => `• ${v.question}: ${v.answer}`);
  return `\nCONFIRMED SITE DETAILS:\n${lines.join('\n')}\n`;
}

async function fetchQuestions({ taskType, location, additionalInfo, photos }) {
  const hasPhotos = Boolean(photos?.length);
  const context = [
    taskType        && `Task type: ${taskType}`,
    location        && `Site location: ${location}`,
    additionalInfo  && `Additional context: ${additionalInfo}`,
    hasPhotos
      ? `${photos.length} site photo${photos.length === 1 ? '' : 's'} attached for visual assessment`
      : 'No site photos attached; rely on the task description, location, and additional context',
  ].filter(Boolean).join('\n');

  const prompt = `You are helping a HSQE professional generate a RAMS document for a UK construction / field operations task. Before the full document is generated, ask the most important clarifying questions to ensure the output is accurate and site-specific.

${context}

${hasPhotos
  ? 'Review the uploaded site photos together with the task description, location, and additional information.'
  : 'There are no uploaded site photos, so base the questions on the task description, location, and additional information.'} Ask every clarifying question that would materially improve the RAMS, and do not ask filler questions. Focus on factors that genuinely change the risk profile or required controls — site conditions, scale, environment, specific equipment, proximity hazards, public presence, services, weather exposure, access, plant, isolation requirements, permits, and anything ambiguous.

Return ONLY valid JSON with no markdown:
{
  "questions": [
    {
      "id": "snake_case_id",
      "question": "The question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"]
    }
  ]
}

Rules:
- Ask as many questions as are genuinely useful; there is no fixed target count
- 3–4 options each, mutually exclusive, covering the realistic range
- Do not include an "Other" option in the JSON; the UI adds a typed Other option automatically
- Use UK construction / HSQE terminology
- Tailor specifically to the task, location, additional information${hasPhotos ? ', and visible photo evidence' : ''} — do not ask generic questions that apply to every job`;

  const content = [
    ...(photos || []).map(p => ({
      type: 'image_url',
      image_url: { url: p.url, detail: 'high' },
    })),
    { type: 'text', text: prompt },
  ];

  const data = await callOpenAIChat({
    model: 'gpt-4o',
    max_tokens: 1800,
    messages: [{ role: 'user', content }],
  });
  const raw = data.choices?.[0]?.message?.content || '';
  const parsed = parseJsonResponse(raw, 'Could not read the generated questions. Please try again.');
  return parsed.questions || [];
}

function isAnswerComplete(answer) {
  if (!answer?.answer) return false;
  return answer.answer.split(';').some(part => {
    const value = part.trim();
    if (!value) return false;
    if (!value.startsWith('Other:')) return true;
    return value.replace(/^Other:\s*/, '').trim().length > 0;
  });
}

export default function ClarifyingQuestions({ taskType, location, additionalInfo, photos, onSubmit, onBack }) {
  const [questions, setQuestions] = useState([]);
  const [loadState, setLoadState] = useState('loading'); // loading | ready | error
  const [loadErr, setLoadErr]     = useState('');
  const [answers, setAnswers]     = useState({});
  const [otherInputs, setOtherInputs] = useState({});

  useEffect(() => {
    setLoadState('loading');
    setAnswers({});
    setOtherInputs({});
    fetchQuestions({ taskType, location, additionalInfo, photos })
      .then(qs => { setQuestions(qs); setLoadState('ready'); })
      .catch(err => { setLoadErr(err.message || 'Could not generate questions'); setLoadState('error'); });
  }, [taskType, location, additionalInfo, photos]);

  const allAnswered = loadState === 'ready' && (questions.length === 0 || questions.every(q => isAnswerComplete(answers[q.id])));

  const buildAnswer = (selectedOptions, otherValue) => {
    const parts = [...selectedOptions];
    if (otherValue !== undefined) parts.push(`Other: ${otherValue}`);
    return parts.join('; ');
  };

  const select = (q, opt) =>
    setAnswers(prev => {
      const current = prev[q.id]?.selectedOptions || [];
      const selectedOptions = current.includes(opt)
        ? current.filter(item => item !== opt)
        : [...current, opt];
      const otherValue = prev[q.id]?.otherValue;
      return { ...prev, [q.id]: { question: q.question, selectedOptions, otherValue, answer: buildAnswer(selectedOptions, otherValue) } };
    });

  const selectOther = (q) =>
    setAnswers(prev => {
      const current = prev[q.id] || {};
      const otherValue = current.otherValue ?? otherInputs[q.id] ?? '';
      return {
        ...prev,
        [q.id]: {
          question: q.question,
          selectedOptions: current.selectedOptions || [],
          otherValue,
          answer: buildAnswer(current.selectedOptions || [], otherValue),
        },
      };
    });

  const updateOther = (q, value) => {
    setOtherInputs(prev => ({ ...prev, [q.id]: value }));
    setAnswers(prev => {
      const current = prev[q.id] || {};
      return {
        ...prev,
        [q.id]: {
          question: q.question,
          selectedOptions: current.selectedOptions || [],
          otherValue: value,
          answer: buildAnswer(current.selectedOptions || [], value),
        },
      };
    });
  };

  const handleSubmit = () => {
    if (allAnswered) onSubmit(answers);
  };

  return (
    <div style={{ marginTop: 32, background: '#13151c', border: '1.5px solid #1e2128', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '22px 28px 20px', borderBottom: '1px solid #1e2128', background: '#1a1d26' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#00e5a0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
          Step 3 of 3 — Site Details
        </div>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: '#e8e8e4', marginBottom: 6 }}>
          A few quick details
        </div>
          <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>
            {loadState === 'loading'
              ? 'Generating questions specific to this job…'
              : 'Select every option that applies. Your answers are injected directly into the prompt for a more accurate, site-specific RAMS.'}
          </div>
      </div>

      {/* Body */}
      <div style={{ padding: '28px' }}>
        {loadState === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ opacity: 1 - i * 0.15 }}>
                <div style={{ width: `${55 + i * 8}%`, height: 14, background: '#1e2128', borderRadius: 4, marginBottom: 12 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  {[...Array(4)].map((_, j) => (
                    <div key={j} style={{ width: 90, height: 36, background: '#1e2128', borderRadius: 8 }} />
                  ))}
                </div>
              </div>
            ))}
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
            <style>{`.skeleton-pulse > div { animation: pulse 1.4s ease-in-out infinite; }`}</style>
          </div>
        )}

        {loadState === 'error' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 13, color: '#ef4444', marginBottom: 16 }}>⚠ {loadErr}</div>
            <button
              onClick={() => {
                setLoadState('loading');
                fetchQuestions({ taskType, location, additionalInfo, photos })
                  .then(qs => { setQuestions(qs); setLoadState('ready'); })
                  .catch(err => { setLoadErr(err.message); setLoadState('error'); });
              }}
              style={{ background: 'none', border: '1.5px solid #2a2d35', color: '#888', borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '8px 18px', cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        )}

        {loadState === 'ready' && questions.map((q, qi) => {
          const answered = isAnswerComplete(answers[q.id]);
          const selectedOptions = answers[q.id]?.selectedOptions || [];
          const otherSelected = answers[q.id]?.otherValue !== undefined;
          return (
            <div key={q.id} style={{ marginBottom: qi < questions.length - 1 ? 28 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: answered ? 'rgba(0,229,160,0.08)' : 'transparent',
                  border: `1.5px solid ${answered ? '#00e5a0' : '#2a2d35'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, color: '#00e5a0', transition: 'all 0.2s',
                }}>
                  {answered
                    ? '✓'
                    : <span style={{ fontSize: 10, color: '#555' }}>{qi + 1}</span>}
                </div>
                <div style={{ fontSize: 14, color: '#c0c0b8', fontWeight: 500 }}>{q.question}</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingLeft: 32 }}>
                {(q.options || []).map(opt => {
                  const sel = selectedOptions.includes(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() => select(q, opt)}
                      style={{
                        background: sel ? 'rgba(0,229,160,0.08)' : '#1e2128',
                        border: `1.5px solid ${sel ? '#00e5a0' : '#2a2d35'}`,
                        borderRadius: 8,
                        color: sel ? '#00e5a0' : '#888',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 13,
                        padding: '9px 15px',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        fontWeight: sel ? 500 : 400,
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
                <button
                  onClick={() => selectOther(q)}
                  style={{
                    background: otherSelected ? 'rgba(0,229,160,0.08)' : '#1e2128',
                    border: `1.5px solid ${otherSelected ? '#00e5a0' : '#2a2d35'}`,
                    borderRadius: 8,
                    color: otherSelected ? '#00e5a0' : '#888',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    padding: '9px 15px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontWeight: otherSelected ? 500 : 400,
                  }}
                >
                  Other
                </button>
              </div>
              {otherSelected && (
                <div style={{ paddingLeft: 32, marginTop: 10 }}>
                  <input
                    value={otherInputs[q.id] || ''}
                    onChange={e => updateOther(q, e.target.value)}
                    placeholder="Type your answer..."
                    autoFocus
                    style={{
                      width: '100%',
                      background: '#1e2128',
                      border: `1.5px solid ${answered ? '#00e5a0' : '#2a2d35'}`,
                      borderRadius: 8,
                      color: '#e8e8e4',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13,
                      padding: '11px 13px',
                      outline: 'none',
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}

        {loadState === 'ready' && questions.length === 0 && (
          <div style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>
            No extra questions are needed for this draft. You can generate the RAMS from the details already provided.
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '20px 28px', borderTop: '1px solid #1e2128', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={handleSubmit}
          disabled={!allAnswered}
          style={{
            background: allAnswered ? '#00e5a0' : '#1e2128',
            color: allAnswered ? '#0f1117' : '#555',
            border: 'none', borderRadius: 10,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 15, fontWeight: 600,
            padding: '14px 28px',
            cursor: allAnswered ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', gap: 8,
            transition: 'all 0.2s',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          Generate RAMS Document
        </button>
        <button
          onClick={onBack}
          style={{ background: 'none', border: '1.5px solid #2a2d35', color: '#555', borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '10px 18px', cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#888'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2d35'; e.currentTarget.style.color = '#555'; }}
        >
          ← Back
        </button>
        {loadState === 'ready' && questions.length > 0 && !allAnswered && (
          <div style={{ fontSize: 12, color: '#555' }}>
            {questions.filter(q => !isAnswerComplete(answers[q.id])).length} question{questions.filter(q => !isAnswerComplete(answers[q.id])).length !== 1 ? 's' : ''} remaining
          </div>
        )}
      </div>
    </div>
  );
}
