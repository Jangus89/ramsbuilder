export const styles = `
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

  .team-chip,
  .connection-chip {
    align-items: center;
    border: 1px solid #2a2d35;
    border-radius: 999px;
    color: #888;
    display: inline-flex;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    gap: 6px;
    min-height: 28px;
    padding: 4px 9px;
  }

  .connection-chip span {
    border-radius: 50%;
    display: inline-block;
    height: 7px;
    width: 7px;
  }

  .connection-chip.online span { background: #00e5a0; }
  .connection-chip.offline span { background: #f59e0b; }

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

  .camera-btn {
    align-items: center;
    background: transparent;
    border: 1.5px solid #2a2d35;
    border-radius: 8px;
    color: #00e5a0;
    cursor: pointer;
    display: inline-flex;
    font-size: 13px;
    justify-content: center;
    margin-top: 12px;
    min-height: 44px;
    padding: 10px 14px;
    position: relative;
  }

  .camera-btn input {
    inset: 0;
    opacity: 0;
    position: absolute;
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

  .stream-preview {
    margin: 18px auto 0;
    max-width: 760px;
    max-height: 320px;
    overflow: auto;
    text-align: left;
    white-space: pre-wrap;
    background: #13151c;
    border: 1.5px solid #1e2128;
    border-radius: 10px;
    color: #888;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    line-height: 1.6;
    padding: 16px;
  }

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

  .export-btn.word {
    background: transparent;
    border-color: #2a2d35;
    color: #c0c0b8;
  }

  .export-btn.word:hover {
    border-color: #2b579a;
    color: #4472c4;
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

  .rams-accordion > summary {
    display: none;
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

  .rams-section-heading {
    align-items: center;
    display: flex;
    gap: 12px;
    justify-content: space-between;
    margin-bottom: 14px;
  }

  .rams-section-heading .rams-section-title {
    flex: 1;
    margin-bottom: 0;
  }

  .section-tools,
  .status-actions {
    align-items: center;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .section-tool-btn,
  .advance-status-btn,
  .section-save-btn,
  .warning-banner button {
    background: transparent;
    border: 1px solid #2a2d35;
    border-radius: 6px;
    color: #888;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    padding: 5px 8px;
  }

  .section-tool-btn:disabled,
  .advance-status-btn:disabled {
    cursor: not-allowed;
    opacity: 0.35;
  }

  .section-editor {
    background: #0f1117;
    border: 1.5px solid #2a2d35;
    border-radius: 8px;
    color: #e8e8e4;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    line-height: 1.6;
    min-height: 150px;
    outline: none;
    padding: 12px;
    resize: vertical;
    width: 100%;
  }

  .section-save-btn {
    margin-top: 8px;
  }

  .edited-badge {
    background: rgba(0,229,160,0.08);
    border: 1px solid rgba(0,229,160,0.2);
    border-radius: 4px;
    color: #00e5a0;
    display: inline-flex;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    margin-bottom: 10px;
    padding: 3px 7px;
    text-transform: uppercase;
  }

  .advance-status-btn {
    color: #00e5a0;
  }

  .reference-link {
    background: #1e2128;
    border: 1px solid #2a2d35;
    border-radius: 7px;
    color: #c0c0b8;
    font-size: 13px;
    padding: 9px 14px;
    text-decoration: none;
  }

  .warning-banner {
    align-items: flex-start;
    background: rgba(245,158,11,0.08);
    border: 1px solid rgba(245,158,11,0.24);
    border-radius: 8px;
    color: #f59e0b;
    display: flex;
    font-size: 13px;
    gap: 12px;
    justify-content: space-between;
    line-height: 1.5;
    margin-bottom: 18px;
    padding: 12px 14px;
  }

  .warning-banner.validation {
    color: #fbbf24;
  }

  .timeline {
    border-left: 1px solid #2a2d35;
    display: grid;
    gap: 12px;
    margin-top: 14px;
    padding-left: 14px;
  }

  .timeline-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .timeline-item strong {
    color: #c0c0b8;
    font-size: 13px;
  }

  .timeline-item span {
    color: #555;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
  }

  .modal-lite {
    align-items: center;
    background: rgba(0,0,0,0.6);
    display: flex;
    inset: 0;
    justify-content: center;
    position: fixed;
    z-index: 300;
  }

  .modal-lite > div {
    background: #13151c;
    border: 1px solid #2a2d35;
    border-radius: 10px;
    padding: 22px;
    width: min(420px, calc(100vw - 32px));
  }

  .modal-lite h3 {
    color: #e8e8e4;
    font-size: 18px;
    margin-bottom: 12px;
  }

  .modal-lite input {
    background: #0f1117;
    border: 1.5px solid #2a2d35;
    border-radius: 8px;
    color: #e8e8e4;
    min-height: 44px;
    padding: 10px 12px;
    width: 100%;
  }

  .modal-lite button {
    min-height: 44px;
  }

  .diff-added { color: #00e5a0; }
  .diff-removed { color: #ef4444; }
  .diff-same { color: #888; }

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

  .risk-score {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: #555;
    margin-top: 4px;
  }

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

  .history-panel {
    margin: -28px 0 36px;
    padding-bottom: 28px;
    border-bottom: 1px solid #1e2128;
  }

  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: end;
    margin-bottom: 12px;
  }

  .history-header h2 {
    font-family: 'Instrument Serif', serif;
    font-size: 24px;
    font-weight: 400;
    color: #e8e8e4;
  }

  .history-list {
    display: grid;
    gap: 8px;
  }

  .history-item {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    text-align: left;
    background: #13151c;
    border: 1.5px solid #1e2128;
    border-radius: 8px;
    color: #c0c0b8;
    padding: 12px 14px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .history-item:hover,
  .history-item.active {
    border-color: #00e5a0;
  }

  .history-item strong {
    display: block;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 3px;
  }

  .history-item small,
  .history-ref {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: #555;
  }

  .history-ref {
    flex-shrink: 0;
  }

  @media (max-width: 600px) {
    .app { padding: 24px 16px 60px; }
    .hero h1 { font-size: 28px; }
    .photos-grid { grid-template-columns: repeat(2, 1fr); }
    .export-buttons { flex-direction: column; width: 100%; }
    .export-btn { width: 100%; justify-content: center; }
    .sign-off-grid { grid-template-columns: 1fr; }
    .rams-header { flex-direction: column; }
    .hazard-table { font-size: 12px; }
    .hazard-table th:nth-child(2), .hazard-table td:nth-child(2) { display: none; }
    .ppe-grid { gap: 6px; }
    .ppe-item { font-size: 12px; padding: 5px 10px; }
    .history-item { align-items: flex-start; flex-direction: column; }
    .rams-accordion > summary {
      color: #00e5a0;
      cursor: pointer;
      display: list-item;
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      letter-spacing: 0.1em;
      margin-bottom: 12px;
      min-height: 44px;
      padding-top: 12px;
      text-transform: uppercase;
    }
    .section-tool-btn,
    .advance-status-btn,
    .export-btn,
    .reset-btn {
      min-height: 44px;
    }
  }
`;
