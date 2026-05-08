export default function LoadingState({ step, streamedText = '' }) {
  const steps = [
    'Analysing site photos…',
    'Identifying hazards and risk factors…',
    'Mapping controls and mitigations…',
    'Compiling RAMS document…',
  ];
  return (
    <div className="loading">
      {!streamedText && <div className="loading-ring" />}
      <p>{streamedText ? 'Drafting RAMS document…' : 'Generating your RAMS document'}</p>
      {streamedText ? (
        <pre className="stream-preview">{streamedText.slice(-1800)}</pre>
      ) : (
        <div className="loading-steps">
          {steps.map((s, i) => (
            <div key={i} className={`loading-step ${i === step ? 'active' : ''}`}>
              {i < step ? '✓' : i === step ? '›' : '○'} {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
