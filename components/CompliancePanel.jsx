'use client';
import { useState } from 'react';
import { filterRelevantProcedures } from '../lib/procedureLibrary';
import { filterGuidanceForTask } from '../lib/hseGuidance';
import { callOpenAIChat, parseJsonResponse } from '../lib/openaiClient';

const SEV = {
  Critical: { bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.2)', color: '#ef4444', badgeBg: 'rgba(239,68,68,0.1)' },
  Warning:  { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)', color: '#f59e0b', badgeBg: 'rgba(245,158,11,0.1)' },
  Info:     { bg: 'rgba(99,179,237,0.06)',  border: 'rgba(99,179,237,0.2)',  color: '#63b3ed', badgeBg: 'rgba(99,179,237,0.1)' },
};

function buildCompliancePrompt(ramsJson, profile, procedures) {
  const guidance = filterGuidanceForTask(ramsJson.taskType, 10);
  const lines = [
    'You are a HSQE compliance auditor. Review the RAMS document below against the company management system. Identify specific conflicts, gaps, and non-compliances with reference to the procedures and requirements provided.',
  ];
  if (profile.companyName)          lines.push(`\nCOMPANY: ${profile.companyName}`);
  if (profile.riskMatrixDefinition) lines.push(`RISK MATRIX: ${profile.riskMatrixDefinition}`);
  if (profile.mandatoryControls)    lines.push(`MANDATORY CONTROLS (must all be present):\n${profile.mandatoryControls}`);
  if (profile.ptwTriggers)          lines.push(`PERMIT TO WORK TRIGGERS:\n${profile.ptwTriggers}`);
  if (profile.additionalGuidance)   lines.push(`ADDITIONAL GUIDANCE:\n${profile.additionalGuidance}`);
  if (procedures.length > 0) {
    lines.push('\nAPPLICABLE PROCEDURES:');
    procedures.forEach(p => {
      const text = p.text.length > 3000 ? p.text.slice(0, 3000) + '\n[truncated]' : p.text;
      lines.push(`\n[${p.code || 'PROC'}] ${p.title}:\n${text}`);
    });
  }
  if (guidance.length > 0) {
    lines.push('\nRELEVANT HSE GUIDANCE (use for hseRef in issues):');
    guidance.forEach(g => lines.push(`- ${g.title}: ${g.url}`));
  }
  lines.push(`\nRAMS TO REVIEW:\n${JSON.stringify(ramsJson, null, 2)}`);
  lines.push(`
Respond ONLY with valid JSON:
{
  "score": 0-100,
  "summary": "One sentence overall verdict on compliance",
  "issues": [
    {
      "severity": "Critical|Warning|Info",
      "section": "section name in RAMS",
      "issue": "specific description of the conflict or gap",
      "recommendation": "precise action to resolve it",
      "hseRef": { "title": "most relevant HSE guidance title from the list above, or null", "url": "exact URL from the list, or null" }
    }
  ],
  "compliantAreas": ["list of areas that comply well with the procedures and requirements"]
}`);
  return lines.join('\n');
}

function buildFixPrompt(ramsJson, selectedIssues) {
  const issueList = selectedIssues
    .map((iss, i) => `${i + 1}. [${iss.severity}] Section: ${iss.section}\n   Issue: ${iss.issue}\n   Required fix: ${iss.recommendation}`)
    .join('\n\n');

  return `You are updating a RAMS document to address specific compliance issues identified in a review.

Current RAMS document:
${JSON.stringify(ramsJson, null, 2)}

Issues to address:
${issueList}

Update the RAMS document to fully address ALL issues listed above. Make targeted, specific improvements to the flagged sections. Keep all other content intact. Return ONLY the complete updated RAMS JSON with the exact same structure — no preamble, no markdown.`;
}

