'use client';

import { useState, useCallback, useEffect } from "react";
import { DEFAULT_PROFILE } from './lib/companyProfile';
import { callOpenAIChat, getRateLimitRemaining, parseJsonResponse } from './lib/openaiClient';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { populateRamsPdfTemplate } from './lib/ramsPdfTemplate';
import { buildRamsMessages } from './lib/ramsPrompt';
import { styles } from './lib/safeflowStyles';
import JobSetup from './components/JobSetup';
import LoadingState from './components/LoadingState';
import RamsDocument from './components/RamsDocument';
import DocumentHistory from './components/DocumentHistory';
import SettingsModal from './components/SettingsModal';
import CompliancePanel from './components/CompliancePanel';
import ErrorBoundary from './components/ErrorBoundary';
import AuthScreen from './components/AuthScreen';
import ClarifyingQuestions from './components/ClarifyingQuestions';
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
  const [taskType, setTaskType] = useState('');
  const [customTask, setCustomTask] = useState('');
  const [location, setLocation] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [draftRestored, setDraftRestored] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [streamedText, setStreamedText] = useState('');
  const [ramsData, setRamsData] = useState(null);
  const [error, setError] = useState('');
  const [validationIssues, setValidationIssues] = useState([]);
  const [showValidationIssues, setShowValidationIssues] = useState(true);
  const [rateLimitRemaining, setRateLimitRemaining] = useState(null);
  const [rateWarningDismissed, setRateWarningDismissed] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [showSettings, setShowSettings]     = useState(false);
  const [showClarifying, setShowClarifying] = useState(false);
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setTaskType(window.localStorage.getItem(`${DRAFT_PREFIX}taskType`) || '');
    setCustomTask(window.localStorage.getItem(`${DRAFT_PREFIX}customTask`) || '');
    setLocation(window.localStorage.getItem(`${DRAFT_PREFIX}location`) || '');
    setAdditionalInfo(window.localStorage.getItem(`${DRAFT_PREFIX}additionalInfo`) || '');
    setDraftRestored(true);
  }, []);

  useEffect(() => {
    if (!draftRestored || typeof window === 'undefined') return;
    window.localStorage.setItem(`${DRAFT_PREFIX}taskType`, taskType);
    window.localStorage.setItem(`${DRAFT_PREFIX}customTask`, customTask);
    window.localStorage.setItem(`${DRAFT_PREFIX}location`, location);
    window.localStorage.setItem(`${DRAFT_PREFIX}additionalInfo`, additionalInfo);
  }, [draftRestored, taskType, customTask, location, additionalInfo]);

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
    setValidationIssues([]);
    setShowValidationIssues(true);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep(prev => Math.min(prev + 1, 3));
    }, 1800);

    try {
      const sessionResult = isSupabaseConfigured ? await supabase.auth.getSession() : null;
      const accessToken = sessionResult?.data?.session?.access_token;
      const taskRequest = isSupabaseConfigured && accessToken
        ? {
            model: 'gpt-4o',
            max_tokens: 8000,
            temperature: 0.2,
            stream: true,
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
            stream: true,
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

      const data = await callOpenAIChat(taskRequest, {
        onChunk: (_, fullText) => setStreamedText(fullText),
      });
      const remaining = getRateLimitRemaining();
      if (remaining !== null) {
        setRateLimitRemaining(remaining);
        setRateWarningDismissed(false);
      }

      const text = data.choices?.[0]?.message?.content || '';
      const parsed = { ...parseJsonResponse(text, 'Could not parse the generated RAMS. Please try again.'), status: 'draft' };
      const issues = await validateRamsDocument(parsed);
      setValidationIssues(issues);

      clearInterval(stepInterval);
      setLoadingStep(3);
      await new Promise(r => setTimeout(r, 400));
      setRamsData(parsed);
      setCurrentDocumentId(null);
      if (user && isSupabaseConfigured) {
        const refNumber = `SF-${Date.now().toString().slice(-6)}`;
        const { data: saved, error: saveError } = await supabase.from('rams_documents').insert({
          user_id: user.id,
          org_id: org?.id || null,
          task_type: parsed.taskType,
          location: parsed.location,
          ref_number: refNumber,
          status: 'draft',
          data: parsed,
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
      clearInterval(stepInterval);
      if (err.status === 429) setRateLimitCountdown(60);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      const remaining = getRateLimitRemaining();
      if (remaining !== null) setRateLimitRemaining(remaining);
      setLoading(false);
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

  const resetBuilder = () => {
    setRamsData(null);
    setCurrentDocumentId(null);
    setPhotos([]);
    setTaskType('');
    setCustomTask('');
    setLocation('');
    setAdditionalInfo('');
    setShowClarifying(false);
    setValidationIssues([]);
    if (typeof window !== 'undefined') {
      ['taskType', 'customTask', 'location', 'additionalInfo'].forEach(key => {
        window.localStorage.removeItem(`${DRAFT_PREFIX}${key}`);
      });
    }
  };

  const canGenerate = Boolean((taskType && taskType !== 'Other (describe below)') || customTask.trim());

  if (authLoading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: styles }} />
        <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loading-ring" style={{ width: 32, height: 32, borderWidth: 3 }} />
        </div>
      </>
    );
  }

  if (!user) {
    return <AuthScreen onDemo={() => setUser(DEMO_USER)} />;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
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

        {documents.length > 0 && !ramsData && !loading && (
          <DocumentHistory
            documents={documents}
            currentDocumentId={currentDocumentId}
            onOpen={openDocument}
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

        {loading && <LoadingState step={loadingStep} streamedText={streamedText} />}

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
    </>
  );
}
