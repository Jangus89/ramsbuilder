'use client';
import { useState } from 'react';

const BASE_QUESTIONS = [
  {
    id: 'operatives',
    q: 'How many operatives will be on site?',
    opts: ['1–2', '3–5', '6–10', '10+ operatives'],
  },
  {
    id: 'duration',
    q: 'Expected duration of works?',
    opts: ['Less than 1 day', '2–3 days', 'Up to 1 week', 'Over 1 week'],
  },
  {
    id: 'publicAccess',
    q: 'Public access to the work area?',
    opts: ['No — controlled access only', 'Partial — pedestrians nearby', 'Yes — public can approach', 'Adjacent to live carriageway'],
  },
  {
    id: 'plant',
    q: 'Plant and machinery required?',
    opts: ['Hand tools only', 'Small plant (< 3.5t)', 'Large plant / excavators', 'Crane or lifting operations'],
  },
];

const TASK_EXTRAS = {
  'Working at Height':          [{ id: 'maxHeight',    q: 'Maximum working height?',        opts: ['Up to 2m', '2m–4m', '4m–10m', 'Over 10m'] }],
  'Roof Work':                  [{ id: 'maxHeight',    q: 'Maximum working height?',        opts: ['Up to 2m', '2m–4m', '4m–10m', 'Over 10m'] }],
  'Excavation / Groundworks':   [
    { id: 'excavDepth',  q: 'Maximum excavation depth?',       opts: ['< 0.5m (topsoil)', '0.5m–1.2m', '1.2m–2m', 'Over 2m'] },
    { id: 'underground', q: 'Underground services present?',   opts: ['No known services', 'CAT scan required', 'Services identified — marked', 'Services to be isolated first'] },
  ],
  'Underground Services':       [{ id: 'underground', q: 'Services location status?',        opts: ['Unknown — trial dig required', 'CAT scan complete', 'Marked on drawings', 'Isolation required first'] }],
  'Confined Space Entry':       [{ id: 'atmosphere',  q: 'Atmospheric monitoring level?',    opts: ['Clean entry — no gas risk', 'CO / O₂ monitoring', 'Full gas detection suite', 'SCBA / BA required'] }],
  'Hot Works / Welding':        [{ id: 'environment', q: 'Working environment?',             opts: ['Open air', 'Ventilated building', 'Poorly ventilated building', 'Confined / enclosed space'] }],
  'Electrical Isolation':       [{ id: 'voltage',     q: 'System voltage?',                  opts: ['ELV (< 50V AC)', 'Low voltage 230V', '415V 3-phase', 'High voltage (> 1kV)'] }],
  'Road / Highway Works':       [{ id: 'trafficSpeed',q: 'Carriageway speed limit?',         opts: ['20–30 mph', '40–50 mph', '60 mph', '70 mph / motorway'] }],
  'Crane / Lifting Operations': [{ id: 'swl',         q: 'Maximum SWL required?',            opts: ['< 1 tonne', '1–5 tonnes', '5–25 tonnes', '> 25 tonnes'] }],
  'Demolition / Strip Out':     [{ id: 'structure',   q: 'Structure type?',                  opts: ['Lightweight partitions', 'Brick / block masonry', 'Reinforced concrete', 'Structural steel frame'] }],
  'Asbestos Removal':           [{ id: 'asbestos',    q: 'Works scope / ACM type?',          opts: ['Presumed — survey required first', 'Non-licensed ACM removal', 'Licensed removal (CAR 2012)', 'Air monitoring required'] }],
  'Tree Work / Vegetation':     [{ id: 'treeHeight',  q: 'Maximum tree / vegetation height?',opts: ['Under 5m', '5m–10m', '10m–20m', 'Over 20m'] }],
};

const ANSWER_LABELS = {
  operatives:   'Operatives on site',
  duration:     'Duration of works',
  publicAccess: 'Public access',
  plant:        'Plant and machinery',
  maxHeight:    'Maximum working height',
  excavDepth:   'Excavation depth',
  underground:  'Underground services',
  atmosphere:   'Atmospheric monitoring',
  environment:  'Working environment',
  voltage:      'System voltage',
  trafficSpeed: 'Traffic speed',
  swl:          'Maximum SWL',
  structure:    'Structure type',
  asbestos:     'Asbestos scope',
  treeHeight:   'Tree / vegetation height',
};

export function buildAnswersContext(answers) {
  if (!answers || Object.keys(answers).length === 0) return '';
  const lines = Object.entries(answers).map(([k, v]) => `• ${ANSWER_LABELS[k] || k}: ${v}`);
  return `\nCONFIRMED SITE DETAILS:\n${lines.join('\n')}\n`;
}

export default function ClarifyingQuestions({ taskType, onSubmit, onBack }) {
  const extras = (taskType && TASK_EXTRAS[taskType]) || [];
  const allQuestions = [...BASE_QUESTIONS, ...extras];
  const [answers, setAnswers] = useState({});
  const allAnswered = allQuestions.every(q => answers[q.id]);

  const select = (id, opt) => setAnswers(prev => ({ ...prev, [id]: opt }));

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
          Your answers are injected directly into the AI prompt. More context = more accurate, site-specific RAMS.
        </div>
      </div>

      {/* Questions */}
      <div style={{ padding: '28px' }}>
        {allQuestions.map((q, qi) => {
          const answered = !!answers[q.id];
          return (
            <div key={q.id} style={{ marginBottom: qi < allQuestions.length - 1 ? 28 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: answered ? 'rgba(0,229,160,0.08)' : 'transparent',
                  border: `1.5px solid ${answered ? '#00e5a0' : '#2a2d35'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, color: '#00e5a0', transition: 'all 0.2s',
                }}>
                  {answered ? '✓' : <span style={{ fontSize: 10, color: '#555' }}>{qi + 1}</span>}
                </div>
                <div style={{ fontSize: 14, color: '#c0c0b8', fontWeight: 500 }}>
                  {q.q}
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingLeft: 32 }}>
                {q.opts.map(opt => {
                  const sel = answers[q.id] === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => select(q.id, opt)}
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
          onClick={() => allAnswered && onSubmit(answers)}
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
        {!allAnswered && (
          <div style={{ fontSize: 12, color: '#555' }}>
            {allQuestions.length - Object.keys(answers).length} question{allQuestions.length - Object.keys(answers).length !== 1 ? 's' : ''} remaining
          </div>
        )}
      </div>
    </div>
  );
}
