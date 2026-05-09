'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { DEFAULT_PROFILE } from './lib/companyProfile';
import { callOpenAIChat, streamOpenAIChat, getRateLimitRemaining, parseJsonResponse } from './lib/openaiClient';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { populateRamsPdfTemplate } from './lib/ramsPdfTemplate';
import { buildRamsMessages } from './lib/ramsPrompt';
import { useKeyboardShortcuts } from './lib/useKeyboardShortcuts';
import { styles } from './lib/safeflowStyles';
import JobSetup from './components/JobSetup';
import RamsDocument from './components/RamsDocument';
import DocumentHistory from './components/DocumentHistory';
import SettingsModal from './components/SettingsModal';
import CompliancePanel from './components/CompliancePanel';
import ErrorBoundary from './components/ErrorBoundary';
import AuthScreen from './components/AuthScreen';
import ClarifyingQuestions from './components/ClarifyingQuestions';
import CommandPalette from './components/CommandPalette';
import { loadCachedDocuments, saveCachedDocument } from './lib/offlineCache';

const DEMO_USER = {
  id: 'local-demo-user',
  email: 'local.demo@safeflow.test',
  app_metadata: {},
  user_metadata: { name: 'Local Demo' },
  aud: 'authenticated',
  created_at: new Date(0).toISOString(),
};

const DRAFT_PREFIX = 'safeflow_draft_';
const draftValue = (key) => {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(`${DRAFT_PREFIX}${key}`) || '';
};

async function validateRamsDocument(ramsData) {
  const data = await callOpenAIChat({
    model: 'gpt-4o-mini',
    temperature: 0.1,
    max_tokens: 900,
    messages: [
      {
        role: 'system',
        content: 'You are a RAMS QA checker. Return ONLY JSON: {"validationIssues":["issue text"]}. Check risk labels against numeric scores, residual scores lower than initial scores, and obviously fabricated regulation names in controls.',
      },
      {
        role: 'user',
        content: JSON.stringify(ramsData),
      },
    ],
  });
  const text = data.choices?.[0]?.message?.content || '{"validationIssues":[]}';
  return parseJsonResponse(text, 'Could not validate the generated RAMS.').validationIssues || [];
}

