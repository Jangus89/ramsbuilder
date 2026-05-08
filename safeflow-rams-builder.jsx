import { useState, useRef, useCallback } from "react";

const TASK_TYPES = [
  "Excavation / Groundworks",
  "Working at Height",
  "Overhead Line Proximity",
  "Underground Services",
  "Confined Space Entry",
  "Manual Handling",
  "Demolition / Strip Out",
  "Electrical Isolation",
  "Hot Works / Welding",
  "Asbestos Removal",
  "Roof Work",
  "Tree Work / Vegetation",
  "Crane / Lifting Operations",
  "Road / Highway Works",
  "Other (describe below)",
];

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #0f1117;
    color: #e8e8e4;
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
  }

  .app {
    max-width: 900px;
    margin: 0 auto;
    padding: 48px 24px 80px;
  }

  .header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 56px;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .logo-mark {
    width: 36px;
    height: 36px;
    background: #00e5a0;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .logo-mark svg {
    width: 20px;
    height: 20px;
    fill: #0f1117;
  }

  .logo-text {
    font-family: 'DM Mono', monospace;
    font-size: 18px;
    font-weight: 500;
    color: #e8e8e4;
    letter-spacing: -0.02em;
  }

  .logo-sub {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: #555;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-top: 2px;
  }

  .badge {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: #00e5a0;
    background: rgba(0,229,160,0.08);
    border: 1px solid rgba(0,229,160,0.2);
    padding: 4px 10px;
    border-radius: 4px;
    letter-spacing: 0.06em;
  }

  .hero {
    margin-bottom: 48px;
  }

  .hero h1 {
    font-family: 'Instrument Serif', serif;
    font-size: clamp(36px, 5vw, 52px);
    font-weight: 400;
    line-height: 1.1;
    color: #e8e8e4;
    margin-bottom: 16px;
  }

  .hero h1 em {
    font-style: italic;
    color: #00e5a0;
  }

  .hero p {
    font-size: 16px;
    color: #888;
    line-height: 1.6;
    max-width: 520px;
    font-weight: 300;
  }

  .divider {
    height: 1px;
    background: linear-gradient(90deg, #1e2128 0%, #2a2d35 50%, #1e2128 100%);
    margin: 40px 0;
  }

  .section-label {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: #555;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 16px;
  }

  /* Photo Upload */
  .upload-zone {
    border: 1.5px dashed #2a2d35;
    border-radius: 12px;
    padding: 40px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: #13151c;
    position: relative;
  }

  .upload-zone:hover, .upload-zone.drag-over {
    border-color: #00e5a0;
    background: rgba(0,229,160,0.03);
  }

  .upload-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 16px;
    background: #1e2128;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .upload-icon svg { width: 22px; height: 22px; stroke: #555; }

  .upload-zone h3 {
    font-size: 15px;
    font-weight: 500;
    color: #c0c0b8;
    margin-bottom: 6px;
  }

  .upload-zone p {
    font-size: 13px;
    color: #555;
  }

  .upload-zone input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
    width: 100%;
    height: 100%;
  }

  .photos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;
    margin-top: 16px;
  }

  .photo-thumb {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    aspect-ratio: 4/3;
    background: #1e2128;
  }

  .photo-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .photo-remove {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 24px;
    height: 24px;
    background: rgba(15,17,23,0.85);
    border: none;
    border-radius: 50%;
    color: #888;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    transition: all 0.15s;
  }

  .photo-remove:hover { background: #ff4444; color: white; }

  /* Form fields */
  .field { margin-bottom: 24px; }

  .field label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #888;
    margin-bottom: 8px;
  }

  .field select, .field input, .field textarea {
    width: 100%;
    background: #13151c;
    border: 1.5px solid #1e2128;
    border-radius: 8px;
    color: #e8e8e4;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    padding: 12px 14px;
    transition: border-color 0.2s;
    outline: none;
    appearance: none;
  }

  .field select:focus, .field input:focus, .field textarea:focus {
    border-color: #00e5a0;
  }

  .field textarea { resize: vertical; min-height: 80px; }

  .field select {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23555' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    padding-right: 36px;
  }

  /* Generate button */
  .generate-btn {
    width: 100%;
    background: #00e5a0;
    color: #0f1117;
    border: none;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 600;
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    letter-spacing: -0.01em;
  }

  .generate-btn:hover:not(:disabled) {
    background: #00f2aa;
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(0,229,160,0.25);
  }

  .generate-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }

  /* Loading */
  .loading {
    text-align: center;
    padding: 60px 20px;
  }

  .loading-ring {
    width: 48px;
    height: 48px;
    border: 2px solid #1e2128;
    border-top-color: #00e5a0;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 20px;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .loading p {
    font-size: 14px;
    color: #555;
  }

  .loading-steps {
    margin-top: 12px;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    color: #333;
  }

  .loading-step { margin-top: 6px; transition: color 0.3s; }
  .loading-step.active { color: #00e5a0; }

  /* RAMS Output */
  .rams-output {
    animation: fadeUp 0.4s ease;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .rams-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    flex-wrap: gap;
    gap: 12px;
  }

  .rams-title {
    font-family: 'Instrument Serif', serif;
    font-size: 28px;
    color: #e8e8e4;
  }

  .export-buttons {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .export-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 9px 16px;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    border: 1.5px solid;
  }

  .export-btn.pdf {
    background: transparent;
    border-color: #2a2d35;
    color: #c0c0b8;
  }

  .export-btn.pdf:hover {
    border-color: #00e5a0;
    color: #00e5a0;
  }

  .export-btn.drive {
    background: transparent;
    border-color: #2a2d35;
    color: #c0c0b8;
  }

  .export-btn.drive:hover {
    border-color: #4285f4;
    color: #4285f4;
  }

  .export-btn.onedrive {
    background: transparent;
    border-color: #2a2d35;
    color: #c0c0b8;
  }

  .export-btn.onedrive:hover {
    border-color: #0078d4;
    color: #0078d4;
  }

  .rams-doc {
    background: #13151c;
    border: 1.5px solid #1e2128;
    border-radius: 12px;
    overflow: hidden;
  }

  .rams-doc-header {
    background: #1e2128;
    padding: 24px 28px;
    border-bottom: 1px solid #2a2d35;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 16px;
    align-items: start;
  }

  .rams-doc-title {
    font-family: 'Instrument Serif', serif;
    font-size: 22px;
    color: #e8e8e4;
    margin-bottom: 4px;
  }

  .rams-doc-meta {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: #555;
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  .rams-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: #f59e0b;
    background: rgba(245,158,11,0.08);
    border: 1px solid rgba(245,158,11,0.2);
    padding: 4px 10px;
    border-radius: 4px;
  }

  .rams-status::before {
    content: '';
    width: 6px;
    height: 6px;
    background: #f59e0b;
    border-radius: 50%;
  }

  .rams-body { padding: 28px; }

  .rams-section {
    margin-bottom: 28px;
    padding-bottom: 28px;
    border-bottom: 1px solid #1e2128;
  }

  .rams-section:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }

  .rams-section-title {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: #00e5a0;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .rams-section-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #1e2128;
  }

  .rams-text {
    font-size: 14px;
    color: #c0c0b8;
    line-height: 1.7;
    font-weight: 300;
  }

  .hazard-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .hazard-table th {
    text-align: left;
    padding: 8px 12px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: #555;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    border-bottom: 1px solid #1e2128;
  }

  .hazard-table td {
    padding: 10px 12px;
    color: #c0c0b8;
    border-bottom: 1px solid #1a1c22;
    vertical-align: top;
    line-height: 1.5;
  }

  .hazard-table tr:last-child td { border-bottom: none; }

  .risk-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 3px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.04em;
  }

  .risk-high { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }
  .risk-medium { background: rgba(245,158,11,0.1); color: #f59e0b; border: 1px solid rgba(245,158,11,0.2); }
  .risk-low { background: rgba(0,229,160,0.1); color: #00e5a0; border: 1px solid rgba(0,229,160,0.2); }

  .ppe-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .ppe-item {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #1e2128;
    border: 1px solid #2a2d35;
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 13px;
    color: #c0c0b8;
  }

  .ppe-item::before {
    content: '✓';
    color: #00e5a0;
    font-size: 11px;
    font-weight: 700;
  }

  .sign-off-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;
  }

  .sign-off-box {
    background: #1a1c22;
    border: 1px solid #2a2d35;
    border-radius: 8px;
    padding: 14px;
  }

  .sign-off-label {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: #555;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .sign-off-line {
    height: 1px;
    background: #2a2d35;
    margin-top: 28px;
  }

  .reset-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 24px;
    background: transparent;
    border: 1.5px solid #2a2d35;
    border-radius: 8px;
    color: #555;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    padding: 10px 16px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .reset-btn:hover { border-color: #555; color: #888; }

  .error-box {
    background: rgba(239,68,68,0.05);
    border: 1px solid rgba(239,68,68,0.2);
    border-radius: 8px;
    padding: 16px;
    color: #ef4444;
    font-size: 14px;
    margin-top: 16px;
  }

  @media (max-width: 600px) {
    .sign-off-grid { grid-template-columns: 1fr; }
    .rams-header { flex-direction: column; }
    .hazard-table { font-size: 12px; }
  }
`;

function PhotoUpload({ photos, onAdd, onRemove }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const handleFiles = useCallback((files) => {
    const remaining = 4 - photos.length;
    const toAdd = Array.from(files).slice(0, remaining);
    toAdd.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => onAdd({ file, url: e.target.result, name: file.name });
      reader.readAsDataURL(file);
    });
  }, [photos.length, onAdd]);

  return (
    <div>
      {photos.length < 4 && (
        <div
          className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current.click()}
        >
          <div className="upload-icon">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="m21 15-5-5L5 21"/>
            </svg>
          </div>
          <h3>Upload site photos</h3>
          <p>{photos.length === 0 ? 'Drag and drop or click to select — up to 4 photos' : `${4 - photos.length} more photo${4 - photos.length !== 1 ? 's' : ''} allowed`}</p>
          <input ref={inputRef} type="file" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files)} />
        </div>
      )}
      {photos.length > 0 && (
        <div className="photos-grid" style={{ marginTop: photos.length < 4 ? '16px' : '0' }}>
          {photos.map((p, i) => (
            <div key={i} className="photo-thumb">
              <img src={p.url} alt={p.name} />
              <button className="photo-remove" onClick={() => onRemove(i)}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingState({ step }) {
  const steps = [
    'Analysing site photos…',
    'Identifying hazards and risk factors…',
    'Mapping controls and mitigations…',
    'Compiling RAMS document…',
  ];
  return (
    <div className="loading">
      <div className="loading-ring" />
      <p>Generating your RAMS document</p>
      <div className="loading-steps">
        {steps.map((s, i) => (
          <div key={i} className={`loading-step ${i === step ? 'active' : ''}`}>
            {i < step ? '✓' : i === step ? '›' : '○'} {s}
          </div>
        ))}
      </div>
    </div>
  );
}

function RamsDocument({ data, onReset, onExportPDF, onExportDrive, onExportOneDrive }) {
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const refNum = `SF-${Date.now().toString().slice(-6)}`;

  return (
    <div className="rams-output">
      <div className="rams-header">
        <h2 className="rams-title">RAMS Generated</h2>
        <div className="export-buttons">
          <button className="export-btn pdf" onClick={onExportPDF}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            Download PDF
          </button>
          <button className="export-btn drive" onClick={onExportDrive}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            Google Drive
          </button>
          <button className="export-btn onedrive" onClick={onExportOneDrive}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
            </svg>
            OneDrive
          </button>
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
            </div>
          </div>
          <div className="rams-status">DRAFT — REVIEW REQUIRED</div>
        </div>

        <div className="rams-body">

          <div className="rams-section">
            <div className="rams-section-title">Scope of Works</div>
            <p className="rams-text">{data.scopeOfWorks}</p>
          </div>

          <div className="rams-section">
            <div className="rams-section-title">Site Observations</div>
            <p className="rams-text">{data.siteObservations}</p>
          </div>

          <div className="rams-section">
            <div className="rams-section-title">Hazard Register & Risk Assessment</div>
            <table className="hazard-table">
              <thead>
                <tr>
                  <th>Hazard</th>
                  <th>Those at Risk</th>
                  <th>Initial Risk</th>
                  <th>Control Measures</th>
                  <th>Residual Risk</th>
                </tr>
              </thead>
              <tbody>
                {data.hazards.map((h, i) => (
                  <tr key={i}>
                    <td>{h.hazard}</td>
                    <td>{h.thoseAtRisk}</td>
                    <td><span className={`risk-badge risk-${h.initialRisk.toLowerCase()}`}>{h.initialRisk}</span></td>
                    <td>{h.controls}</td>
                    <td><span className={`risk-badge risk-${h.residualRisk.toLowerCase()}`}>{h.residualRisk}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rams-section">
            <div className="rams-section-title">Method Statement</div>
            <p className="rams-text" style={{ whiteSpace: 'pre-line' }}>{data.methodStatement}</p>
          </div>

          <div className="rams-section">
            <div className="rams-section-title">Personal Protective Equipment</div>
            <div className="ppe-grid">
              {data.ppe.map((item, i) => (
                <div key={i} className="ppe-item">{item}</div>
              ))}
            </div>
          </div>

          <div className="rams-section">
            <div className="rams-section-title">Emergency Arrangements</div>
            <p className="rams-text" style={{ whiteSpace: 'pre-line' }}>{data.emergencyArrangements}</p>
          </div>

          <div className="rams-section">
            <div className="rams-section-title">Competencies Required</div>
            <p className="rams-text">{data.competencies}</p>
          </div>

          <div className="rams-section">
            <div className="rams-section-title">Sign-off</div>
            <div className="sign-off-grid">
              {['Prepared by', 'Reviewed by', 'Authorised by'].map((label) => (
                <div key={label} className="sign-off-box">
                  <div className="sign-off-label">{label}</div>
                  <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>Name:</div>
                  <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>Role:</div>
                  <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>Date:</div>
                  <div className="sign-off-line" />
                  <div style={{ fontSize: 11, color: '#333', marginTop: 6, fontFamily: 'DM Mono, monospace' }}>Signature</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      <button className="reset-btn" onClick={onReset}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        </svg>
        Start new RAMS
      </button>
    </div>
  );
}

export default function SafeFlowRAMS() {
  const [photos, setPhotos] = useState([]);
  const [taskType, setTaskType] = useState('');
  const [customTask, setCustomTask] = useState('');
  const [location, setLocation] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [ramsData, setRamsData] = useState(null);
  const [error, setError] = useState('');

  const addPhoto = useCallback((photo) => {
    setPhotos(prev => [...prev, photo]);
  }, []);

  const removePhoto = useCallback((index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  }, []);

  const buildPrompt = () => {
    const task = taskType === 'Other (describe below)' ? customTask : taskType;
    return `You are an expert HSQE Manager with 15+ years of experience producing Risk Assessment and Method Statements (RAMS) for UK field contractors. You must produce a comprehensive, compliant RAMS document based on the site photos provided and the task description below.

Task Type: ${task}
${location ? `Site Location: ${location}` : ''}
${additionalInfo ? `Additional Information: ${additionalInfo}` : ''}

Analyse the site photos carefully and identify all visible hazards, site conditions, environmental factors, and anything relevant to safe working.

Respond ONLY with a valid JSON object in exactly this structure, no preamble, no markdown:

{
  "taskType": "${task}",
  "location": "${location || 'As surveyed'}",
  "scopeOfWorks": "2-3 sentences describing the full scope of the works to be undertaken",
  "siteObservations": "3-5 sentences describing what was observed in the site photos — ground conditions, access, proximity hazards, environmental factors, existing infrastructure, overhead/underground services visible, any specific risk factors identified from the photos",
  "hazards": [
    {
      "hazard": "Hazard name",
      "thoseAtRisk": "Who is at risk",
      "initialRisk": "High|Medium|Low",
      "controls": "Specific control measures to reduce this risk",
      "residualRisk": "High|Medium|Low"
    }
  ],
  "methodStatement": "Step-by-step method statement as a numbered sequence. Each step on a new line starting with the step number. Minimum 8 steps covering: pre-task checks, site setup, task execution sequence, quality checks, and demobilisation.",
  "ppe": ["PPE item 1", "PPE item 2", "PPE item 3"],
  "emergencyArrangements": "Clear emergency arrangements covering: nearest A&E hospital, emergency services contact (999), site emergency contact, first aid provision, nearest first aider, emergency assembly point, procedure if worker is injured or incident occurs",
  "competencies": "Required certifications, qualifications, training, and experience for operatives undertaking this work under UK legislation and industry standards"
}

Produce at least 6 hazards. Be specific and technical — this is a legally significant document. Reference relevant UK regulations where appropriate (HASAWA 1974, MHSWR 1999, CDM 2015, RIDDOR, etc.). PPE list should include at minimum 6 items appropriate to the task.`;
  };

  // ⚠️ REPLACE WITH YOUR OPENAI API KEY — do not share this file publicly once added
  const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY_HERE';

  const generateRAMS = async () => {
    const task = taskType === 'Other (describe below)' ? customTask : taskType;
    if (!task || photos.length === 0) return;

    setLoading(true);
    setError('');
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep(prev => Math.min(prev + 1, 3));
    }, 1800);

    try {
      // Build OpenAI vision message content
      const imageContents = photos.map(p => ({
        type: 'image_url',
        image_url: {
          url: p.url, // base64 data URL — OpenAI accepts this directly
          detail: 'high'
        }
      }));

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          max_tokens: 4000,
          messages: [{
            role: 'user',
            content: [
              ...imageContents,
              { type: 'text', text: buildPrompt() }
            ]
          }]
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'OpenAI API error');
      }

      const text = data.choices?.[0]?.message?.content || '';

      let parsed;
      try {
        const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsed = JSON.parse(clean);
      } catch {
        throw new Error('Could not parse the generated RAMS. Please try again.');
      }

      clearInterval(stepInterval);
      setLoadingStep(3);
      await new Promise(r => setTimeout(r, 400));
      setRamsData(parsed);
    } catch (err) {
      clearInterval(stepInterval);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    const printContent = document.getElementById('rams-document');
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>RAMS Document</title>
      <style>
        body { font-family: Arial, sans-serif; color: #111; background: white; padding: 40px; max-width: 900px; margin: 0 auto; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        .meta { font-size: 12px; color: #666; margin-bottom: 24px; display: flex; gap: 20px; }
        .status { font-size: 11px; background: #fff3cd; border: 1px solid #ffc107; padding: 3px 10px; border-radius: 4px; display: inline-block; margin-bottom: 20px; }
        .section { margin-bottom: 24px; page-break-inside: avoid; }
        .section-title { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #0a7c4e; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
        p, td { font-size: 13px; line-height: 1.6; color: #333; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { text-align: left; padding: 7px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #666; border-bottom: 2px solid #e5e7eb; }
        td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
        .risk-high { background: #fee2e2; color: #dc2626; padding: 2px 7px; border-radius: 3px; font-size: 10px; font-weight: 600; }
        .risk-medium { background: #fef3c7; color: #d97706; padding: 2px 7px; border-radius: 3px; font-size: 10px; font-weight: 600; }
        .risk-low { background: #d1fae5; color: #059669; padding: 2px 7px; border-radius: 3px; font-size: 10px; font-weight: 600; }
        .ppe-grid { display: flex; flex-wrap: wrap; gap: 6px; }
        .ppe-item { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 5px; padding: 4px 10px; font-size: 12px; }
        .sign-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        .sign-box { border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; }
        .sign-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #9ca3af; margin-bottom: 6px; }
        .sign-line { border-top: 1px solid #e5e7eb; margin-top: 40px; }
        pre { white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 13px; line-height: 1.6; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <h1>${ramsData.taskType} — Risk Assessment & Method Statement</h1>
      <div class="meta">
        <span>Date: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
        <span>Location: ${ramsData.location}</span>
        <span>Ref: SF-${Date.now().toString().slice(-6)}</span>
      </div>
      <div class="status">⚠ DRAFT — REVIEW AND SIGN-OFF REQUIRED BEFORE USE</div>

      <div class="section">
        <div class="section-title">Scope of Works</div>
        <p>${ramsData.scopeOfWorks}</p>
      </div>

      <div class="section">
        <div class="section-title">Site Observations</div>
        <p>${ramsData.siteObservations}</p>
      </div>

      <div class="section">
        <div class="section-title">Hazard Register & Risk Assessment</div>
        <table>
          <thead><tr><th>Hazard</th><th>Those at Risk</th><th>Initial Risk</th><th>Controls</th><th>Residual Risk</th></tr></thead>
          <tbody>
            ${ramsData.hazards.map(h => `<tr>
              <td>${h.hazard}</td>
              <td>${h.thoseAtRisk}</td>
              <td><span class="risk-${h.initialRisk.toLowerCase()}">${h.initialRisk}</span></td>
              <td>${h.controls}</td>
              <td><span class="risk-${h.residualRisk.toLowerCase()}">${h.residualRisk}</span></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Method Statement</div>
        <pre>${ramsData.methodStatement}</pre>
      </div>

      <div class="section">
        <div class="section-title">Personal Protective Equipment</div>
        <div class="ppe-grid">
          ${ramsData.ppe.map(item => `<div class="ppe-item">✓ ${item}</div>`).join('')}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Emergency Arrangements</div>
        <pre>${ramsData.emergencyArrangements}</pre>
      </div>

      <div class="section">
        <div class="section-title">Competencies Required</div>
        <p>${ramsData.competencies}</p>
      </div>

      <div class="section">
        <div class="section-title">Sign-off</div>
        <div class="sign-grid">
          ${['Prepared by', 'Reviewed by', 'Authorised by'].map(label => `
            <div class="sign-box">
              <div class="sign-label">${label}</div>
              <div style="font-size:12px;color:#666;margin-bottom:3px">Name: _______________</div>
              <div style="font-size:12px;color:#666;margin-bottom:3px">Role: ________________</div>
              <div style="font-size:12px;color:#666;margin-bottom:3px">Date: ________________</div>
              <div class="sign-line"></div>
              <div style="font-size:10px;color:#ccc;margin-top:4px">Signature</div>
            </div>`).join('')}
        </div>
      </div>
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  const handleExportDrive = () => {
    alert('Google Drive integration requires OAuth setup. In the full product, this saves directly to your connected Drive folder in your own template.');
  };

  const handleExportOneDrive = () => {
    alert('OneDrive integration requires Microsoft OAuth setup. In the full product, this saves directly to your connected OneDrive folder in your own template.');
  };

  const canGenerate = photos.length > 0 && (taskType && taskType !== 'Other (describe below)' || customTask.trim());

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="header">
          <div className="logo">
            <div className="logo-mark">
              <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <div>
              <div className="logo-text">SafeFlow</div>
              <div className="logo-sub">RAMS Builder</div>
            </div>
          </div>
          <div className="badge">PROTOTYPE</div>
        </div>

        {!ramsData && !loading && (
          <>
            <div className="hero">
              <h1>Take photos.<br /><em>Get your RAMS.</em></h1>
              <p>Upload site photos and select your task type. SafeFlow analyses what it sees and generates a compliant Risk Assessment and Method Statement in under a minute.</p>
            </div>

            <div className="divider" />

            <div className="section-label">Step 1 — Site Photos</div>
            <PhotoUpload photos={photos} onAdd={addPhoto} onRemove={removePhoto} />

            <div style={{ marginTop: 32 }}>
              <div className="section-label">Step 2 — Task Details</div>

              <div className="field">
                <label>Task Type</label>
                <select value={taskType} onChange={e => setTaskType(e.target.value)}>
                  <option value="">Select task type…</option>
                  {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {taskType === 'Other (describe below)' && (
                <div className="field">
                  <label>Describe the task</label>
                  <input
                    type="text"
                    placeholder="e.g. Installation of temporary fencing along live carriageway"
                    value={customTask}
                    onChange={e => setCustomTask(e.target.value)}
                  />
                </div>
              )}

              <div className="field">
                <label>Site Location <span style={{ color: '#555', fontWeight: 400 }}>(optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. Unit 4, Industrial Estate, Birmingham B12 4AB"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Additional Information <span style={{ color: '#555', fontWeight: 400 }}>(optional)</span></label>
                <textarea
                  placeholder="Any additional context — client requirements, specific hazards you're aware of, number of operatives, duration of works…"
                  value={additionalInfo}
                  onChange={e => setAdditionalInfo(e.target.value)}
                />
              </div>
            </div>

            <button className="generate-btn" onClick={generateRAMS} disabled={!canGenerate}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              Generate RAMS Document
            </button>

            {error && <div className="error-box">⚠ {error}</div>}
          </>
        )}

        {loading && <LoadingState step={loadingStep} />}

        {ramsData && !loading && (
          <RamsDocument
            data={ramsData}
            onReset={() => { setRamsData(null); setPhotos([]); setTaskType(''); setCustomTask(''); setLocation(''); setAdditionalInfo(''); }}
            onExportPDF={handleExportPDF}
            onExportDrive={handleExportDrive}
            onExportOneDrive={handleExportOneDrive}
          />
        )}
      </div>
    </>
  );
}
