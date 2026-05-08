'use client';

function formatDate(value) {
  if (!value) return 'Unknown date';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function DocumentHistory({ documents, currentDocumentId, onOpen }) {
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
          <button
            key={doc.id}
            className={`history-item ${doc.id === currentDocumentId ? 'active' : ''}`}
            onClick={() => onOpen(doc)}
          >
            <span>
              <strong>{doc.task_type || doc.data?.taskType || 'Untitled RAMS'}</strong>
              <small>{doc.location || doc.data?.location || 'No location'} · {formatDate(doc.created_at)}</small>
            </span>
            <span className="history-ref">{doc.ref_number || 'Draft'}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
