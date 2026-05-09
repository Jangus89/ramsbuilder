'use client';

import { useState, useEffect } from 'react';

const PAGE_STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0f1117; color: #e8e8e4; font-family: 'DM Sans', sans-serif; min-height: 100vh; }
  .sv-wrap { max-width: 860px; margin: 0 auto; padding: 48px 24px 80px; }
  .sv-header { display: flex; align-items: center; gap: 10px; margin-bottom: 40px; }
  .sv-logo { width: 32px; height: 32px; background: #00e5a0; border-radius: 7px; display: flex; align-items: center; justify-content: center; }
  .sv-logo svg { width: 18px; height: 18px; fill: #0f1117; }
  .sv-logo-text { font-family: 'DM Mono', monospace; font-size: 16px; color: #e8e8e4; }
  .sv-company { font-size: 12px; color: #555; margin-top: 2px; }
  .sv-title { font-family: 'Instrument Serif', serif; font-size: 26px; margin-bottom: 6px; }
  .sv-meta { font-family: 'DM Mono', monospace; font-size: 11px; color: #555; display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 32px; }
  .sv-section { margin-bottom: 28px; padding-bottom: 28px; border-bottom: 1px solid #1e2128; }
  .sv-section:last-child { border-bottom: none; }
  .sv-section-title { font-family: 'DM Mono', monospace; font-size: 11px; color: #00e5a0; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 12px; }
  .sv-text { font-size: 14px; color: #c0c0b8; line-height: 1.7; white-space: pre-line; }
  .sv-chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .sv-chip { background: #1e2128; border: 1px solid #2a2d35; border-radius: 6px; padding: 6px 12px; font-size: 13px; color: #c0c0b8; }
  .sv-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .sv-table th { text-align: left; padding: 8px 12px; font-family: 'DM Mono', monospace; font-size: 10px; color: #555; letter-spacing: 0.06em; text-transform: uppercase; border-bottom: 1px solid #1e2128; }
  .sv-table td { padding: 10px 12px; color: #c0c0b8; border-bottom: 1px solid #1a1c22; vertical-align: top; line-height: 1.5; }
  .sv-risk { display: inline-block; padding: 2px 8px; border-radius: 3px; font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; }
  .sv-risk-high { background: rgba(239,68,68,0.1); color: #ef4444; }
  .sv-risk-medium { background: rgba(245,158,11,0.1); color: #f59e0b; }
  .sv-risk-low { background: rgba(0,229,160,0.1); color: #00e5a0; }
  .sv-ack-form { background: #13151c; border: 1.5px solid #1e2128; border-radius: 12px; padding: 28px; margin-top: 40px; }
  .sv-ack-form h3 { font-size: 16px; margin-bottom: 8px; }
  .sv-ack-form p { font-size: 13px; color: #888; margin-bottom: 18px; line-height: 1.6; }
  .sv-ack-form input { width: 100%; background: #0f1117; border: 1.5px solid #2a2d35; border-radius: 8px; color: #e8e8e4; font-family: 'DM Sans', sans-serif; font-size: 14px; padding: 12px 14px; outline: none; margin-bottom: 12px; }
  .sv-ack-form input:focus { border-color: #00e5a0; }
  .sv-ack-btn { width: 100%; background: #00e5a0; color: #0f1117; border: none; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600; padding: 14px; cursor: pointer; }
  .sv-ack-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .sv-ack-done { background: rgba(0,229,160,0.06); border: 1px solid rgba(0,229,160,0.2); border-radius: 10px; padding: 20px; color: #00e5a0; font-size: 14px; line-height: 1.6; margin-top: 40px; }
  .sv-invalid { text-align: center; padding: 120px 24px; color: #555; font-size: 16px; }
  .sv-loading { text-align: center; padding: 120px 24px; color: #555; }
`;

function riskClass(value) {
  const safe = String(value || '').toLowerCase();
  if (safe === 'high') return 'sv-risk sv-risk-high';
  if (safe === 'low') return 'sv-risk sv-risk-low';
  return 'sv-risk sv-risk-medium';
}

export default function SharedViewPage({ params: paramsPromise }) {
  const [token, setToken] = useState(null);
  const [doc, setDoc] = useState(null);
  const [invalid, setInvalid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ackName, setAckName] = useState('');
  const [ackCompany, setAckCompany] = useState('');
  const [ackDone, setAckDone] = useState(null);
  const [ackSubmitting, setAckSubmitting] = useState(false);

  useEffect(() => {
    Promise.resolve(paramsPromise).then(p => {
      setToken(p.token);
      fetch(`/api/share/${p.token}`)
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => { setDoc(data); setLoading(false); })
        .catch(() => { setInvalid(true); setLoading(false); });
    });
  }, [paramsPromise]);

  const handleAcknowledge = async () => {
    if (!ackName.trim() || !token) return;
    setAckSubmitting(true);
    try {
      const resp = await fetch(`/api/share/${token}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientName: ackName, recipientCompany: ackCompany }),
      });
      if (resp.ok) {
        setAckDone({
          name: ackName,
          company: ackCompany,
          date: new Date().toLocaleString('en-GB'),
        });
      }
    } catch { /* ignore */ }
    setAckSubmitting(false);
  };

  if (loading) {
    return (
      <>
        <style>{PAGE_STYLES}</style>
        <div className="sv-loading">Loading document…</div>
      </>
    );
  }

  if (invalid || !doc) {
    return (
      <>
        <style>{PAGE_STYLES}</style>
        <div className="sv-invalid">This link is no longer valid.</div>
      </>
    );
  }

  const d = doc.documentData;

  return (
    <>
      <style>{PAGE_STYLES}</style>
      <div className="sv-wrap">
        <div className="sv-header">
          <div className="sv-logo">
            <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <div>
            <div className="sv-logo-text">{doc.companyName || 'SafeFlow'}</div>
            <div className="sv-company">Risk Assessment & Method Statement</div>
          </div>
        </div>

        <div className="sv-title">{d.taskType} — RAMS</div>
        <div className="sv-meta">
          {d.location && <span>Location: {d.location}</span>}
          <span>Created: {new Date(doc.createdAt).toLocaleDateString('en-GB')}</span>
        </div>

        {d.scopeOfWorks && (
          <div className="sv-section">
            <div className="sv-section-title">Scope of Works</div>
            <div className="sv-text">{d.scopeOfWorks}</div>
          </div>
        )}

        {d.siteObservations && (
          <div className="sv-section">
            <div className="sv-section-title">Site Observations</div>
            <div className="sv-text">{d.siteObservations}</div>
          </div>
        )}

        {(d.hazards || []).length > 0 && (
          <div className="sv-section">
            <div className="sv-section-title">Hazard Register & Risk Assessment</div>
            <table className="sv-table">
              <thead>
                <tr>
                  <th>Hazard</th>
                  <th>Those at Risk</th>
                  <th>Initial Risk</th>
                  <th>Controls</th>
                  <th>Residual Risk</th>
                </tr>
              </thead>
              <tbody>
                {d.hazards.map((h, i) => (
                  <tr key={i}>
                    <td>{h.hazard}</td>
                    <td>{h.thoseAtRisk}</td>
                    <td><span className={riskClass(h.initialRisk)}>{h.initialRisk}</span></td>
                    <td>{h.controls}</td>
                    <td><span className={riskClass(h.residualRisk)}>{h.residualRisk}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {d.methodStatement && (
          <div className="sv-section">
            <div className="sv-section-title">Method Statement</div>
            <div className="sv-text">{d.methodStatement}</div>
          </div>
        )}

        {(d.ppe || []).length > 0 && (
          <div className="sv-section">
            <div className="sv-section-title">PPE</div>
            <div className="sv-chips">{d.ppe.map((item, i) => <span key={i} className="sv-chip">{item}</span>)}</div>
          </div>
        )}

        {d.emergencyArrangements && (
          <div className="sv-section">
            <div className="sv-section-title">Emergency Arrangements</div>
            <div className="sv-text">{d.emergencyArrangements}</div>
          </div>
        )}

        {d.competencies && (
          <div className="sv-section">
            <div className="sv-section-title">Competencies Required</div>
            <div className="sv-text">{d.competencies}</div>
          </div>
        )}

        {d.welfareArrangements && (
          <div className="sv-section">
            <div className="sv-section-title">Welfare Arrangements</div>
            <div className="sv-text">{d.welfareArrangements}</div>
          </div>
        )}

        {d.environmentalControls && (
          <div className="sv-section">
            <div className="sv-section-title">Environmental Controls</div>
            <div className="sv-text">{d.environmentalControls}</div>
          </div>
        )}

        {d.coshhAssessment && (
          <div className="sv-section">
            <div className="sv-section-title">COSHH Assessment</div>
            <div className="sv-text">{d.coshhAssessment}</div>
          </div>
        )}

        {ackDone ? (
          <div className="sv-ack-done">
            ✓ Acknowledged by {ackDone.name}{ackDone.company ? `, ${ackDone.company}` : ''} on {ackDone.date}. A confirmation has been sent to the document owner.
          </div>
        ) : (
          <div className="sv-ack-form">
            <h3>Acknowledgement</h3>
            <p>I confirm I have read and understood this Risk Assessment and Method Statement.</p>
            <input
              placeholder="Full name *"
              value={ackName}
              onChange={e => setAckName(e.target.value)}
            />
            <input
              placeholder="Company name (optional)"
              value={ackCompany}
              onChange={e => setAckCompany(e.target.value)}
            />
            <button
              className="sv-ack-btn"
              onClick={handleAcknowledge}
              disabled={!ackName.trim() || ackSubmitting}
            >
              {ackSubmitting ? 'Submitting…' : 'Acknowledge'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
