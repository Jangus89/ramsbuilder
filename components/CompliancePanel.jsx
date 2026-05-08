'use client';
import { useState } from 'react';
import { filterRelevantProcedures } from '../lib/procedureLibrary';

const SEV = {
  Critical: { bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.2)', color: '#ef4444', badgeBg: 'rgba(239,68,68,0.1)' },
  Warning:  { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)', color: '#f59e0b', badgeBg: 'rgba(245,158,11,0.1)' },
  Info:     { bg: 'rgba(99,179,237,0.06)',  border: 'rgba(99,179,237,0.2)',  color: '#63b3ed', badgeBg: 'rgba(99,179,237,0.1)' },
};

function buildCompliancePrompt(ramsJson, profile, procedures) {
  const lines = [
    'You are a HSQE compliance auditor. Review the RAMS document below against the company management system. Identify specific conflicts, gaps, and non-compliances with reference to the procedures and requirements provided.',
  ];

  if (profile.companyName) lines.push(`\nCOMPANY: ${profile.companyName}`);
  if (profile.riskMatrixDefinition) lines.push(`RISK MATRIX: ${profile.riskMatrixDefinition}`);
  if (profile.mandatoryControls) lines.push(`MANDATORY CONTROLS (must all be present):\n${profile.mandatoryControls}`);
  if (profile.ptwTriggers) lines.push(`PERMIT TO WORK TRIGGERS:\n${profile.ptwTriggers}`);
  if (profile.additionalGuidance) lines.push(`ADDITIONAL GUIDANCE:\n${profile.additionalGuidance}`);

  if (procedures.length > 0) {
    lines.push('\nAPPLICABLE PROCEDURES:');
    procedures.forEach(p => {
      const text = p.text.length > 3000 ? p.text.slice(0, 3000) + '\n[truncated]' : p.text;
      lines.push(`\n[${p.code || 'PROC'}] ${p.title}:\n${text}`);
    });
  }

  lines.push(`\nRAMS TO REVIEW:\n${JSON.stringify(ramsJson, null, 2)}`);

  lines.push(`
Respond ONLY with valid JSON:
{
  "score": 0-100,
  "summary": "One sentence overall verdict on compliance",
  "issues": [
    { "severity": "Critical|Warning|Info", "section": "section name in RAMS", "issue": "specific description of the conflict or gap", "recommendation": "precise action to resolve it" }
  ],
  "compliantAreas": ["list of areas that comply well with the procedures and requirements"]
}`);

  return lines.join('\n');
}

export default function CompliancePanel({ ramsData, profile, procedures, apiKey }) {
  const [state, setState] = useState('idle');
  const [result, setResult] = useState(null);
  const [errMsg, setErrMsg] = useState('');

  const hasContext = profile.mandatoryControls || profile.riskMatrixDefinition || profile.ptwTriggers || procedures.length > 0;

  const runCheck = async () => {
    setState('loading');
    setErrMsg('');
    try {
      const relevant = filterRelevantProcedures(procedures, ramsData.taskType);
      const prompt = buildCompliancePrompt(ramsData, profile, relevant);
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'gpt-4o', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.choices?.[0]?.message?.content || '';
      const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(clean));
      setState('done');
    } catch (err) {
      setErrMsg(err.message || 'Compliance check failed');
      setState('error');
    }
  };

  const scoreColor = !result ? '#555' : result.score >= 80 ? '#00e5a0' : result.score >= 60 ? '#f59e0b' : '#ef4444';
  const critCount = result?.issues?.filter(i => i.severity === 'Critical').length || 0;
  const warnCount = result?.issues?.filter(i => i.severity === 'Warning').length || 0;

  return (
    <div style={{ marginTop: 32, border: '1.5px solid #1e2128', borderRadius: 12, overflow: 'hidden', background: '#13151c' }}>
      {/* Header bar */}
      <div style={{ padding: '18px 24px', borderBottom: state === 'done' ? '1px solid #1e2128' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#00e5a0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>
            Management System Compliance Check
          </div>
          <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>
            {!hasContext
              ? 'Add procedures or management system requirements in Company Settings to enable this check.'
              : state === 'done'
              ? `${critCount} critical · ${warnCount} warnings · ${result.compliantAreas?.length || 0} compliant areas`
              : 'Check this RAMS against your company management system and stored procedures.'
            }
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          {state === 'done' && result && (
            <div style={{ textAlign: 'center', lineHeight: 1 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 32, fontWeight: 700, color: scoreColor }}>{result.score}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#555', letterSpacing: '0.06em', marginTop: 2 }}>/ 100</div>
            </div>
          )}
          {state === 'loading' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#555', fontSize: 13 }}>
              <div style={{ width: 16, height: 16, border: '2px solid #1e2128', borderTopColor: '#00e5a0', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Checking…
            </div>
          ) : hasContext && (
            <button onClick={runCheck} style={{ background: state === 'done' ? 'transparent' : '#00e5a0', color: state === 'done' ? '#888' : '#0f1117', border: state === 'done' ? '1.5px solid #2a2d35' : 'none', borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, padding: '10px 18px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {state === 'done' ? 'Re-run Check' : 'Run Compliance Check'}
            </button>
          )}
        </div>
      </div>

      {state === 'error' && (
        <div style={{ padding: '14px 24px', color: '#ef4444', fontSize: 13, background: 'rgba(239,68,68,0.05)' }}>⚠ {errMsg}</div>
      )}

      {state === 'done' && result && (
        <div style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6, marginBottom: 24, fontStyle: 'italic', borderLeft: '2px solid #2a2d35', paddingLeft: 16 }}>
            {result.summary}
          </p>

          {result.issues?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Issues Found</div>
              {['Critical', 'Warning', 'Info'].map(sev => {
                const items = result.issues.filter(i => i.severity === sev);
                if (!items.length) return null;
                const st = SEV[sev];
                return items.map((issue, i) => (
                  <div key={`${sev}-${i}`} style={{ background: st.bg, border: `1px solid ${st.border}`, borderRadius: 8, padding: '14px 16px', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ background: st.badgeBg, color: st.color, fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.08em', padding: '3px 8px', borderRadius: 3, textTransform: 'uppercase', flexShrink: 0 }}>{sev}</span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{issue.section}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#c0c0b8', marginBottom: 8, lineHeight: 1.6 }}>{issue.issue}</div>
                    <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5 }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 6 }}>Fix →</span>
                      {issue.recommendation}
                    </div>
                  </div>
                ));
              })}
            </div>
          )}

          {result.compliantAreas?.length > 0 && (
            <div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Compliant Areas</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {result.compliantAreas.map((area, i) => (
                  <span key={i} style={{ background: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.15)', color: '#00e5a0', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontFamily: "'DM Mono', monospace" }}>✓ {area}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
