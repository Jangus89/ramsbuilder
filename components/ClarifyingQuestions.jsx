'use client';
import { useState, useEffect } from 'react';
import { callOpenAIChat, parseJsonResponse } from '../lib/openaiClient';

export function buildAnswersContext(answers) {
  if (!answers || Object.keys(answers).length === 0) return '';
  const lines = Object.entries(answers).map(([, v]) => `• ${v.question}: ${v.answer}`);
  return `\nCONFIRMED SITE DETAILS:\n${lines.join('\n')}\n`;
}

async function fetchQuestions({ taskType, location, additionalInfo }) {
  const context = [
    taskType        && `Task type: ${taskType}`,
    location        && `Site location: ${location}`,
    additionalInfo  && `Additional context: ${additionalInfo}`,
  ].filter(Boolean).join('\n');

  const prompt = `You are helping a HSQE professional generate a RAMS document for a UK construction / field operations task. Before the full document is generated, ask the most important clarifying questions to ensure the output is accurate and site-specific.

${context}

Generate 4–6 multiple-choice clarifying questions. Focus on factors that genuinely change the risk profile or required controls — scale, environment, specific equipment, proximity hazards, public presence, services, weather exposure, etc. Avoid generic admin questions.

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
- 4–6 questions, ordered most-to-least impactful
- 3–4 options each, mutually exclusive, covering the realistic range
- Use UK construction / HSQE terminology
- Tailor specifically to the task and location provided — do not ask generic questions that apply to every job`;

  const data = await callOpenAIChat({
    model: 'gpt-4o',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  });
  const raw = data.choices?.[0]?.message?.content || '';
  return parseJsonResponse(raw, 'Could not generate clarifying questions. Please try again.').questions;
}

export default function ClarifyingQuestions({ taskType, location, additionalInfo, onSubmit, onBack }) {
  const [questions, setQuestions] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [loadErr, setLoadErr]     = useState('');
  const [answers, setAnswers]     = useState({});

  useEffect(() => {
    setLoadState('loading');
    setAnswers({});
    fetchQuestions({ taskType, location, additionalInfo })
      .then(qs => { setQuestions(qs); setLoadState('ready'); })
      .catch(err => { setLoadErr(err.message || 'Could not generate questions'); setLoadState('error'); });
  }, [taskType, location, additionalInfo]);

  const allAnswered = questions.length > 0 && questions.every(q => answers[q.id]);

  const select = (q, opt) =>
    setAnswers(prev => ({ ...prev, [q.id]: { question: q.question, answer: opt } }));

  const handleSubmit = () => {
    if (allAnswered) onSubmit(answers);
  };

  return (
    <div style={{ marginTop: 32, background: '#13151c', border: '1.5px solid #1e2128', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '22px 28px 20px', borderBottom: '1px solid #1e2128', background: '#1a1d26' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#00e5a0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
          Step 2 of 2 — Site Details
        </div>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: '#e8e8e4', marginBottom: 6 }}>
          A few quick details
        </div>
        <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>
          {loadState === 'loading'
            ? 'Generating questions specific to this job…'
            : 'Your answers are injected directly into the prompt for a more accurate, site-specific RAMS.'}
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
                fetchQuestions({ taskType, location, additionalInfo })
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
          const answered = !!answers[q.id];
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
                {q.options.map(opt => {
                  const sel = answers[q.id]?.answer === opt;
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
              </div>
            </div>
          );
        })}
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
        {loadState === 'ready' && !allAnswered && (
          <div style={{ fontSize: 12, color: '#555' }}>
            {questions.length - Object.keys(answers).length} question{questions.length - Object.keys(answers).length !== 1 ? 's' : ''} remaining
          </div>
        )}
      </div>
    </div>
  );
}
