'use client';

function formatDate(value) {
  if (!value) return 'Unknown date';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function DocumentHistory({ documents, currentDocumentId, onOpen, onReuseInputs }) {
  if (!documents.length) return null;

  return (
    <section className="history-panel" aria-label="RAMS document history">
      <div className="history-header">
        <div>
          <div className="section-label" style={{ marginBottom: 4 }}>Document History</div>
          <h2>Previous RAMS</h2>
        </div>
      </div>
      <div className="history-list">
        {documents.map(doc => (
          <div
            key={doc.id}
            className={`history-item ${doc.id === currentDocumentId ? 'active' : ''}`}
            style={{ cursor: 'default' }}
          >
            <button
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textAlign: 'left', flex: 1, padding: 0, font: 'inherit' }}
              onClick={() => onOpen(doc)}
            >
              <span>
                <strong>{doc.task_type || doc.data?.taskType || 'Untitled RAMS'}</strong>
                <small>{doc.location || doc.data?.location || 'No location'} · {formatDate(doc.created_at)}</small>
              </span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              {doc.inputs && onReuseInputs && (
                <button
                  className="section-tool-btn"
                  title="Reuse inputs"
                  onClick={(e) => { e.stopPropagation(); onReuseInputs(doc.inputs); }}
                  style={{ fontSize: 13, padding: '4px 8px' }}
                >
                  ↺
                </button>
              )}
              <button
                className="section-tool-btn"
                title="Open document"
                onClick={(e) => { e.stopPropagation(); onOpen(doc); }}
                style={{ fontSize: 11, padding: '4px 8px' }}
              >
                Open
              </button>
              <span className="history-ref">{doc.ref_number || 'Draft'}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
