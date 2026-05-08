'use client';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DEFAULT_PROFILE } from '../lib/companyProfile';
import { extractTextFromFile } from '../lib/procedureLibrary';
import { downloadSampleTemplate } from '../lib/sampleTemplate';
import { callOpenAIChat, parseJsonResponse } from '../lib/openaiClient';

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
  overlay:  { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: '24px 16px 64px' },
  modal:    { width: '100%', maxWidth: 760, background: '#0f1117', border: '1px solid #1e2128', borderRadius: 16, display: 'flex', flexDirection: 'column' },
  header:   { padding: '20px 28px', borderBottom: '1px solid #1e2128', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#0f1117', borderRadius: '16px 16px 0 0', zIndex: 1 },
  tabBar:   { display: 'flex', borderBottom: '1px solid #1e2128', padding: '0 28px', background: '#0f1117', position: 'sticky', top: 61, zIndex: 1 },
  tab:      (a) => ({ background: 'none', border: 'none', borderBottom: a ? '2px solid #00e5a0' : '2px solid transparent', color: a ? '#00e5a0' : '#555', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '12px 14px 10px', transition: 'all 0.15s', marginBottom: -1 }),
  body:     { padding: '28px' },
  sec:      { marginBottom: 28 },
  secTitle: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
  secLine:  { flex: 1, height: 1, background: '#1e2128' },
  grid2:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' },
  field:    { marginBottom: 16 },
  label:    { display: 'block', fontSize: 12, color: '#888', fontWeight: 500, marginBottom: 6 },
  help:     { fontSize: 11, color: '#555', marginTop: 4, lineHeight: 1.5 },
  input:    { width: '100%', background: '#13151c', border: '1.5px solid #1e2128', borderRadius: 8, color: '#e8e8e4', fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '10px 12px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' },
  textarea: { width: '100%', background: '#13151c', border: '1.5px solid #1e2128', borderRadius: 8, color: '#e8e8e4', fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '10px 12px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6, transition: 'border-color 0.2s' },
  select:   { width: '100%', background: '#13151c', border: '1.5px solid #1e2128', borderRadius: 8, color: '#e8e8e4', fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '10px 12px', outline: 'none', appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23555' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 32 },
  btnGreen: { background: '#00e5a0', color: '#0f1117', border: 'none', borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, padding: '10px 20px', cursor: 'pointer' },
  btnGhost: { background: 'transparent', border: '1.5px solid #2a2d35', color: '#888', borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '9px 16px', cursor: 'pointer', transition: 'all 0.15s' },
  card:     { background: '#13151c', border: '1px solid #1e2128', borderRadius: 10, padding: '14px 18px', marginBottom: 10 },
  errBox:   { background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', color: '#ef4444', fontSize: 12, marginTop: 8 },
  uploadZone: { border: '1.5px dashed #2a2d35', borderRadius: 8, padding: 20, textAlign: 'center', cursor: 'pointer', position: 'relative', transition: 'all 0.2s' },
};

const focus = e => { e.target.style.borderColor = '#00e5a0'; };
const blur  = e => { e.target.style.borderColor = '#1e2128'; };

function Sec({ title, children }) {
  return (
    <div style={S.sec}>
      <div style={S.secTitle}>{title}<div style={S.secLine} /></div>
      {children}
    </div>
  );
}
function F({ label, help, children }) {
  return <div style={S.field}><label style={S.label}>{label}</label>{children}{help && <div style={S.help}>{help}</div>}</div>;
}
function PersonnelRow({ label, nv, pv, onN, onP }) {
  return (
    <div style={S.grid2}>
      <F label={`${label} — Name`}><input style={S.input} value={nv} onChange={e => onN(e.target.value)} placeholder={`${label} full name`} onFocus={focus} onBlur={blur} /></F>
      <F label={`${label} — Phone`}><input style={S.input} value={pv} onChange={e => onP(e.target.value)} placeholder="07xxx xxxxxx" onFocus={focus} onBlur={blur} /></F>
    </div>
  );
}

// ── Profile Tab ──────────────────────────────────────────────
function ProfileTab({ profile, setProfile, userId, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const up = (k, v) => setProfile(p => ({ ...p, [k]: v }));
  const inp = (k, ph) => ({ style: S.input, value: profile[k] || '', onChange: e => up(k, e.target.value), placeholder: ph, onFocus: focus, onBlur: blur });
  const ta  = (k, ph, minH = 80) => ({ style: { ...S.textarea, minHeight: minH }, value: profile[k] || '', onChange: e => up(k, e.target.value), placeholder: ph, onFocus: focus, onBlur: blur });

  const save = async () => {
    setSaving(true);
    await supabase.from('company_profiles').upsert({ user_id: userId, data: profile, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    setSaving(false);
    setSaved(true);
    onSaved(profile);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div style={{ background: 'rgba(0,229,160,0.05)', border: '1px solid rgba(0,229,160,0.15)', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#888', lineHeight: 1.6 }}>
        Saved to your Supabase account. Injected into every RAMS you generate so output uses your real company details and procedures.
      </div>

      <Sec title="Company Details">
        <div style={S.grid2}>
          <F label="Company Name"><input {...inp('companyName', 'e.g. Acme Construction Ltd')} /></F>
          <F label="Company Address"><input {...inp('companyAddress', 'e.g. 12 Business Park, Birmingham B1 1AA')} /></F>
        </div>
      </Sec>

      <Sec title="Site Personnel">
        <PersonnelRow label="Site Manager" nv={profile.siteManagerName || ''} pv={profile.siteManagerPhone || ''} onN={v => up('siteManagerName', v)} onP={v => up('siteManagerPhone', v)} />
        <PersonnelRow label="Supervisor"   nv={profile.supervisorName   || ''} pv={profile.supervisorPhone   || ''} onN={v => up('supervisorName', v)}   onP={v => up('supervisorPhone', v)} />
        <PersonnelRow label="First Aider"  nv={profile.firstAiderName   || ''} pv={profile.firstAiderPhone   || ''} onN={v => up('firstAiderName', v)}    onP={v => up('firstAiderPhone', v)} />
      </Sec>

      <Sec title="Emergency Details">
        <div style={S.grid2}>
          <F label="Emergency Assembly Point"><input {...inp('emergencyAssemblyPoint', 'e.g. Car park, north entrance')} /></F>
          <F label="Nearest A&E Hospital"><input {...inp('nearestHospital', 'e.g. Birmingham City Hospital, Dudley Rd')} /></F>
        </div>
      </Sec>

      <Sec title="Management System">
        <F label="Risk Matrix Definition" help="Leave blank to use default 5×5. Describe your company matrix if different.">
          <textarea {...ta('riskMatrixDefinition', 'e.g. We use a 3×3: L=1-3, M=4-6, H=7-9. Likelihood: 1=Rare 2=Possible 3=Likely. Severity: 1=Minor 2=Moderate 3=Severe.', 70)} />
        </F>
        <F label="Mandatory Controls" help="Must appear in every RAMS regardless of task.">
          <textarea {...ta('mandatoryControls', 'e.g. All operatives must complete site induction INF-001 before commencing works...', 90)} />
        </F>
        <F label="Permit to Work Triggers">
          <textarea {...ta('ptwTriggers', 'e.g.\nHot works → PTW-HW-02\nConfined space → PTW-CS-01\nElectrical isolation → PTW-EL-03', 90)} />
        </F>
        <F label="Document Reference Format" help="e.g. RA-{SITE}-{YYYY}-{NNN}">
          <input {...inp('docRefFormat', 'e.g. RA-{SITE}-{YYYY}-{NNN}')} />
        </F>
        <F label="Additional Management System Guidance">
          <textarea {...ta('additionalGuidance', 'Any other company-specific requirements, standard clauses, or approved methods...', 90)} />
        </F>
      </Sec>

      <button style={{ ...S.btnGreen, opacity: saving ? 0.6 : 1 }} onClick={save} disabled={saving}>
        {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Profile'}
      </button>
    </div>
  );
}

// ── Procedure Library Tab ────────────────────────────────────
function ProceduresTab({ procedures, setProcedures, userId }) {
  const [adding, setAdding]       = useState(false);
  const [form, setForm]           = useState({ title: '', code: '', category: '', text: '' });
  const [extracting, setExtracting] = useState(false);
  const [extractErr, setExtractErr] = useState('');
  const [inputMode, setInputMode] = useState('upload');
  const [saving, setSaving]       = useState(false);
  const fileRef = useRef();

  const upF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['txt', 'pdf', 'docx'].includes(ext)) {
      setExtractErr('Only .txt, .pdf, or .docx files are supported.');
      e.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setExtractErr('File must be under 10 MB.');
      e.target.value = '';
      return;
    }
    setExtracting(true);
    setExtractErr('');
    try {
      const text = await extractTextFromFile(file);
      setForm(p => ({ ...p, text: text.slice(0, 50000), title: p.title || file.name.replace(/\.[^.]+$/, '') }));
    } catch (err) { setExtractErr(err.message); }
    finally { setExtracting(false); e.target.value = ''; }
  };

  const addProc = async () => {
    if (!form.title.trim() || !form.text.trim()) return;
    if (procedures.length >= 50) {
      setExtractErr('Maximum 50 procedures allowed. Remove one before adding another.');
      return;
    }
    setSaving(true);
    const row = { user_id: userId, title: form.title, code: form.code, category: form.category, text: form.text, char_count: form.text.length, file_name: form.title };
    const { data, error } = await supabase.from('procedures').insert(row).select().single();
    if (!error && data) setProcedures(prev => [...prev, data]);
    setSaving(false);
    setForm({ title: '', code: '', category: '', text: '' });
    setAdding(false);
    setExtractErr('');
  };

  const del = async (id) => {
    await supabase.from('procedures').delete().eq('id', id);
    setProcedures(prev => prev.filter(p => p.id !== id));
  };

  const cancel = () => { setAdding(false); setForm({ title: '', code: '', category: '', text: '' }); setExtractErr(''); };

  return (
    <div>
      <p style={{ fontSize: 13, color: '#888', lineHeight: 1.6, marginBottom: 20 }}>
        Upload your company procedures. Relevant ones are matched to task type and injected into the AI prompt — output will comply with and reference them by document code.
      </p>

      {procedures.length === 0 && !adding && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#555', fontSize: 13, border: '1px dashed #1e2128', borderRadius: 10, marginBottom: 16 }}>
          No procedures added yet.
        </div>
      )}

      {procedures.map(p => (
        <div key={p.id} style={{ ...S.card, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              {p.code && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#00e5a0', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{p.code}</span>}
              <span style={{ fontSize: 14, color: '#e8e8e4', fontWeight: 500 }}>{p.title}</span>
            </div>
            <div style={{ fontSize: 11, color: '#555' }}>
              {CATEGORIES.find(c => c.value === p.category)?.label || 'All tasks'} · {((p.char_count || p.text?.length || 0) / 1000).toFixed(1)}k chars · Added {new Date(p.created_at).toLocaleDateString('en-GB')}
            </div>
          </div>
          <button onClick={() => del(p.id)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: '4px 8px', fontSize: 16, lineHeight: 1, flexShrink: 0 }}>✕</button>
        </div>
      ))}

      {!adding ? (
        <button style={{ ...S.btnGhost, marginTop: 8 }} onClick={() => setAdding(true)}>+ Add Procedure</button>
      ) : (
        <div style={{ background: '#13151c', border: '1px solid #2a2d35', borderRadius: 12, padding: 24, marginTop: 16 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20 }}>New Procedure</div>
          <div style={S.grid2}>
            <F label="Document Title *"><input style={S.input} value={form.title} onChange={e => upF('title', e.target.value)} placeholder="e.g. Working at Height Procedure" onFocus={focus} onBlur={blur} /></F>
            <F label="Document Code"><input style={S.input} value={form.code} onChange={e => upF('code', e.target.value)} placeholder="e.g. SWP-WH-001" onFocus={focus} onBlur={blur} /></F>
          </div>
          <F label="Applies To">
            <select style={S.select} value={form.category} onChange={e => upF('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </F>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {['upload', 'paste'].map(m => (
              <button key={m} style={{ ...S.btnGhost, fontSize: 12, padding: '7px 14px', ...(inputMode === m ? { borderColor: '#00e5a0', color: '#00e5a0' } : {}) }} onClick={() => setInputMode(m)}>
                {m === 'upload' ? 'Upload file' : 'Paste text'}
              </button>
            ))}
          </div>
          {inputMode === 'upload' ? (
            <>
              <div style={{ ...S.uploadZone, ...(extracting ? { borderColor: '#00e5a0' } : {}) }} onClick={() => !extracting && fileRef.current?.click()}>
                {extracting ? <span style={{ fontSize: 13, color: '#00e5a0' }}>Extracting text…</span>
                  : form.text ? <span style={{ fontSize: 13, color: '#00e5a0' }}>✓ {(form.text.length / 1000).toFixed(1)}k chars extracted — click to replace</span>
                  : <span style={{ fontSize: 13, color: '#555' }}>Click to upload .txt, .pdf, or .docx</span>}
                <input ref={fileRef} type="file" accept=".txt,.md,.pdf,.docx" onChange={handleFile} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
              </div>
              {extractErr && <div style={S.errBox}>{extractErr}</div>}
            </>
          ) : (
            <F label="Procedure Text *" help={`${form.text.length.toLocaleString()} / 50,000 chars`}>
              <textarea style={{ ...S.textarea, minHeight: 140 }} value={form.text} onChange={e => upF('text', e.target.value.slice(0, 50000))} placeholder="Paste procedure text here…" onFocus={focus} onBlur={blur} />
            </F>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button style={{ ...S.btnGreen, opacity: (!form.title.trim() || !form.text.trim() || saving) ? 0.4 : 1 }} onClick={addProc} disabled={!form.title.trim() || !form.text.trim() || saving}>
              {saving ? 'Saving…' : 'Add to Library'}
            </button>
            <button style={S.btnGhost} onClick={cancel}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Template Tab ─────────────────────────────────────────────
const PLACEHOLDER_FIELDS = `{task_type} - Type of task/works
{ref_number} - Document reference number
{date} - Issue date
{location} - Site location
{company_name} - Company/contractor name
{company_address} - Company address
{site_manager_name} - Site manager name
{site_manager_phone} - Site manager phone
{supervisor_name} - Supervisor name
{supervisor_phone} - Supervisor phone
{first_aider_name} - First aider name
{first_aider_phone} - First aider phone
{review_date} - Document review date
{scope_of_works} - Scope of works paragraph
{site_observations} - Site observations paragraph
{method_statement} - Method statement steps
{welfare_arrangements} - Welfare arrangements
{environmental_controls} - Environmental controls
{coshh_assessment} - COSHH assessment
{refuelling_procedure} - Refuelling procedure
{emergency_arrangements} - Emergency arrangements
{competencies} - Competencies required
{#hazards}{hazard} | {those_at_risk} | {initial_risk} ({initial_l}x{initial_s}={initial_score}) | {controls} | {residual_risk} ({residual_l}x{residual_s}={residual_score}){/hazards} - Hazard table row loop
{#ppe}{item}{/ppe} - PPE list loop
{#training_requirements}{item}{/training_requirements} - Training list loop`;

async function analyzeAndTagTemplate(arrayBuffer) {
  const mammoth = await import('mammoth');
  const { value: text } = await mammoth.extractRawText({ arrayBuffer });
  const excerpt = text.slice(0, 6000);

  const prompt = `You are analyzing a Word document template to identify where RAMS data fields should be inserted.

Here is the extracted text from the template:
${excerpt}

Available placeholder tags:
${PLACEHOLDER_FIELDS}

Identify text in the template that should be replaced with placeholder tags. Look for:
- Labels like "Task:", "Project:", "Date:", "Location:" followed by blank content → replace the blank value with the placeholder
- Blank table cells next to labels that match RAMS field names
- Section headings (Scope, Method Statement, Hazards, PPE, etc.) followed by empty paragraphs or placeholder text like "Insert here"
- Any existing placeholders already in the correct format (leave them unchanged)

Return ONLY a JSON array of replacement rules (no markdown):
[
  { "find": "exact text from the template to search for", "replace": "replacement including placeholder tag" }
]

Rules:
- "find" must be exact text that appears verbatim in the template
- Only return confident matches — skip anything ambiguous
- For blank cells, find a unique nearby label instead and return the label + placeholder together
- Limit to 20 replacements maximum`;

  const data = await callOpenAIChat({ model: 'gpt-4o', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] });
  const raw = data.choices?.[0]?.message?.content || '[]';
  return parseJsonResponse(raw, 'Could not analyse template. Please try again.');
}

function applyReplacementsToXml(xml, replacements) {
  let result = xml;
  let applied = 0;
  for (const { find, replace } of replacements) {
    const encoded = find
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    if (result.includes(encoded)) {
      result = result.split(encoded).join(replace);
      applied++;
    } else if (result.includes(find)) {
      result = result.split(find).join(replace);
      applied++;
    }
  }
  return { xml: result, applied };
}

function TemplateTab({ userId, activeTemplate, setActiveTemplate }) {
  const [phase, setPhase]         = useState('idle'); // idle | uploading | analysing | done
  const [sampDl, setSampDl]       = useState(false);
  const [err, setErr]             = useState('');
  const [tagCount, setTagCount]   = useState(0);
  const fileRef = useRef();

  const upload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.docx')) { setErr('Only .docx files are supported.'); return; }
    if (file.size > 10 * 1024 * 1024) { setErr('Template file must be under 10 MB.'); return; }
    setErr('');
    setTagCount(0);

    const arrayBuffer = await file.arrayBuffer();

    if (activeTemplate?.storage_path) {
      await supabase.storage.from('templates').remove([activeTemplate.storage_path]);
      await supabase.from('templates').delete().eq('user_id', userId);
      setActiveTemplate(null);
    }

    let processedBuffer = arrayBuffer;
    let detected = 0;

    setPhase('analysing');
    try {
      const replacements = await analyzeAndTagTemplate(arrayBuffer);
        if (replacements.length > 0) {
          const PizZip = (await import('pizzip')).default;
          const zip = new PizZip(arrayBuffer);
          const xmlFile = zip.file('word/document.xml');
          if (xmlFile) {
            const { xml: tagged, applied } = applyReplacementsToXml(xmlFile.asText(), replacements);
            zip.file('word/document.xml', tagged);
            processedBuffer = zip.generate({ type: 'arraybuffer' });
            detected = applied;
          }
        }
      } catch {
        // Non-fatal — upload the original if analysis fails
      }

    setPhase('uploading');
    const path = `${userId}/${Date.now()}-${file.name}`;
    const blob = new Blob([processedBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const { error: uploadErr } = await supabase.storage.from('templates').upload(path, blob);
    if (uploadErr) { setErr(uploadErr.message); setPhase('idle'); return; }

    const { data, error: dbErr } = await supabase.from('templates').insert({
      user_id: userId, name: file.name, file_name: file.name, storage_path: path, is_active: true, tagged_fields: detected,
    }).select().single();

    if (dbErr) { setErr(dbErr.message); setPhase('idle'); return; }
    setActiveTemplate(data);
    setTagCount(detected);
    setPhase('done');
    e.target.value = '';
  };

  const remove = async () => {
    if (!activeTemplate) return;
    await supabase.storage.from('templates').remove([activeTemplate.storage_path]);
    await supabase.from('templates').delete().eq('id', activeTemplate.id);
    setActiveTemplate(null);
    setPhase('idle');
    setTagCount(0);
  };

  const sample = async () => {
    setSampDl(true);
    try { await downloadSampleTemplate(); } catch (e) { setErr(e.message); }
    setSampDl(false);
  };

  const isProcessing = phase === 'uploading' || phase === 'analysing';
  const phaseLabel = phase === 'analysing' ? 'AI analysing template…' : 'Uploading…';

  return (
    <div>
      <p style={{ fontSize: 13, color: '#888', lineHeight: 1.6, marginBottom: 20 }}>
        Upload any branded <strong style={{ color: '#c0c0b8' }}>.docx</strong> template — AI automatically detects where RAMS fields should go and injects the placeholder tags. No manual editing required.
      </p>

      {/* AI feature callout */}
      <div style={{ background: 'rgba(0,229,160,0.04)', border: '1px solid rgba(0,229,160,0.12)', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#00e5a0', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 1, flexShrink: 0 }}>AI tagging</div>
          <p style={{ fontSize: 13, color: '#888', lineHeight: 1.5, margin: 0 }}>
            When you upload, AI reads your template, identifies where each RAMS section belongs, and inserts <code style={{ background: '#1e2128', padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>{'{placeholders}'}</code> automatically. Or use the sample template below as a starting point.
          </p>
        </div>
      </div>

      {/* Download sample */}
      <div style={{ ...S.card, marginBottom: 20 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Start from the sample template</div>
        <p style={{ fontSize: 13, color: '#888', lineHeight: 1.5, marginBottom: 12 }}>
          Pre-tagged with all fields. Open in Word, add your logo and branding — placeholders are already in place.
        </p>
        <button style={{ ...S.btnGhost, fontSize: 12 }} onClick={sample} disabled={sampDl}>
          {sampDl ? 'Generating…' : '↓ Download Sample Template (.docx)'}
        </button>
      </div>

      {/* Active template */}
      {activeTemplate ? (
        <div style={{ ...S.card, marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#00e5a0', background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.2)', padding: '2px 7px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active</span>
                <span style={{ fontSize: 14, color: '#e8e8e4', fontWeight: 500 }}>{activeTemplate.name}</span>
              </div>
              <div style={{ fontSize: 11, color: '#555' }}>
                Uploaded {new Date(activeTemplate.created_at).toLocaleDateString('en-GB')}
                {(activeTemplate.tagged_fields || tagCount) > 0 && (
                  <span style={{ marginLeft: 10, color: '#00e5a0' }}>· AI tagged {activeTemplate.tagged_fields || tagCount} field{(activeTemplate.tagged_fields || tagCount) !== 1 ? 's' : ''}</span>
                )}
              </div>
              {phase === 'done' && tagCount === 0 && (
                <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 6 }}>
                  No fields auto-detected. If the Word doc exports blank, try the sample template instead.
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              <button style={{ ...S.btnGhost, fontSize: 12 }} onClick={() => !isProcessing && fileRef.current?.click()} disabled={isProcessing}>Replace</button>
              <button style={{ ...S.btnGhost, fontSize: 12, borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }} onClick={remove}>Remove</button>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{ ...S.uploadZone, ...(isProcessing ? { borderColor: '#00e5a0' } : {}) }}
          onClick={() => !isProcessing && fileRef.current?.click()}
        >
          {isProcessing ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 20, height: 20, border: '2px solid #1e2128', borderTopColor: '#00e5a0', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: 13, color: '#00e5a0' }}>{phaseLabel}</span>
              {phase === 'analysing' && <span style={{ fontSize: 11, color: '#555' }}>Identifying field locations…</span>}
            </div>
          ) : (
            <>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
              <div style={{ fontSize: 13, color: '#c0c0b8', marginBottom: 4 }}>Upload your branded .docx template</div>
              <div style={{ fontSize: 12, color: '#555' }}>AI will auto-tag it · .docx files only</div>
            </>
          )}
        </div>
      )}

      <input ref={fileRef} type="file" accept=".docx" onChange={upload} style={{ display: 'none' }} />
      {err && <div style={S.errBox}>{err}</div>}
    </div>
  );
}

// ── Main Modal ───────────────────────────────────────────────
export default function SettingsModal({ onClose, user, profile, setProfile, procedures, setProcedures, activeTemplate, setActiveTemplate }) {
  const [tab, setTab] = useState('profile');

  const tabs = [
    { key: 'profile',    label: 'Company Profile' },
    { key: 'procedures', label: `Procedure Library${procedures.length ? ` (${procedures.length})` : ''}` },
    { key: 'template',   label: `RAMS Template${activeTemplate ? ' ✓' : ''}` },
  ];

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

        <div style={S.tabBar}>
          {tabs.map(t => <button key={t.key} style={S.tab(tab === t.key)} onClick={() => setTab(t.key)}>{t.label}</button>)}
        </div>

        <div style={S.body}>
          {tab === 'profile'    && <ProfileTab    profile={profile} setProfile={setProfile} userId={user.id} onSaved={setProfile} />}
          {tab === 'procedures' && <ProceduresTab procedures={procedures} setProcedures={setProcedures} userId={user.id} />}
          {tab === 'template'   && <TemplateTab   userId={user.id} activeTemplate={activeTemplate} setActiveTemplate={setActiveTemplate} />}
        </div>
      </div>
    </div>
  );
}
