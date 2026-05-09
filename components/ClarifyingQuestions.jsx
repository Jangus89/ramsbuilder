'use client';
import { useState, useEffect } from 'react';
import { callOpenAIChat, parseJsonResponse } from '../lib/openaiClient';

function answerText(value) {
  if (!value) return '';
  if (Array.isArray(value.answer)) return value.answer.join('; ');
  if (Array.isArray(value.selections) || value.other) {
    return [
      ...(value.selections || []),
      value.other?.trim() ? `Other: ${value.other.trim()}` : '',
    ].filter(Boolean).join('; ');
  }
  return value.answer || '';
}

function normaliseQuestions(parsed) {
  const rawQuestions = Array.isArray(parsed) ? parsed : parsed?.questions;
  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    throw new Error('Could not generate clarifying questions. Please try again.');
  }

  const questions = rawQuestions
    .map((q, index) => {
      const question = String(q.question || '').trim();
      const options = (Array.isArray(q.options) ? q.options : [])
        .map(option => String(option).trim())
        .filter(Boolean)
        .filter(option => option.toLowerCase() !== 'other');
      if (!question || options.length === 0) return null;
      return {
        id: q.id || `question_${index + 1}`,
        question,
        options,
      };
    })
    .filter(Boolean);
  if (questions.length === 0) {
    throw new Error('Could not generate clarifying questions. Please try again.');
  }
  return questions;
}

export function buildAnswersContext(answers) {
  if (!answers || Object.keys(answers).length === 0) return '';
  const groups = {
    scopeOfWorks: [],
    siteObservations: [],
    hazards: [],
  };

  Object.values(answers).forEach(value => {
    const answer = answerText(value);
    const text = `${value.question || ''} ${answer}`.toLowerCase();
    const line = `• ${value.question}: ${answer}`;
    if (/(duration|shift|day|week|hours|crew|operatives|scale|length|area|quantity|programme|phase)/.test(text)) {
      groups.scopeOfWorks.push(line);
    } else if (/(plant|equipment|machine|tool|excavator|dumper|saw|breaker|crane|vehicle|material)/.test(text)) {
      groups.hazards.push(line);
    } else {
      groups.siteObservations.push(line);
    }
  });

  return `\nCONFIRMED SITE DETAILS BY RAMS SECTION:
scopeOfWorks:
${groups.scopeOfWorks.join('\n') || '• None'}
siteObservations:
${groups.siteObservations.join('\n') || '• None'}
hazards:
${groups.hazards.join('\n') || '• None'}
\n`;
}

async function fetchQuestions({ taskType, location, additionalInfo }) {
  const context = [
    taskType        && `Task type: ${taskType}`,
    location        && `Site location: ${location}`,
    additionalInfo  && `Additional context: ${additionalInfo}`,
  ].filter(Boolean).join('\n');

  const prompt = `You are helping a HSQE professional generate a RAMS document for a UK construction / field operations task. Before the full document is generated, ask the most important clarifying questions to ensure the output is accurate and site-specific.

${context}

Generate as many multi-select clarifying questions as are needed for this RAMS to be materially safer and more site-specific. Focus on factors that genuinely change the risk profile or required controls — scale, environment, specific equipment, proximity hazards, public presence, services, weather exposure, buried services, permits, access, lifting, welfare, emergency arrangements, environmental controls, and task sequencing. Avoid generic admin questions.

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
- Ask every question needed, ordered most-to-least safety impact. Do not stop at five questions if more are needed.
- 3–6 options each. Options may be selected together, so do not make them mutually exclusive unless the facts truly are exclusive.
- Do not include an "Other" option in JSON. The UI adds a free-text Other option automatically.
- Use UK construction / HSQE terminology
- Tailor specifically to the task and location provided — do not ask generic questions that apply to every job`;

  const data = await callOpenAIChat({
    model: 'gpt-4o',
    temperature: 0.2,
    max_tokens: 1800,
    messages: [{ role: 'user', content: prompt }],
  });
  const raw = data.choices?.[0]?.message?.content || '';
  return normaliseQuestions(parseJsonResponse(raw, 'Could not generate clarifying questions. Please try again.'));
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

  const hasAnswer = (answer) =>
    (answer?.selections?.length || 0) > 0 || Boolean(answer?.other?.trim());

  const allAnswered = questions.length > 0 && questions.every(q => hasAnswer(answers[q.id]));

  const normaliseAnswer = (q, next) => {
    const selections = next.selections || [];
    const other = next.other || '';
    return {
      question: q.question,
      selections,
      other,
      answer: [
        ...selections,
        other.trim() ? `Other: ${other.trim()}` : '',
      ].filter(Boolean).join('; '),
    };
  };

  const toggleOption = (q, opt) =>
    setAnswers(prev => {
      const current = prev[q.id] || { question: q.question, selections: [], other: '' };
      const selected = current.selections || [];
      const selections = selected.includes(opt)
        ? selected.filter(item => item !== opt)
        : [...selected, opt];
      return { ...prev, [q.id]: normaliseAnswer(q, { ...current, selections }) };
    });

  const setOther = (q, value) =>
    setAnswers(prev => {
      const current = prev[q.id] || { question: q.question, selections: [], other: '' };
      return { ...prev, [q.id]: normaliseAnswer(q, { ...current, other: value }) };
    });

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
            {[...Array(7)].map((_, i) => (
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
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setLoadState('loading');
                  fetchQuestions({ taskType, location, additionalInfo })
                    .then(qs => { setQuestions(qs); setLoadState('ready'); })
                    .catch(err => { setLoadErr(err.message); setLoadState('error'); });
                }}
                style={{ background: 'none', border: '1.5px solid #2a2d35', color: '#888', borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '10px 18px', cursor: 'pointer', minHeight: 44 }}
              >
                Retry
              </button>
              <button
                onClick={() => onSubmit({})}
                style={{ background: '#00e5a0', border: 'none', color: '#0f1117', borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, padding: '10px 18px', cursor: 'pointer', minHeight: 44 }}
              >
                Generate without questions
              </button>
            </div>
          </div>
        )}

        {loadState === 'ready' && questions.map((q, qi) => {
          const answered = hasAnswer(answers[q.id]);
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
                  const sel = answers[q.id]?.selections?.includes(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() => toggleOption(q, opt)}
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
                      {sel ? '✓ ' : ''}{opt}
                    </button>
                  );
                })}
              </div>
              <div style={{ paddingLeft: 32, marginTop: 10 }}>
                <label style={{ display: 'block', color: answers[q.id]?.other ? '#00e5a0' : '#555', fontSize: 12, marginBottom: 6 }}>
                  Other / site-specific detail
                </label>
                <input
                  type="text"
                  value={answers[q.id]?.other || ''}
                  onChange={(e) => setOther(q, e.target.value)}
                  placeholder="Add anything not covered by the options…"
                  style={{
                    width: '100%',
                    minHeight: 44,
                    background: '#0f1117',
                    border: `1.5px solid ${answers[q.id]?.other ? '#00e5a0' : '#2a2d35'}`,
                    borderRadius: 8,
                    color: '#e8e8e4',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    padding: '10px 12px',
                    outline: 'none',
                  }}
                />
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
            {questions.filter(q => !hasAnswer(answers[q.id])).length} question{questions.filter(q => !hasAnswer(answers[q.id])).length !== 1 ? 's' : ''} remaining
          </div>
        )}
      </div>
    </div>
  );
}
