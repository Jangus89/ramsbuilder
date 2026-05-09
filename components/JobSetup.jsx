'use client';

import { useState, useRef, useCallback } from "react";
import { useVoiceInput } from '../lib/useVoiceInput';
import { analysePhoto } from '../lib/photoAnalysis';

export const TASK_TYPES = [
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

function PhotoUpload({ photos, onAdd, onRemove }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();
  const [fileError, setFileError] = useState('');
  const [analyses, setAnalyses] = useState(new Map());
  const [analysing, setAnalysing] = useState(new Set());
  const [hoveredPhoto, setHoveredPhoto] = useState(null);

  const handleFiles = useCallback((files) => {
    setFileError('');
    const remaining = 4 - photos.length;
    const toAdd = Array.from(files).slice(0, remaining);
    toAdd.forEach((file, offset) => {
      if (!file.type.startsWith('image/')) {
        setFileError('Only image files are allowed.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFileError('Each image must be under 5 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const photo = { file, url: e.target.result, name: file.name };
        onAdd(photo);
        const idx = photos.length + offset;
        setAnalysing(prev => new Set(prev).add(idx));
        analysePhoto(e.target.result).then(results => {
          setAnalysing(prev => { const next = new Set(prev); next.delete(idx); return next; });
          if (results.length > 0) {
            setAnalyses(prev => new Map(prev).set(idx, results));
          }
        });
      };
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
      {photos.length < 4 && (
        <label className="camera-btn">
          Take photo
          <input type="file" accept="image/*" capture="environment" onChange={(e) => handleFiles(e.target.files)} />
        </label>
      )}
      {fileError && <div className="error-box" style={{ marginTop: 12 }}>⚠ {fileError}</div>}
      {photos.length > 0 && (
        <div className="photos-grid" style={{ marginTop: photos.length < 4 ? '16px' : '0' }}>
          {photos.map((p, i) => (
            <div
              key={i}
              className="photo-thumb"
              onMouseEnter={() => setHoveredPhoto(i)}
              onMouseLeave={() => setHoveredPhoto(null)}
              style={{ position: 'relative' }}
            >
              <img src={p.url} alt={p.name} />
              <button className="photo-remove" onClick={() => onRemove(i)}>×</button>
              {analysing.has(i) && (
                <div style={{ position: 'absolute', bottom: 8, left: 8, width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              )}
              {!analysing.has(i) && analyses.has(i) && (
                <div style={{ position: 'absolute', bottom: 8, left: 8, width: 20, height: 20, background: 'rgba(0,229,160,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#0f1117', fontWeight: 700 }}>i</div>
              )}
              {hoveredPhoto === i && analyses.has(i) && (
                <div style={{
                  position: 'absolute', bottom: '100%', left: 0, marginBottom: 8, zIndex: 10,
                  background: '#13151c', border: '1px solid #2a2d35', borderRadius: 8, padding: 12,
                  fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#c0c0b8', lineHeight: 1.6,
                  minWidth: 240, maxWidth: 320, pointerEvents: 'none',
                }}>
                  {analyses.get(i).map((bullet, bi) => (
                    <div key={bi} style={{ marginBottom: bi < analyses.get(i).length - 1 ? 6 : 0 }}>• {bullet}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MicButton({ onTranscript, style }) {
  const { listening, start, stop, supported } = useVoiceInput({
    onTranscript,
    onError: () => {},
  });

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={listening ? stop : start}
      title={listening ? 'Stop recording' : 'Voice input'}
      style={{
        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: listening ? '2px solid #ef4444' : '1.5px solid #2a2d35',
        borderRadius: '50%', width: 32, height: 32, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: listening ? 'pulse 1s infinite' : 'none',
        color: listening ? '#ef4444' : '#555', padding: 0, flexShrink: 0,
        ...style,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
    </button>
  );
}

export default function JobSetup({
  photos,
  onAddPhoto,
  onRemovePhoto,
  taskType,
  setTaskType,
  customTask,
  setCustomTask,
  location,
  setLocation,
  additionalInfo,
  setAdditionalInfo,
  canGenerate,
  showClarifying,
  onShowClarifying,
  children,
  error,
}) {
  return (
    <>
      <div className="hero">
        <h1>Describe the job.<br /><em>Get your RAMS.</em></h1>
        <p>Add site photos when you have them, or generate from written details only. SafeFlow builds a compliant Risk Assessment and Method Statement from the context provided.</p>
      </div>

      <div className="divider" />

      <div className="section-label">Step 1 — Site Photos (Optional)</div>
      <PhotoUpload photos={photos} onAdd={onAddPhoto} onRemove={onRemovePhoto} />

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
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="e.g. Installation of temporary fencing along live carriageway"
                value={customTask}
                onChange={e => setCustomTask(e.target.value)}
                style={{ paddingRight: 44 }}
              />
              <MicButton onTranscript={text => setCustomTask(prev => (prev ? prev + ' ' : '') + text)} />
            </div>
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
          <div style={{ position: 'relative' }}>
            <textarea
              placeholder="Any additional context — client requirements, specific hazards you're aware of, number of operatives, duration of works…"
              value={additionalInfo}
              onChange={e => setAdditionalInfo(e.target.value)}
              style={{ paddingRight: 44 }}
            />
            <MicButton onTranscript={text => setAdditionalInfo(prev => (prev ? prev + ' ' : '') + text)} style={{ top: 20, transform: 'none' }} />
          </div>
        </div>
      </div>

      {!showClarifying && (
        <button className="generate-btn" onClick={onShowClarifying} disabled={!canGenerate}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          Generate RAMS Document
        </button>
      )}

      {showClarifying && children}
      {error && <div className="error-box">⚠ {error}</div>}
    </>
  );
}
