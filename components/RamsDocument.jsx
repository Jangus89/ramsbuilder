'use client';

import { useEffect, useState } from 'react';
import { callOpenAIChat, parseJsonResponse } from '../lib/openaiClient';
import { supabase } from '../lib/supabase';

const STATUS_FLOW = ['draft', 'reviewed', 'approved', 'issued'];
const STATUS_LABELS = {
  draft: 'Draft',
  reviewed: 'Reviewed',
  approved: 'Approved',
  issued: 'Issued',
};

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
const SIGN_ROLES = ['Author', 'Reviewer', 'Approver', 'Site Manager'];

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${data.session?.access_token || ''}` };
}

function nextStatus(status) {
  const index = STATUS_FLOW.indexOf(status);
  return STATUS_FLOW[Math.min(index + 1, STATUS_FLOW.length - 1)];
}

function fieldValueToText(value) {
  return Array.isArray(value) ? value.join('\n') : String(value || '');
}

function IconButton({ title, onClick, disabled, children }) {
  return (
    <button className="section-tool-btn" title={title} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

function SectionTools({ field, value, data, issued, onEdit, onEditStart, copiedField, setCopiedField, loadingField, setLoadingField }) {
  const canEdit = EDITABLE_FIELDS.has(field);

  const copy = async () => {
    await navigator.clipboard.writeText(fieldValueToText(value));
    setCopiedField(field);
    setTimeout(() => setCopiedField(current => current === field ? null : current), 1500);
  };

  const regenerate = async () => {
    setLoadingField(field);
    try {
      const expectsArray = Array.isArray(value);
      const resp = await callOpenAIChat({
        model: 'gpt-4o',
        temperature: 0.2,
        max_tokens: expectsArray ? 1200 : 2200,
        messages: [
          {
            role: 'system',
            content: `Rewrite exactly one RAMS field. Return ONLY ${expectsArray ? 'a JSON array of strings' : 'the new plain string'}, no preamble.`,
          },
          {
            role: 'user',
            content: `Given this RAMS context:\n${JSON.stringify(data)}\n\nRewrite only the "${field}" field.`,
          },
        ],
      });
      const raw = resp.choices?.[0]?.message?.content || '';
      const nextValue = expectsArray ? parseJsonResponse(raw, 'Could not parse regenerated list.') : raw.trim();
      await onEdit(field, nextValue);
    } finally {
      setLoadingField(null);
    }
  };

  return (
    <div className="section-tools">
      <IconButton title="Copy section" onClick={copy}>
        {copiedField === field ? 'Copied' : 'Copy'}
      </IconButton>
      {canEdit && (
        <IconButton title="Edit section" disabled={issued} onClick={onEditStart}>
          Edit
        </IconButton>
      )}
      <IconButton title="Regenerate section" disabled={issued || loadingField === field} onClick={regenerate}>
        {loadingField === field ? '...' : 'Regen'}
      </IconButton>
    </div>
  );
}

function EditableSection({ title, field, value, data, issued, edited, onEdit, copiedField, setCopiedField, loadingField, setLoadingField }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(fieldValueToText(value));

  const save = async () => {
    setEditing(false);
    await onEdit(field, draft);
  };

  return (
    <details className="rams-section rams-accordion" open>
      <summary>{title}</summary>
      <div className="rams-section-heading">
        <div className="rams-section-title">{title}</div>
        <SectionTools
          field={field}
          value={value}
          data={data}
          issued={issued}
          onEdit={onEdit}
          copiedField={copiedField}
          setCopiedField={setCopiedField}
          loadingField={loadingField}
          setLoadingField={setLoadingField}
          onEditStart={() => { setDraft(fieldValueToText(value)); setEditing(true); }}
        />
      </div>
      {edited && <span className="edited-badge">Edited</span>}
      {editing ? (
        <div>
          <textarea
            className="section-editor"
            value={draft}
            onChange={event => setDraft(event.target.value)}
            onBlur={save}
            autoFocus
          />
          <button className="section-save-btn" onMouseDown={event => event.preventDefault()} onClick={save}>Save</button>
        </div>
      ) : (
        <p className="rams-text" style={{ whiteSpace: 'pre-line' }}>{value}</p>
      )}
    </details>
  );
}

function ListSection({ title, field, items = [], data, issued, onEdit, copiedField, setCopiedField, loadingField, setLoadingField }) {
  return (
    <details className="rams-section rams-accordion" open>
      <summary>{title}</summary>
      <div className="rams-section-heading">
        <div className="rams-section-title">{title}</div>
        <SectionTools
          field={field}
          value={items}
          data={data}
          issued={issued}
          onEdit={onEdit}
          copiedField={copiedField}
          setCopiedField={setCopiedField}
          loadingField={loadingField}
          setLoadingField={setLoadingField}
        />
      </div>
      <div className="ppe-grid">
        {items.map((item, i) => (
          <div key={i} className="ppe-item">{item}</div>
        ))}
      </div>
    </details>
  );
}

function SignOffPanel({ documentId, signatures, onSigned }) {
  const [signingRole, setSigningRole] = useState(null);
  const [fullName, setFullName] = useState('');

  const sign = async () => {
    const res = await fetch(`/api/documents/${documentId}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify({ role: signingRole, fullName }),
    });
    const data = await res.json();
    if (data.signature) {
      onSigned(data.signature);
      setSigningRole(null);
      setFullName('');
    }
  };

  return (
    <div className="rams-section">
      <div className="rams-section-title">Digital Sign-off</div>
      <div className="sign-off-grid">
        {SIGN_ROLES.map(role => {
          const signature = signatures.find(item => item.role === role);
          return (
            <div key={role} className="sign-off-box">
              <div className="sign-off-label">{role}</div>
              {signature ? (
                <>
                  <div style={{ fontSize: 13, color: '#c0c0b8' }}>{signature.full_name}</div>
                  <div style={{ fontSize: 11, color: '#555', marginTop: 6 }}>{new Date(signature.signed_at).toLocaleString('en-GB')}</div>
                </>
              ) : (
                <button className="section-save-btn" onClick={() => setSigningRole(role)}>Sign as {role}</button>
              )}
            </div>
          );
        })}
      </div>
      {signingRole && (
        <div className="modal-lite">
          <div>
            <h3>Sign as {signingRole}</h3>
            <input value={fullName} onChange={event => setFullName(event.target.value)} placeholder="Full name" />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={sign} disabled={!fullName.trim()}>Confirm signature</button>
              <button onClick={() => setSigningRole(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AuditTrail({ audit }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rams-section">
      <button className="section-save-btn" onClick={() => setOpen(prev => !prev)}>{open ? 'Hide' : 'Show'} Audit Trail</button>
      {open && (
        <div className="timeline">
          {audit.map(item => (
            <div key={item.id} className="timeline-item">
              <strong>{item.action}</strong>
              <span>{new Date(item.created_at).toLocaleString('en-GB')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VersionHistory({ versions, onOpenDiff }) {
  if (!versions.length) return null;
  return (
    <div className="rams-section">
      <div className="rams-section-title">Version History</div>
      <div className="timeline">
        {versions.map(version => (
          <div key={version.id} className="timeline-item">
            <strong>v{version.version || 1} · {version.status || 'draft'}</strong>
            <span>{new Date(version.created_at).toLocaleDateString('en-GB')}</span>
            {(version.version || 1) > 1 && <button className="section-save-btn" onClick={() => onOpenDiff(version)}>Compare with previous</button>}
          </div>
        ))}
      </div>
    </div>
  );
}

function lineDiff(oldText, newText) {
  const oldLines = String(oldText || '').split('\n');
  const newLines = String(newText || '').split('\n');
  const max = Math.max(oldLines.length, newLines.length);
  const rows = [];
  for (let i = 0; i < max; i++) {
    if (oldLines[i] === newLines[i]) rows.push({ type: 'same', text: oldLines[i] || '' });
    else {
      if (oldLines[i]) rows.push({ type: 'removed', text: oldLines[i] });
      if (newLines[i]) rows.push({ type: 'added', text: newLines[i] });
    }
  }
  return rows;
}

export default function RamsDocument({
  data,
  documentId,
  status = 'draft',
  onReset,
  onEdit,
  onAdvanceStatus,
  onExportPDF,
  onExportWord,
  onExportDrive,
  onExportOneDrive,
}) {
  const [copiedField, setCopiedField] = useState(null);
  const [loadingField, setLoadingField] = useState(null);
  const [signatures, setSignatures] = useState([]);
  const [audit, setAudit] = useState([]);
  const [versions, setVersions] = useState([]);
  const [diffVersion, setDiffVersion] = useState(null);
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const refNum = data.refNumber || `SF-${Date.now().toString().slice(-6)}`;
  const issued = status === 'issued';
  const advancedStatus = nextStatus(status);

  const sectionProps = {
    data,
    issued,
    onEdit,
    copiedField,
    setCopiedField,
    loadingField,
    setLoadingField,
  };

  useEffect(() => {
    if (!documentId) return;
    authHeaders().then(headers => {
      fetch(`/api/documents/${documentId}/audit`, { headers })
        .then(res => res.json())
        .then(result => {
          setAudit(result.audit || []);
          setSignatures(result.signatures || []);
        })
        .catch(() => {});
    });
    supabase.from('rams_documents').select('id,version,status,created_at,parent_id,data').or(`id.eq.${documentId},parent_id.eq.${documentId}`).order('version')
      .then(({ data }) => setVersions(data || []));
  }, [documentId]);

  const handleSigned = (signature) => {
    const next = [...signatures, signature];
    setSignatures(next);
    if (SIGN_ROLES.every(role => next.some(item => item.role === role))) {
      onAdvanceStatus('issued');
    }
  };

  const createVersion = async () => {
    const res = await fetch(`/api/documents/${documentId}/version`, { method: 'POST', headers: await authHeaders() });
    const result = await res.json();
    if (result.document) window.location.href = '/';
  };

  return (
    <div className="rams-output">
      <div className="rams-header">
        <h2 className="rams-title">RAMS Generated</h2>
        <div className="export-buttons">
          <button className="export-btn pdf" onClick={onExportPDF}>Download PDF</button>
          {onExportWord && <button className="export-btn word" onClick={onExportWord}>Download Word</button>}
          <button className="export-btn drive" onClick={onExportDrive}>Google Drive</button>
          <button className="export-btn onedrive" onClick={onExportOneDrive}>OneDrive</button>
        </div>
      </div>

      <div className="rams-doc" id="rams-document">
        <div className="rams-doc-header">
          <div>
            <div className="rams-doc-title">{data.taskType} — Risk Assessment & Method Statement</div>
            <div className="rams-doc-meta">
              <span>Ref: {refNum}</span>
              <span>Date: {today}</span>
              <span>Version: 1.0</span>
              {data.location && <span>Location: {data.location}</span>}
              {data.reviewDate && <span>Review by: {data.reviewDate}</span>}
            </div>
          </div>
          <div className="status-actions">
            <div className={`rams-status status-${status}`}>{issued ? 'LOCKED - ISSUED' : STATUS_LABELS[status]}</div>
            {!issued && (
              <button className="advance-status-btn" onClick={() => onAdvanceStatus(advancedStatus)}>
                Advance to {STATUS_LABELS[advancedStatus]}
              </button>
            )}
            {issued && documentId && <button className="advance-status-btn" onClick={createVersion}>Create new version</button>}
          </div>
        </div>

        <div className="rams-body">
          <EditableSection title="Scope of Works" field="scopeOfWorks" value={data.scopeOfWorks} edited={data.editedFields?.scopeOfWorks} {...sectionProps} />

          <div className="rams-section">
            <div className="rams-section-heading">
              <div className="rams-section-title">Site Observations</div>
              <SectionTools field="siteObservations" value={data.siteObservations} {...sectionProps} />
            </div>
            <p className="rams-text">{data.siteObservations}</p>
          </div>

          <div className="rams-section">
            <div className="rams-section-title">Hazard Register & Risk Assessment</div>
            <table className="hazard-table">
              <thead>
                <tr>
                  <th>Hazard</th>
                  <th>Those at Risk</th>
                  <th>Initial Risk (LxS)</th>
                  <th>Control Measures</th>
                  <th>Residual Risk (LxS)</th>
                </tr>
              </thead>
              <tbody>
                {(data.hazards || []).map((h, i) => (
                  <tr key={i}>
                    <td>{h.hazard}</td>
                    <td>{h.thoseAtRisk}</td>
                    <td>
                      <span className={`risk-badge risk-${String(h.initialRisk || '').toLowerCase()}`}>{h.initialRisk}</span>
                      {h.initialLikelihood && <div className="risk-score">{h.initialLikelihood}x{h.initialSeverity}={h.initialLikelihood * h.initialSeverity}</div>}
                    </td>
                    <td>{h.controls}</td>
                    <td>
                      <span className={`risk-badge risk-${String(h.residualRisk || '').toLowerCase()}`}>{h.residualRisk}</span>
                      {h.residualLikelihood && <div className="risk-score">{h.residualLikelihood}x{h.residualSeverity}={h.residualLikelihood * h.residualSeverity}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <EditableSection title="Method Statement" field="methodStatement" value={data.methodStatement} edited={data.editedFields?.methodStatement} {...sectionProps} />
          <ListSection title="Personal Protective Equipment" field="ppe" items={data.ppe || []} {...sectionProps} />
          <EditableSection title="Emergency Arrangements" field="emergencyArrangements" value={data.emergencyArrangements} edited={data.editedFields?.emergencyArrangements} {...sectionProps} />
          <EditableSection title="Competencies Required" field="competencies" value={data.competencies} edited={data.editedFields?.competencies} {...sectionProps} />
          {(data.trainingRequirements || []).length > 0 && <ListSection title="Training Requirements" field="trainingRequirements" items={data.trainingRequirements} {...sectionProps} />}
          {data.welfareArrangements && <EditableSection title="Welfare Arrangements" field="welfareArrangements" value={data.welfareArrangements} edited={data.editedFields?.welfareArrangements} {...sectionProps} />}
          {data.environmentalControls && <EditableSection title="Environmental Controls" field="environmentalControls" value={data.environmentalControls} edited={data.editedFields?.environmentalControls} {...sectionProps} />}
          {data.coshhAssessment && <EditableSection title="COSHH Assessment" field="coshhAssessment" value={data.coshhAssessment} edited={data.editedFields?.coshhAssessment} {...sectionProps} />}
          {data.refuellingProcedure && <EditableSection title="Refuelling Procedure" field="refuellingProcedure" value={data.refuellingProcedure} edited={data.editedFields?.refuellingProcedure} {...sectionProps} />}

          {documentId ? <SignOffPanel documentId={documentId} signatures={signatures} onSigned={handleSigned} /> : null}

          {(data.references || []).length > 0 && (
            <div className="rams-section">
              <div className="rams-section-title">HSE References</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.references.map((ref, i) => (
                  <a key={i} href={ref.url} target="_blank" rel="noopener noreferrer" className="reference-link">
                    {ref.title}
                  </a>
                ))}
              </div>
            </div>
          )}
          <AuditTrail audit={audit} />
          <VersionHistory versions={versions} onOpenDiff={setDiffVersion} />
          {diffVersion && (
            <div className="warning-banner">
              <div>
                <strong>Diff preview for v{diffVersion.version}</strong>
                <pre>
                  {lineDiff(JSON.stringify(data, null, 2), JSON.stringify(diffVersion.data, null, 2)).slice(0, 80).map((row, index) => (
                    <span key={index} className={`diff-${row.type}`}>{row.type === 'added' ? '+ ' : row.type === 'removed' ? '- ' : '  '}{row.text}{'\n'}</span>
                  ))}
                </pre>
              </div>
              <button onClick={() => setDiffVersion(null)}>Close</button>
            </div>
          )}
        </div>
      </div>

      <button className="reset-btn" onClick={onReset}>Start new RAMS</button>
    </div>
  );
}
