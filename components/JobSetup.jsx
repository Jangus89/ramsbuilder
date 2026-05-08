'use client';

import { useState, useRef, useCallback } from "react";

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

  const handleFiles = useCallback((files) => {
    setFileError('');
    const remaining = 4 - photos.length;
    const toAdd = Array.from(files).slice(0, remaining);
    toAdd.forEach(file => {
      if (!file.type.startsWith('image/')) {
        setFileError('Only image files are allowed.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFileError('Each image must be under 5 MB.');
        return;
      }
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
