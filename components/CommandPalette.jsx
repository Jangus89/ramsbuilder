'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

const S = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 400,
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '20vh',
  },
  panel: {
    width: '100%', maxWidth: 560, background: '#13151c', border: '1px solid #2a2d35',
    borderRadius: 12, overflow: 'hidden',
  },
  input: {
    width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #1e2128',
    color: '#e8e8e4', fontFamily: "'DM Sans', sans-serif", fontSize: 16, padding: '16px 20px',
    outline: 'none',
  },
  list: { maxHeight: 320, overflowY: 'auto', padding: '8px 0' },
  item: (active) => ({
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 12, padding: '10px 20px', background: active ? 'rgba(0,229,160,0.06)' : 'transparent',
    border: 'none', color: active ? '#00e5a0' : '#c0c0b8', cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif", fontSize: 14, textAlign: 'left', transition: 'all 0.1s',
  }),
  shortcut: {
    fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#555', flexShrink: 0,
  },
  icon: { width: 16, height: 16, marginRight: 10, opacity: 0.6, flexShrink: 0 },
};

export default function CommandPalette({
  open, onClose, canGenerate, hasRamsData,
  onGenerate, onExportPDF, onExportWord, onOpenSettings, onReset, onRunCompliance,
  recentDocuments = [], onOpenDocument,
}) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef();

  const commands = useMemo(() => {
    const cmds = [
      { id: 'generate', label: 'Generate RAMS', shortcut: '⌘G', enabled: canGenerate, action: onGenerate },
      { id: 'pdf', label: 'Export PDF', shortcut: '⌘P', enabled: hasRamsData, action: onExportPDF },
      ...(onExportWord ? [{ id: 'word', label: 'Export Word', shortcut: '', enabled: hasRamsData, action: onExportWord }] : []),
      { id: 'settings', label: 'Open Settings', shortcut: '⌘/', enabled: true, action: onOpenSettings },
      { id: 'new', label: 'Start new RAMS', shortcut: '', enabled: true, action: onReset },
      { id: 'compliance', label: 'Run compliance check', shortcut: '', enabled: hasRamsData, action: onRunCompliance },
    ].filter(c => c.enabled);

    const docs = recentDocuments.slice(0, 5).map(doc => ({
      id: `doc-${doc.id}`,
      label: doc.task_type || doc.data?.taskType || 'Untitled RAMS',
      shortcut: '',
      enabled: true,
      action: () => onOpenDocument?.(doc),
      isRecent: true,
    }));

    return [...cmds, ...docs];
  }, [canGenerate, hasRamsData, onGenerate, onExportPDF, onExportWord, onOpenSettings, onReset, onRunCompliance, recentDocuments, onOpenDocument]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(c => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive(i => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && filtered[active]) {
        e.preventDefault();
        filtered[active].action();
        onClose();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, filtered, active, onClose]);

  if (!open) return null;

  return (
    <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={S.panel}>
        <input
          ref={inputRef}
          style={S.input}
          placeholder="Type a command…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <div style={S.list}>
          {filtered.map((cmd, i) => (
            <button
              key={cmd.id}
              style={S.item(i === active)}
              onClick={() => { cmd.action(); onClose(); }}
              onMouseEnter={() => setActive(i)}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>
                {cmd.isRecent && (
                  <svg style={S.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                )}
                {cmd.label}
              </span>
              {cmd.shortcut && <span style={S.shortcut}>{cmd.shortcut}</span>}
            </button>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#555', fontSize: 13 }}>
              No matching commands
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
