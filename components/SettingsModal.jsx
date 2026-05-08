'use client';
import { useState, useRef } from 'react';
import { useLocalStorage } from '../lib/useLocalStorage';
import { DEFAULT_PROFILE } from '../lib/companyProfile';
import { extractTextFromFile } from '../lib/procedureLibrary';

const CATEGORIES = [
  { value: '', label: 'All tasks' },
  { value: 'Excavation', label: 'Excavation / Groundworks' },
  { value: 'Height', label: 'Working at Height' },
  { value: 'Overhead', label: 'Overhead Lines' },
  { value: 'Underground', label: 'Underground Services' },
  { value: 'Confined', label: 'Confined Space Entry' },
  { value: 'Manual', label: 'Manual Handling' },
  { value: 'Demolition', label: 'Demolition / Strip Out' },
  { value: 'Electrical', label: 'Electrical Isolation' },
  { value: 'HotWorks', label: 'Hot Works / Welding' },
  { value: 'Asbestos', label: 'Asbestos Removal' },
  { value: 'Roof', label: 'Roof Work' },
  { value: 'Tree', label: 'Tree Work / Vegetation' },
  { value: 'Crane', label: 'Crane / Lifting Operations' },
  { value: 'Road', label: 'Road / Highway Works' },
];

const S = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: '24px 16px 48px' },
  modal: { width: '100%', maxWidth: 740, background: '#0f1117', border: '1px solid #1e2128', borderRadius: 16, display: 'flex', flexDirection: 'column' },
  header: { padding: '20px 28px', borderBottom: '1px solid #1e2128', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#0f1117', borderRadius: '16px 16px 0 0', zIndex: 1 },
  tabs: { display: 'flex', borderBottom: '1px solid #1e2128', padding: '0 28px', background: '#0f1117', position: 'sticky', top: 61, zIndex: 1 },
  tab: (active) => ({ background: 'none', border: 'none', borderBottom: active ? '2px solid #00e5a0' : '2px solid transparent', color: active ? '#00e5a0' : '#555', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '12px 16px 10px', transition: 'all 0.15s', marginBottom: -1 }),
  body: { padding: '28px' },
  secTitle: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
  secLine: { flex: 1, height: 1, background: '#1e2128' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 12, color: '#888', fontWeight: 500, marginBottom: 6 },
  help: { fontSize: 11, color: '#555', marginTop: 4, lineHeight: 1.5 },
  input: { width: '100%', background: '#13151c', border: '1.5px solid #1e2128', borderRadius: 8, color: '#e8e8e4', fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '10px 12px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' },
  textarea: { width: '100%', background: '#13151c', border: '1.5px solid #1e2128', borderRadius: 8, color: '#e8e8e4', fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '10px 12px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6, transition: 'border-color 0.2s' },
  select: { width: '100%', background: '#13151c', border: '1.5px solid #1e2128', borderRadius: 8, color: '#e8e8e4', fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '10px 12px', outline: 'none', appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23555' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 32 },
  btnPrimary: { background: '#00e5a0', color: '#0f1117', border: 'none', borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, padding: '10px 20px', cursor: 'pointer' },
  btnGhost: { background: 'transparent', border: '1.5px solid #2a2d35', color: '#888', borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '9px 16px', cursor: 'pointer', transition: 'all 0.15s' },
  procCard: { background: '#13151c', border: '1px solid #1e2128', borderRadius: 10, padding: '14px 18px', marginBottom: 10, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  addForm: { background: '#13151c', border: '1px solid #2a2d35', borderRadius: 12, padding: 24, marginTop: 16 },
  uploadZone: { border: '1.5px dashed #2a2d35', borderRadius: 8, padding: '20px', textAlign: 'center', cursor: 'pointer', position: 'relative', transition: 'all 0.2s' },
  errBox: { background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', color: '#ef4444', fontSize: 12, marginTop: 8 },
};

function focus(e) { e.target.style.borderColor = '#00e5a0'; }
function blur(e)  { e.target.style.borderColor = '#1e2128'; }

function SectionTitle({ children }) {
  return <div style={S.secTitle}>{children}<div style={S.secLine} /></div>;
}

function Field({ label, help, children }) {
  return (
    <div style={S.field}>
      <label style={S.label}>{label}</label>
      {children}
      {help && <div style={S.help}>{help}</div>}
    </div>
  );
}

function PersonnelRow({ label, nameVal, phoneVal, onName, onPhone }) {
  return (
    <div style={S.grid2}>
      <Field label={`${label} — Name`}>
        <input style={S.input} value={nameVal} onChange={e => onName(e.target.value)} placeholder={`${label} full name`} onFocus={focus} onBlur={blur} />
      </Field>
      <Field label={`${label} — Phone`}>
        <input style={S.input} value={phoneVal} onChange={e => onPhone(e.target.value)} placeholder="07xxx xxxxxx" onFocus={focus} onBlur={blur} />
      </Field>
    </div>
  );
}

function ProfileTab({ profile, setProfile }) {
  const up = (k, v) => setProfile(p => ({ ...p, [k]: v }));
  const inp = (k, ph) => ({ style: S.input, value: profile[k] || '', onChange: e => up(k, e.target.value), placeholder: ph, onFocus: focus, onBlur: blur });
  const ta = (k, ph, minH = 80) => ({ style: { ...S.textarea, minHeight: minH }, value: profile[k] || '', onChange: e => up(k, e.target.value), placeholder: ph, onFocus: focus, onBlur: blur });

  return (
    <div>
      <div style={{ background: 'rgba(0,229,160,0.05)', border: '1px solid rgba(0,229,160,0.15)', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#888', lineHeight: 1.6 }}>
        Everything here is saved locally in your browser and injected into every RAMS you generate — no data leaves your device except as part of the AI prompt.
      </div>

      <div style={{ marginBottom: 28 }}>
        <SectionTitle>Company Details</SectionTitle>
        <div style={S.grid2}>
          <Field label="Company Name"><input {...inp('companyName', 'e.g. Acme Construction Ltd')} /></Field>
          <Field label="Company Address"><input {...inp('companyAddress', 'e.g. 12 Business Park, Birmingham B1 1AA')} /></Field>
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <SectionTitle>Site Personnel</SectionTitle>
        <PersonnelRow label="Site Manager" nameVal={profile.siteManagerName || ''} phoneVal={profile.siteManagerPhone || ''} onName={v => up('siteManagerName', v)} onPhone={v => up('siteManagerPhone', v)} />
        <PersonnelRow label="Supervisor" nameVal={profile.supervisorName || ''} phoneVal={profile.supervisorPhone || ''} onName={v => up('supervisorName', v)} onPhone={v => up('supervisorPhone', v)} />
        <PersonnelRow label="First Aider" nameVal={profile.firstAiderName || ''} phoneVal={profile.firstAiderPhone || ''} onName={v => up('firstAiderName', v)} onPhone={v => up('firstAiderPhone', v)} />
      </div>

      <div style={{ marginBottom: 28 }}>
        <SectionTitle>Emergency Details</SectionTitle>
        <div style={S.grid2}>
          <Field label="Emergency Assembly Point"><input {...inp('emergencyAssemblyPoint', 'e.g. Car park, north entrance')} /></Field>
          <Field label="Nearest A&E Hospital"><input {...inp('nearestHospital', 'e.g. Birmingham City Hospital, Dudley Rd')} /></Field>
        </div>
      </div>

      <div>
        <SectionTitle>Management System</SectionTitle>
        <Field label="Risk Matrix Definition" help="Leave blank to use the default 5×5 matrix. If your system uses a different matrix, describe it here.">
          <textarea {...ta('riskMatrixDefinition', 'e.g. We use a 3×3 matrix. Likelihood: 1=Rare, 2=Possible, 3=Likely. Severity: 1=Minor, 2=Moderate, 3=Severe. Risk = L×S: Low=1-3, Medium=4-6, High=7-9.', 70)} />
        </Field>
        <Field label="Mandatory Controls" help="Controls that must appear in every RAMS regardless of task. The AI will include all of these.">
          <textarea {...ta('mandatoryControls', 'e.g. All operatives must complete site induction INF-001 before commencing work. RAMS must be read and signed by all operatives. Site manager must carry out a daily brief before work starts...', 100)} />
        </Field>
        <Field label="Permit to Work Triggers" help="List which tasks require a PTW and which form applies.">
          <textarea {...ta('ptwTriggers', 'e.g.\nHot works → PTW-HW-02\nConfined space entry → PTW-CS-01\nElectrical isolation → PTW-EL-03\nExcavation near services → PTW-EX-01', 100)} />
        </Field>
        <Field label="Document Reference Format" help="Format for RAMS reference numbers. Will be included in document header.">
          <input {...inp('docRefFormat', 'e.g. RA-{SITE}-{YYYY}-{NNN}')} />
        </Field>
        <Field label="Additional Management System Guidance">
          <textarea {...ta('additionalGuidance', 'Any other company-specific requirements, standard clauses, approved suppliers, or guidance that must be reflected in every RAMS...', 100)} />
        </Field>
      </div>
    </div>
  );
}

function ProcedureLibraryTab({ procedures, setProcedures }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', code: '', category: '', text: '' });
  const [extracting, setExtracting] = useState(false);
  const [extractErr, setExtractErr] = useState('');
  const [inputMode, setInputMode] = useState('upload');
  const fileRef = useRef();

  const upForm = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setExtracting(true);
    setExtractErr('');
    try {
      const text = await extractTextFromFile(file);
      upForm('text', text.slice(0, 50000));
      setForm(p => ({ ...p, text: text.slice(0, 50000), title: p.title || file.name.replace(/\.[^.]+$/, '') }));
    } catch (err) {
      setExtractErr(err.message);
    } finally {
      setExtracting(false);
      e.target.value = '';
    }
  };

  const addProc = () => {
    if (!form.title.trim() || !form.text.trim()) return;
    setProcedures(p => [...p, { ...form, id: Date.now().toString(), charCount: form.text.length, addedAt: new Date().toISOString() }]);
    setForm({ title: '', code: '', category: '', text: '' });
    setAdding(false);
    setExtractErr('');
  };

  const cancel = () => { setAdding(false); setForm({ title: '', code: '', category: '', text: '' }); setExtractErr(''); };

  return (
    <div>
      <p style={{ fontSize: 13, color: '#888', lineHeight: 1.6, marginBottom: 20 }}>
        Upload your company procedures. Relevant procedures are automatically matched to the task type and injected into the AI prompt — the output will comply with and reference them by document code.
      </p>

      {procedures.length === 0 && !adding && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#555', fontSize: 13, border: '1px dashed #1e2128', borderRadius: 10 }}>
          No procedures added yet.
        </div>
      )}

      {procedures.map(p => (
        <div key={p.id} style={S.procCard}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              {p.code && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#00e5a0', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{p.code}</span>}
              <span style={{ fontSize: 14, color: '#e8e8e4', fontWeight: 500 }}>{p.title}</span>
            </div>
            <div style={{ fontSize: 11, color: '#555' }}>
              {CATEGORIES.find(c => c.value === p.category)?.label || 'All tasks'}
              {' · '}{(p.charCount / 1000).toFixed(1)}k chars
              {' · '}Added {new Date(p.addedAt).toLocaleDateString('en-GB')}
            </div>
          </div>
          <button onClick={() => setProcedures(prev => prev.filter(x => x.id !== p.id))} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: '4px 8px', borderRadius: 6, fontSize: 16, lineHeight: 1, flexShrink: 0 }} title="Remove">✕</button>
        </div>
      ))}

      {!adding ? (
        <button style={{ ...S.btnGhost, marginTop: 8 }} onClick={() => setAdding(true)}>+ Add Procedure</button>
      ) : (
        <div style={S.addForm}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20 }}>New Procedure</div>
          <div style={S.grid2}>
            <Field label="Document Title *">
              <input style={S.input} value={form.title} onChange={e => upForm('title', e.target.value)} placeholder="e.g. Working at Height Procedure" onFocus={focus} onBlur={blur} />
            </Field>
            <Field label="Document Code">
              <input style={S.input} value={form.code} onChange={e => upForm('code', e.target.value)} placeholder="e.g. SWP-WH-001" onFocus={focus} onBlur={blur} />
            </Field>
          </div>
          <Field label="Applies To">
            <select style={S.select} value={form.category} onChange={e => upForm('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {['upload', 'paste'].map(mode => (
              <button key={mode} style={{ ...S.btnGhost, fontSize: 12, padding: '7px 14px', ...(inputMode === mode ? { borderColor: '#00e5a0', color: '#00e5a0' } : {}) }} onClick={() => setInputMode(mode)}>
                {mode === 'upload' ? 'Upload file' : 'Paste text'}
              </button>
            ))}
          </div>

          {inputMode === 'upload' ? (
            <>
              <div style={{ ...S.uploadZone, ...(extracting ? { borderColor: '#00e5a0' } : form.text ? { borderColor: '#2a2d35' } : {}) }} onClick={() => !extracting && fileRef.current?.click()}>
                {extracting
                  ? <span style={{ fontSize: 13, color: '#00e5a0' }}>Extracting text…</span>
                  : form.text
                  ? <span style={{ fontSize: 13, color: '#00e5a0' }}>✓ {(form.text.length / 1000).toFixed(1)}k chars extracted — click to replace</span>
                  : <span style={{ fontSize: 13, color: '#555' }}>Click to upload .txt, .pdf, or .docx</span>
                }
                <input ref={fileRef} type="file" accept=".txt,.md,.pdf,.docx" onChange={handleFile} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
              </div>
              {extractErr && <div style={S.errBox}>{extractErr}</div>}
            </>
          ) : (
            <Field label="Procedure Text *" help={`${form.text.length.toLocaleString()} / 50,000 chars`}>
              <textarea style={{ ...S.textarea, minHeight: 160 }} value={form.text} onChange={e => upForm('text', e.target.value.slice(0, 50000))} placeholder="Paste your procedure text here…" onFocus={focus} onBlur={blur} />
            </Field>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button style={{ ...S.btnPrimary, opacity: (!form.title.trim() || !form.text.trim()) ? 0.4 : 1 }} onClick={addProc} disabled={!form.title.trim() || !form.text.trim()}>
              Add to Library
            </button>
            <button style={S.btnGhost} onClick={cancel}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsModal({ onClose }) {
  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useLocalStorage('sf_company_profile', DEFAULT_PROFILE);
  const [procedures, setProcedures] = useLocalStorage('sf_procedures', []);

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        <div style={S.header}>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#e8e8e4', letterSpacing: '-0.01em' }}>Company Settings</div>
            {profile.companyName && <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{profile.companyName}</div>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: 4 }}>×</button>
        </div>

        <div style={S.tabs}>
          {[
            { key: 'profile', label: 'Company Profile' },
            { key: 'procedures', label: `Procedure Library${procedures.length ? ` (${procedures.length})` : ''}` },
          ].map(t => (
            <button key={t.key} style={S.tab(tab === t.key)} onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </div>

        <div style={S.body}>
          {tab === 'profile'
            ? <ProfileTab profile={profile} setProfile={setProfile} />
            : <ProcedureLibraryTab procedures={procedures} setProcedures={setProcedures} />
          }
        </div>
      </div>
    </div>
  );
}