export default function CompliancePanel({ ramsData, profile, procedures, onUpdateRams }) {
  const [state, setState]           = useState('idle');
  const [result, setResult]         = useState(null);
  const [errMsg, setErrMsg]         = useState('');
  const [selected, setSelected]     = useState(new Set());
  const [fixing, setFixing]         = useState(false);
  const [fixErr, setFixErr]         = useState('');
  const [fixSuccess, setFixSuccess] = useState(false);

  const hasContext = profile.mandatoryControls || profile.riskMatrixDefinition || profile.ptwTriggers || procedures.length > 0;

  const runCheck = async () => {
    setState('loading');
    setErrMsg('');
    setSelected(new Set());
    setFixSuccess(false);
    try {
      const relevant = filterRelevantProcedures(procedures, ramsData.taskType);
      const prompt = buildCompliancePrompt(ramsData, profile, relevant);
      const data = await callOpenAIChat({ model: 'gpt-4o', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] });
      const text = data.choices?.[0]?.message?.content || '';
      setResult(parseJsonResponse(text, 'Could not read the compliance check response. Please try again.'));
      setState('done');
    } catch (err) {
      setErrMsg(err.message || 'Compliance check failed');
      setState('error');
    }
  };

  const toggleIssue = (idx) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const applyFixes = async () => {
    const issuesToFix = [...selected].map(i => result.issues[i]);
    setFixing(true);
    setFixErr('');
    setFixSuccess(false);
    try {
      const prompt = buildFixPrompt(ramsData, issuesToFix);
      const data = await callOpenAIChat({ model: 'gpt-4o', max_tokens: 4000, messages: [{ role: 'user', content: prompt }] });
      const text = data.choices?.[0]?.message?.content || '';
      const updated = parseJsonResponse(text, 'Could not read the updated RAMS response. Please try again.');
      onUpdateRams(updated);
      setSelected(new Set());
      setResult(null);
      setState('idle');
      setFixSuccess(true);
    } catch (err) {
      setFixErr(err.message || 'Failed to apply fixes. Please try again.');
    } finally {
      setFixing(false);
    }
  };

  const scoreColor = !result ? '#555' : result.score >= 80 ? '#00e5a0' : result.score >= 60 ? '#f59e0b' : '#ef4444';
  const critCount  = result?.issues?.filter(i => i.severity === 'Critical').length || 0;
  const warnCount  = result?.issues?.filter(i => i.severity === 'Warning').length || 0;

  return (
    <div style={{ marginTop: 32, border: '1.5px solid #1e2128', borderRadius: 12, overflow: 'hidden', background: '#13151c' }}>
      {/* Header */}
      <div style={{ padding: '18px 24px', borderBottom: state === 'done' ? '1px solid #1e2128' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#00e5a0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>
            Management System Compliance Check
          </div>
          <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>
            {fixSuccess
              ? 'RAMS document updated with selected fixes. Run the check again to verify.'
              : !hasContext
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
              {state === 'done' ? 'Re-run Check' : fixSuccess ? 'Run Check on Updated RAMS' : 'Run Compliance Check'}
            </button>
          )}
        </div>
      </div>

      {state === 'error' && (
        <div style={{ padding: '14px 24px', color: '#ef4444', fontSize: 13, background: 'rgba(239,68,68,0.05)' }}>⚠ {errMsg}</div>
      )}

      {fixSuccess && state === 'idle' && (
        <div style={{ padding: '14px 24px', color: '#00e5a0', fontSize: 13, background: 'rgba(0,229,160,0.05)', borderTop: '1px solid rgba(0,229,160,0.1)' }}>
          ✓ RAMS document updated. Run the compliance check again to confirm all issues have been resolved.
        </div>
      )}

      {state === 'done' && result && (
        <div style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6, marginBottom: 24, fontStyle: 'italic', borderLeft: '2px solid #2a2d35', paddingLeft: 16 }}>
            {result.summary}
          </p>

          {result.issues?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Issues Found — tick to fix
                </div>
                {selected.size > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {fixErr && <span style={{ fontSize: 12, color: '#ef4444' }}>{fixErr}</span>}
                    <button
                      onClick={applyFixes}
                      disabled={fixing}
                      style={{ background: '#00e5a0', color: '#0f1117', border: 'none', borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, padding: '9px 18px', cursor: fixing ? 'not-allowed' : 'pointer', opacity: fixing ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}
                    >
                      {fixing ? (
                        <>
                          <div style={{ width: 12, height: 12, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#0f1117', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                          Applying fixes…
                        </>
                      ) : (
                        <>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                          </svg>
                          Apply {selected.size} fix{selected.size !== 1 ? 'es' : ''} to RAMS
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {['Critical', 'Warning', 'Info'].map(sev => {
                const items = result.issues.map((iss, idx) => ({ ...iss, _idx: idx })).filter(i => i.severity === sev);
                if (!items.length) return null;
                const st = SEV[sev];
                return items.map((issue) => {
                  const isSelected = selected.has(issue._idx);
                  return (
                    <div
                      key={`${sev}-${issue._idx}`}
                      onClick={() => toggleIssue(issue._idx)}
                      style={{
                        background: isSelected ? 'rgba(0,229,160,0.04)' : st.bg,
                        border: `1px solid ${isSelected ? 'rgba(0,229,160,0.3)' : st.border}`,
                        borderRadius: 8,
                        padding: '14px 16px',
                        marginBottom: 10,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        {/* Checkbox */}
                        <div style={{
                          width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                          background: isSelected ? '#00e5a0' : 'transparent',
                          border: `1.5px solid ${isSelected ? '#00e5a0' : '#2a2d35'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginTop: 1, transition: 'all 0.15s',
                        }}>
                          {isSelected && (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M2 5l2.5 2.5 3.5-4" stroke="#0f1117" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <span style={{ background: st.badgeBg, color: st.color, fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.08em', padding: '3px 8px', borderRadius: 3, textTransform: 'uppercase', flexShrink: 0 }}>{sev}</span>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{issue.section}</span>
                          </div>
                          <div style={{ fontSize: 13, color: '#c0c0b8', marginBottom: 8, lineHeight: 1.6 }}>{issue.issue}</div>
                          <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5 }}>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 6 }}>Fix →</span>
                            {issue.recommendation}
                          </div>
                          {issue.hseRef?.url && (
                            <a
                              href={issue.hseRef.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 11, color: '#555', textDecoration: 'none', fontFamily: "'DM Mono', monospace", letterSpacing: '0.03em', transition: 'color 0.15s' }}
                              onMouseEnter={e => { e.currentTarget.style.color = '#00e5a0'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = '#555'; }}
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                <polyline points="15 3 21 3 21 9"/>
                                <line x1="10" y1="14" x2="21" y2="3"/>
                              </svg>
                              HSE: {issue.hseRef.title}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                });
              })}

              {selected.size === 0 && (
                <div style={{ fontSize: 12, color: '#555', marginTop: 8 }}>
                  Tick one or more issues above, then click "Apply fixes" to update the RAMS document automatically.
                </div>
              )}
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