export default function SafeFlowRAMS() {
  const [photos, setPhotos] = useState([]);
  const [taskType, setTaskType] = useState(() => draftValue('taskType'));
  const [customTask, setCustomTask] = useState(() => draftValue('customTask'));
  const [location, setLocation] = useState(() => draftValue('location'));
  const [additionalInfo, setAdditionalInfo] = useState(() => draftValue('additionalInfo'));
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [streamedText, setStreamedText] = useState('');
  const [ramsData, setRamsData] = useState(null);
  const [streamingFields, setStreamingFields] = useState(null);
  const [error, setError] = useState('');
  const [validationIssues, setValidationIssues] = useState([]);
  const [showValidationIssues, setShowValidationIssues] = useState(true);
  const [rateLimitRemaining, setRateLimitRemaining] = useState(null);
  const [rateWarningDismissed, setRateWarningDismissed] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [showSettings, setShowSettings]     = useState(false);
  const [showClarifying, setShowClarifying] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [user, setUser]                     = useState(null);
  const [authLoading, setAuthLoading]       = useState(true);
  const [profile, setProfile]               = useState(DEFAULT_PROFILE);
  const [procedures, setProcedures]         = useState([]);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [documents, setDocuments]           = useState([]);
  const [currentDocumentId, setCurrentDocumentId] = useState(null);
  const [org, setOrg] = useState(null);
  const [orgRole, setOrgRole] = useState(null);
  const [orgMemberCount, setOrgMemberCount] = useState(0);
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine);
  const [reuseBanner, setReuseBanner] = useState(false);
  const [shortcutToast, setShortcutToast] = useState(false);
  const streamBufferRef = useRef('');
  const generateBtnRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem('sf_shortcuts_seen')) {
      setShortcutToast(true);
      const t = setTimeout(() => {
        setShortcutToast(false);
        localStorage.setItem('sf_shortcuts_seen', '1');
      }, 4000);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(`${DRAFT_PREFIX}taskType`, taskType);
    window.localStorage.setItem(`${DRAFT_PREFIX}customTask`, customTask);
    window.localStorage.setItem(`${DRAFT_PREFIX}location`, location);
    window.localStorage.setItem(`${DRAFT_PREFIX}additionalInfo`, additionalInfo);
  }, [taskType, customTask, location, additionalInfo]);

  useEffect(() => {
    if (rateLimitCountdown <= 0) return;
    const timer = setInterval(() => {
      setRateLimitCountdown(prev => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitCountdown]);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setUser(DEMO_USER);
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;
    supabase.from('company_profiles').select('data').eq('user_id', user.id).single()
      .then(({ data }) => { if (data?.data) setProfile(p => ({ ...p, ...data.data })); });
    supabase.from('procedures').select('*').eq('user_id', user.id).order('created_at')
      .then(({ data }) => { if (data) setProcedures(data); });
    supabase.from('templates').select('*').eq('user_id', user.id).eq('is_active', true).limit(1)
      .then(({ data }) => { setActiveTemplate(data?.[0] || null); });
    supabase.from('org_members').select('*, organisations(*)').eq('user_id', user.id).eq('status', 'active').limit(1)
      .then(async ({ data }) => {
        const member = data?.[0];
        if (!member) return;
        setOrg(member.organisations);
        setOrgRole(member.role);
        const { count } = await supabase.from('org_members').select('*', { count: 'exact', head: true }).eq('org_id', member.org_id).eq('status', 'active');
        setOrgMemberCount(count || 0);
      });
    const loadDocs = async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setDocuments(await loadCachedDocuments());
        return;
      }
      supabase.from('rams_documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
        .then(({ data }) => {
          if (data) {
            setDocuments(data);
            data.slice(0, 10).forEach(saveCachedDocument);
          }
        });
    };
    loadDocs();
  }, [user]);

  const authHeaders = async () => {
    const { data } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${data.session?.access_token || ''}` };
  };

  const writeAudit = async (action, detail = {}) => {
    if (!currentDocumentId || !isSupabaseConfigured) return;
    await fetch(`/api/documents/${currentDocumentId}/audit-log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify({ action, detail }),
    }).catch(() => {});
  };

  const addPhoto = useCallback((photo) => {
    setPhotos(prev => [...prev, photo]);
  }, []);

  const removePhoto = useCallback((index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  }, []);

  const buildPrompt = (answers) => {
    const task = taskType === 'Other (describe below)' ? customTask : taskType;
    return buildRamsMessages({
      task,
      taskType,
      customTask,
      location,
      additionalInfo,
      hasPhotos: photos.length > 0,
      answers,
      profile,
      procedures,
    }).messages;
  };

  const generateRAMS = async (answers = {}) => {
    const task = taskType === 'Other (describe below)' ? customTask : taskType;
    if (!task) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setError('Internet connection required to generate a RAMS document.');
      return;
    }

    setShowClarifying(false);
    setLoading(true);
    setError('');
    setStreamedText('');
    setStreamingFields({});
    setValidationIssues([]);
    setShowValidationIssues(true);
    setLoadingStep(0);
    setRamsData(null);
    streamBufferRef.current = '';

    try {
      const sessionResult = isSupabaseConfigured ? await supabase.auth.getSession() : null;
      const accessToken = sessionResult?.data?.session?.access_token;
      const taskRequest = isSupabaseConfigured && accessToken
        ? {
            model: 'gpt-4o',
            max_tokens: 8000,
            temperature: 0.2,
            safeFlowContext: {
              accessToken,
              task,
              taskType,
              customTask,
              location,
              additionalInfo,
              hasPhotos: photos.length > 0,
              photos: photos.map(p => p.url),
              answers,
            },
          }
        : {
            model: 'gpt-4o',
            max_tokens: 8000,
            temperature: 0.2,
            messages: buildPrompt(answers).map((message, index) => index === 1
              ? {
                  ...message,
                  content: [
                    ...photos.map(p => ({ type: 'image_url', image_url: { url: p.url, detail: 'high' } })),
                    { type: 'text', text: message.content }
                  ],
                }
              : message
            )
          };

      await streamOpenAIChat(taskRequest, (deltaText) => {
        streamBufferRef.current += deltaText;
        const buf = streamBufferRef.current;
        setStreamedText(buf);

        try {
          const parsed = parseJsonResponse(buf, '__fail__');
          if (parsed && typeof parsed === 'object' && parsed.taskType) {
            setRamsData({ ...parsed, status: 'draft' });
            setStreamingFields(null);
            setLoading(false);
          }
        } catch {
          const sf = {};
          const topKeys = ['taskType', 'location', 'scopeOfWorks', 'siteObservations', 'hazards', 'methodStatement', 'ppe', 'emergencyArrangements', 'competencies', 'trainingRequirements', 'welfareArrangements', 'environmentalControls', 'coshhAssessment', 'refuellingProcedure'];
          for (const key of topKeys) {
            const pattern = new RegExp(`"${key}"\\s*:\\s*`);
            const match = buf.match(pattern);
            if (match) {
              sf[key] = true;
            }
          }
          if (Object.keys(sf).length > 0) {
            setStreamingFields(sf);
          }
        }
      });

      const remaining = getRateLimitRemaining();
      if (remaining !== null) {
        setRateLimitRemaining(remaining);
        setRateWarningDismissed(false);
      }

      const text = streamBufferRef.current;
      if (!ramsData) {
        const parsed = { ...parseJsonResponse(text, 'Could not parse the generated RAMS. Please try again.'), status: 'draft' };
        setStreamingFields(null);
        setRamsData(parsed);
      }

      const currentParsed = parseJsonResponse(text, 'err');
      const issues = await validateRamsDocument(currentParsed);
      setValidationIssues(issues);
      setLoading(false);

      if (user && isSupabaseConfigured) {
        const refNumber = `SF-${Date.now().toString().slice(-6)}`;
        const inputs = { taskType, customTask, location, additionalInfo, answers, photoCount: photos.length };
        const { data: saved, error: saveError } = await supabase.from('rams_documents').insert({
          user_id: user.id,
          org_id: org?.id || null,
          task_type: currentParsed.taskType,
          location: currentParsed.location,
          ref_number: refNumber,
          status: 'draft',
          data: currentParsed,
          inputs,
        }).select('*').single();
        if (saveError) {
          setError(`RAMS generated, but saving to history failed: ${saveError.message}`);
        } else {
          setDocuments(prev => [saved, ...prev.filter(doc => doc.id !== saved.id)].slice(0, 20));
          setCurrentDocumentId(saved.id);
          saveCachedDocument(saved);
        }
      }
    } catch (err) {
      if (err.status === 429) setRateLimitCountdown(60);
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
      setStreamingFields(null);
    } finally {
      const remaining = getRateLimitRemaining();
      if (remaining !== null) setRateLimitRemaining(remaining);
    }
  };

  const handleExportPDF = () => {
    const win = window.open('', '_blank');
    if (!win) {
      setError('Could not open print window. Check popup blocking and try again.');
      return;
    }
    const refNum = `SF-${Date.now().toString().slice(-6)}`;
    const issueDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    populateRamsPdfTemplate(win.document, ramsData, { profile, refNum, issueDate });
    writeAudit('exported_pdf', { refNum });
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  const handleExportWord = async () => {
    if (!activeTemplate || !ramsData) return;
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Word template export requires Supabase to be configured.');
      }
      const { data: fileData, error } = await supabase.storage.from('templates').download(activeTemplate.storage_path);
      if (error) throw error;
      const arrayBuffer = await fileData.arrayBuffer();
      const { fillTemplate, downloadFile } = await import('./lib/templateFiller');
      const refNum = `SF-${Date.now().toString().slice(-6)}`;
      const filled = await fillTemplate(arrayBuffer, ramsData, profile, refNum);
      downloadFile(filled, `RAMS-${ramsData.taskType.replace(/\W+/g, '-')}.docx`);
      writeAudit('exported_word', { templateId: activeTemplate?.id });
    } catch (err) {
      setError(`Word export failed: ${err.message}`);
    }
  };

  const handleExportDrive = () => {
    alert('Google Drive integration requires OAuth setup. In the full product, this saves directly to your connected Drive folder in your own template.');
  };

  const handleExportOneDrive = () => {
    alert('OneDrive integration requires Microsoft OAuth setup. In the full product, this saves directly to your connected OneDrive folder in your own template.');
  };

  const openDocument = (document) => {
    setRamsData({ ...document.data, status: document.status || document.data?.status || 'draft' });
    setCurrentDocumentId(document.id);
    setValidationIssues(document.data?.validationIssues || []);
    setShowValidationIssues(true);
    setShowClarifying(false);
    setLoading(false);
    setStreamingFields(null);
    setError('');
  };

  const saveCurrentDocument = async (nextData, extra = {}) => {
    if (!currentDocumentId || !isSupabaseConfigured) return;
    const { data: saved, error: saveError } = await supabase.from('rams_documents').upsert({
      id: currentDocumentId,
      user_id: user.id,
      org_id: org?.id || null,
      task_type: nextData.taskType,
      location: nextData.location,
      data: nextData,
      ...extra,
    }).select('*').single();
    if (saveError) {
      setError(`Could not save RAMS changes: ${saveError.message}`);
      return;
    }
    setDocuments(prev => prev.map(doc => doc.id === saved.id ? saved : doc));
    saveCachedDocument(saved);
  };

  const handleRamsEdit = async (field, value) => {
    const next = { ...ramsData, [field]: value, editedFields: { ...(ramsData.editedFields || {}), [field]: true } };
    setRamsData(next);
    await saveCurrentDocument(next);
    writeAudit('edited', { field });
  };

  const handleAdvanceStatus = async (nextStatus) => {
    const next = { ...ramsData, status: nextStatus };
    setRamsData(next);
    await saveCurrentDocument(next, { status: nextStatus });
    writeAudit('status_advanced', { status: nextStatus });
  };

  const handleOrgChange = ({ org: nextOrg, role, memberCount }) => {
    setOrg(nextOrg);
    setOrgRole(role);
    setOrgMemberCount(memberCount || 1);
  };

  const handleReuseInputs = (inputs) => {
    if (!inputs) return;
    if (inputs.taskType) setTaskType(inputs.taskType);
    if (inputs.customTask) setCustomTask(inputs.customTask);
    if (inputs.location) setLocation(inputs.location);
    if (inputs.additionalInfo) setAdditionalInfo(inputs.additionalInfo);
    setRamsData(null);
    setCurrentDocumentId(null);
    setStreamingFields(null);
    setShowClarifying(false);
    setReuseBanner(true);
    setTimeout(() => setReuseBanner(false), 4000);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetBuilder = () => {
    setRamsData(null);
    setCurrentDocumentId(null);
    setPhotos([]);
    setTaskType('');
    setCustomTask('');
    setLocation('');
    setAdditionalInfo('');
    setShowClarifying(false);
    setStreamingFields(null);
    setValidationIssues([]);
    if (typeof window !== 'undefined') {
      ['taskType', 'customTask', 'location', 'additionalInfo'].forEach(key => {
        window.localStorage.removeItem(`${DRAFT_PREFIX}${key}`);
      });
    }
  };

  const canGenerate = Boolean((taskType && taskType !== 'Other (describe below)') || customTask.trim());

  const shortcuts = useMemo(() => [
    { key: 'g', meta: true, handler: () => { if (canGenerate && !loading) { setShowClarifying(true); } } },
    { key: 'p', meta: true, handler: () => { if (ramsData) handleExportPDF(); } },
    { key: 'k', meta: true, handler: () => setShowCommandPalette(prev => !prev) },
    { key: '/', meta: true, handler: () => setShowSettings(true) },
    { key: 'escape', meta: false, handler: () => {
      if (showCommandPalette) setShowCommandPalette(false);
      else if (showSettings) setShowSettings(false);
      else if (ramsData) { setRamsData(null); setCurrentDocumentId(null); }
    }},
  ], [canGenerate, loading, ramsData, showCommandPalette, showSettings]);

  useKeyboardShortcuts(shortcuts);

  if (authLoading) {
    return (
      <>
        <style>{styles}</style>
        <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loading-ring" style={{ width: 32, height: 32, borderWidth: 3 }} />
        </div>
      </>
    );
  }

  if (!user) {
    return <AuthScreen onDemo={() => setUser(DEMO_USER)} />;
  }

  const streamAnimationStyles = `
    @keyframes fadeSlideIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <style>{streamAnimationStyles}</style>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className={`connection-chip ${online ? 'online' : 'offline'}`} title={online ? 'Online' : 'Offline'}><span />{online ? 'Online' : 'Offline'}</div>
            {org && <div className="team-chip">Team · {orgMemberCount}</div>}
            <div className="badge">PROTOTYPE</div>
            <button
              onClick={() => setShowSettings(true)}
              title="Company Settings"
              style={{ background: 'none', border: '1.5px solid #2a2d35', borderRadius: 8, color: '#555', cursor: 'pointer', padding: '6px 10px', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#888'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2d35'; e.currentTarget.style.color = '#555'; }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
            <button
              onClick={() => isSupabaseConfigured && supabase.auth.signOut()}
              title="Sign out"
              style={{ background: 'none', border: '1.5px solid #2a2d35', borderRadius: 8, color: '#555', cursor: 'pointer', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2d35'; e.currentTarget.style.color = '#555'; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign out
            </button>
          </div>
        </div>

        {!online && (
          <div className="warning-banner">
            You're offline — viewing cached documents. Changes will sync when connection is restored.
          </div>
        )}

        {rateLimitCountdown > 0 && (
          <div className="warning-banner">
            Rate limit reached — resets in {rateLimitCountdown} seconds.
          </div>
        )}

        {rateLimitCountdown === 0 && rateLimitRemaining !== null && rateLimitRemaining <= 3 && !rateWarningDismissed && (
          <div className="warning-banner">
            <span>You have {rateLimitRemaining} generation{rateLimitRemaining === 1 ? '' : 's'} remaining this minute.</span>
            <button onClick={() => setRateWarningDismissed(true)}>Dismiss</button>
          </div>
        )}

        {reuseBanner && (
          <div className="warning-banner" style={{ background: 'rgba(0,229,160,0.06)', borderColor: 'rgba(0,229,160,0.2)', color: '#00e5a0' }}>
            Form pre-filled from previous job — review and generate when ready
          </div>
        )}

        {documents.length > 0 && !ramsData && !loading && (
          <DocumentHistory
            documents={documents}
            currentDocumentId={currentDocumentId}
            onOpen={openDocument}
            onReuseInputs={handleReuseInputs}
          />
        )}

        {!ramsData && !loading && (
          <JobSetup
            photos={photos}
            onAddPhoto={addPhoto}
            onRemovePhoto={removePhoto}
            taskType={taskType}
            setTaskType={setTaskType}
            customTask={customTask}
            setCustomTask={setCustomTask}
            location={location}
            setLocation={setLocation}
            additionalInfo={additionalInfo}
            setAdditionalInfo={setAdditionalInfo}
            canGenerate={canGenerate}
            showClarifying={showClarifying}
            onShowClarifying={() => setShowClarifying(true)}
            error={error}
          >
              <ErrorBoundary>
                <ClarifyingQuestions
                  taskType={taskType === 'Other (describe below)' ? customTask || null : taskType}
                  location={location}
                  additionalInfo={[taskType !== 'Other (describe below)' && customTask.trim() ? `Task description: ${customTask.trim()}` : '', additionalInfo].filter(Boolean).join('\n')}
                  photos={photos}
                  onSubmit={(answers) => generateRAMS(answers)}
                  onBack={() => setShowClarifying(false)}
                />
              </ErrorBoundary>
          </JobSetup>
        )}

        {loading && !ramsData && (
          <div className="rams-output" style={{ opacity: 0.6, pointerEvents: 'none' }}>
            <div className="rams-doc" id="rams-document">
              <div className="rams-doc-header">
                <div>
                  <div className="rams-doc-title" style={{ color: '#555' }}>Generating RAMS…</div>
                  <div className="rams-doc-meta">
                    <span style={{ color: '#333' }}>Streaming sections as they complete</span>
                  </div>
                </div>
              </div>
              <div className="rams-body">
                {['scopeOfWorks', 'siteObservations', 'hazards', 'methodStatement', 'ppe', 'emergencyArrangements'].map(key => (
                  <div className="rams-section" key={key}>
                    <div style={{
                      height: 64, borderRadius: 8,
                      background: streamingFields && key in streamingFields
                        ? 'rgba(0,229,160,0.04)'
                        : 'linear-gradient(90deg, #1e2128 25%, #2a2d35 50%, #1e2128 75%)',
                      backgroundSize: '200% 100%',
                      animation: streamingFields && key in streamingFields ? 'none' : 'shimmer 1.5s ease infinite',
                    }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {ramsData && !loading && (
          <>
            {validationIssues.length > 0 && showValidationIssues && (
              <div className="warning-banner validation">
                <div>
                  <strong>Validation warnings</strong>
                  {validationIssues.map((issue, index) => <div key={index}>{issue}</div>)}
                </div>
                <button onClick={() => setShowValidationIssues(false)}>Dismiss</button>
              </div>
            )}
            <ErrorBoundary>
              <RamsDocument
                data={ramsData}
                documentId={currentDocumentId}
                status={ramsData.status || documents.find(doc => doc.id === currentDocumentId)?.status || 'draft'}
                onReset={resetBuilder}
                onEdit={handleRamsEdit}
                onAdvanceStatus={handleAdvanceStatus}
                onExportPDF={handleExportPDF}
                onExportWord={activeTemplate ? handleExportWord : null}
                onExportDrive={handleExportDrive}
                onExportOneDrive={handleExportOneDrive}
                streamingFields={streamingFields}
              />
            </ErrorBoundary>
            <ErrorBoundary>
              <CompliancePanel
                ramsData={ramsData}
                profile={profile}
                procedures={procedures}
                onUpdateRams={setRamsData}
                onAudit={(action, detail) => writeAudit(action, detail)}
              />
            </ErrorBoundary>
          </>
        )}
      </div>
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          user={user}
          profile={profile}
          setProfile={setProfile}
          procedures={procedures}
          setProcedures={setProcedures}
          activeTemplate={activeTemplate}
          setActiveTemplate={setActiveTemplate}
          org={org}
          orgRole={orgRole}
          onOrgChange={handleOrgChange}
        />
      )}
      <CommandPalette
        open={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        canGenerate={canGenerate && !loading}
        hasRamsData={Boolean(ramsData)}
        onGenerate={() => { if (canGenerate && !loading) setShowClarifying(true); }}
        onExportPDF={handleExportPDF}
        onExportWord={activeTemplate ? handleExportWord : null}
        onOpenSettings={() => setShowSettings(true)}
        onReset={resetBuilder}
        onRunCompliance={() => {}}
        recentDocuments={documents}
        onOpenDocument={openDocument}
      />
      {shortcutToast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 500,
          fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#00e5a0',
          background: '#13151c', border: '1px solid rgba(0,229,160,0.2)',
          borderRadius: 8, padding: '10px 16px',
          animation: 'fadeSlideIn 0.35s ease forwards',
        }}>
          Pro tip: ⌘K opens the command palette
        </div>
      )}
    </>
  );
}
