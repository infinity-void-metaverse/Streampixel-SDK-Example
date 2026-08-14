import React, { useEffect, useRef, useState, useCallback } from 'react';
import { StreamPixel, AuthError, SDK_VERSION } from '@streampixel/core';
import { VoiceChat } from '@streampixel/core/voice';

/* =========================================================================
   Streampixel SDK v2 example — @streampixel/core

   👋 NEW HERE? Don't start in this file — it's the FULL reference
   (password gate, chat, SFU, stats, dev tools: ~800 lines).
   Start with public/examples/minimal.html — the whole integration in
   15 lines — then come back when you need a specific feature. Each
   section below is independent: find the feature, copy the section.

   Core is HEADLESS: it exposes typed state/events and paints nothing
   (except the optional built-in `loading: true` overlay, unused here).
   Everything you see in this file's render tree is example UI you own —
   copy it, restyle it, or replace it.
   ========================================================================= */
const SHOW_DEV_TOOLS = true;

/* =========================================================================
   CUSTOMIZATION: Loading Screen Configuration
   ========================================================================= */
const LOADING_CONFIG = {
  backgroundColor: '#18181A',
  accentColor: '#4e9cff',
  logoUrl: null, // e.g. '/Images/logo.png'
  title: 'Connecting to Stream',
  subtitle: 'Please wait while we set up your experience...',
  disconnectedSubtitle: 'The stream session has ended.',
  queueMessage: (position) => `You are in queue at position ${position}`,
  showSpinner: true,

  statusMessages: {
    initializing: 'Initializing...',
    resolving: 'Authorizing session...',
    connecting: 'Establishing WebRTC connection...',
    inQueue: 'Waiting in queue...',
    starting: 'Starting your application...',
    streaming: 'Starting video playback...',
    stalled: 'Stream stalled — recovering...',
    recovering: 'Restarting the stream...',
    reconnecting: 'Reconnecting to stream...',
    failed: 'Connection failed. Please try again.',
    disconnected: 'Disconnected from stream.',
  },

  reconnectingTitle: 'Reconnecting',
  reconnectingSubtitle: 'Please wait while we restore your session...',
  reconnectFailedTitle: 'Reconnection Failed',
  reconnectFailedSubtitle: 'We were unable to restore your session.',
};

/* Map core's typed state machine onto the loading screen. */
const PROGRESS_BY_STATE = {
  resolving: 10,
  queued: 15,
  starting: 25,
  connecting: 45,
  streaming: 100,
  recovering: 20,
  reconnecting: 20,
};

const App = () => {
  const streamRef = useRef(null);      // the StreamPixel instance
  const videoRef = useRef(null);       // container core attaches <video> into
  const latestStats = useRef(null);    // updated every second by the stats event

  // URL-derived config
  const [projectId, setProjectId] = useState(null);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [loadingTitle, setLoadingTitle] = useState(LOADING_CONFIG.title);
  const [loadingSubtitle, setLoadingSubtitle] = useState(LOADING_CONFIG.subtitle);
  const [queuePosition, setQueuePosition] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(LOADING_CONFIG.statusMessages.initializing);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Password gate (AuthError → this form → retry with auth: password)
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Controls state
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [statsData, setStatsData] = useState(null);

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [currentResolution, setCurrentResolution] = useState('Auto (Dashboard)');
  const [resolutionOptions, setResolutionOptions] = useState([]);

  // AFK state
  const [afkWarning, setAfkWarning] = useState(false);
  const [afkCountdown, setAfkCountdown] = useState(0);
  const dismissAfkRef = useRef(null);

  // On-screen keyboard (UE text fields): null = closed, string = current text
  const [oskText, setOskText] = useState(null);

  // Chat (voice/text via @streampixel/core/voice) — available when the ticket
  // carried a voiceToken, i.e. the project has chat enabled in the dashboard.
  const chatRef = useRef(null);
  const [chatAvailable, setChatAvailable] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatJoined, setChatJoined] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [micOn, setMicOn] = useState(false);
  const [roster, setRoster] = useState({ localParticipant: null, remoteParticipants: [] });
  const [someoneTyping, setSomeoneTyping] = useState(false);
  const typingTimer = useRef(null);

  // Developer Tools state
  const [showDevTools, setShowDevTools] = useState(false);
  const [consoleCmd, setConsoleCmd] = useState('stat fps');
  const [uiInteractionJson, setUiInteractionJson] = useState('{"type":"setColor","value":"red"}');

  /* =====================================================================
     Parse project ID and query params from URL
     ===================================================================== */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pathId = window.location.pathname.split('/').filter(Boolean).pop();
    setProjectId(params.get('appId') || pathId || null);
  }, []);

  /* =====================================================================
     Start (or restart) a session. `authOverride` carries the password
     retry; everything else re-reads the URL.
     ===================================================================== */
  const startStream = useCallback(async (id, authOverride) => {
    const params = new URLSearchParams(window.location.search);
    // PRODUCTION by default (the SDK's own defaults). ?platform=staging opts in
    // to the staging control plane for SDK development.
    const staging = params.get('platform') === 'staging';
    const platformHost = staging ? 'https://platform.staging.streampixel.io' : undefined;
    const telemetryHost = staging ? 'https://telemetry.staging.streampixel.io' : undefined;

    // Shared (SFU) viewing: ?shared=host, or ?shared=viewer&hostStreamerId=<id>
    const sharedParam = params.get('shared');
    const shared =
      sharedParam === 'host'
        ? { role: 'host' }
        : sharedParam === 'viewer' && params.get('hostStreamerId')
          ? { role: 'viewer', hostStreamerId: params.get('hostStreamerId') }
          : undefined;

    setNeedsPassword(false);
    setIsLoading(true);
    setLoadingTitle(LOADING_CONFIG.title);
    setLoadingSubtitle(LOADING_CONFIG.subtitle);
    setLoadingStatus(LOADING_CONFIG.statusMessages.resolving);
    setLoadingProgress(10);

    let stream;
    try {
      /* ─────────────────────────────────────────────────────────────────
         StreamPixel.create() — one call resolves access, mints the
         session ticket, and starts connecting. All stream behaviour
         (codec, resolution, inputs, AFK) defaults to your dashboard
         config; pass options only to override it.
         ───────────────────────────────────────────────────────────────── */
      stream = await StreamPixel.create({
        appId: id,
        container: videoRef.current,
        auth: authOverride, // undefined = auto; {mode:'password'} on retry
        shared,
        advanced: {
          platformHost,
          telemetryHost,
          streamerId: params.get('streamerId') || undefined,
        },
        // codec:      { primary: 'AV1', fallback: 'H264' },
        // resolution: { start: '1080p (1920x1080)', mode: 'dynamic' },
        // bitrate:    { min: 1_000_000, max: 20_000_000 },
        // input:      { mouse: true, keyboard: true, touch: true },
        // media:      { mic: false, camera: false },
        // afk:        { timeoutSec: 300 },
        // telemetry:  'standard',
      });
    } catch (err) {
      if (err instanceof AuthError && (err.kind === 'password-required' || err.kind === 'password-wrong')) {
        setNeedsPassword(true);
        setPasswordError(err.kind === 'password-wrong' ? 'Incorrect password. Please try again.' : '');
        setLoadingProgress(0);
        return;
      }
      // sso-required with auth:auto auto-redirects to the IdP before throwing,
      // so reaching here for SSO means the page is already navigating away.
      setLoadingTitle('Stream Unavailable');
      setLoadingSubtitle(err.message || 'The link may be incorrect, expired, or no longer active.');
      setLoadingStatus(LOADING_CONFIG.statusMessages.failed);
      setLoadingProgress(0);
      return;
    }

    streamRef.current = stream;
    window.spStream = stream; // handy for the browser console
    setChatAvailable(!!stream.voiceToken);

    // The dashboard's allowed ladder → the quality picker.
    setResolutionOptions([
      { label: 'Auto (Dashboard)', value: null },
      ...stream.allowedResolutions.map((r) => ({ label: r.split(' ')[0], value: r })),
    ]);

    /* ─── State machine → loading screen ─────────────────────────────── */
    stream.on('state', (s) => {
      const progress = PROGRESS_BY_STATE[s.kind];
      if (progress !== undefined) setLoadingProgress(progress);

      switch (s.kind) {
        case 'streaming':
          setTimeout(() => {
            setIsLoading(false);
            setQueuePosition(null);
            setLoadingTitle(LOADING_CONFIG.title);
            setLoadingSubtitle(LOADING_CONFIG.subtitle);
          }, 300);
          break;
        case 'queued':
          setLoadingStatus(LOADING_CONFIG.statusMessages.inQueue);
          break;
        case 'connecting':
          setLoadingStatus(LOADING_CONFIG.statusMessages.connecting);
          break;
        case 'recovering':
          setIsLoading(true);
          setLoadingStatus(LOADING_CONFIG.statusMessages.recovering);
          break;
        case 'reconnecting':
          setIsLoading(true);
          setIsMuted(true);
          setLoadingTitle(LOADING_CONFIG.reconnectingTitle);
          setLoadingSubtitle(LOADING_CONFIG.reconnectingSubtitle);
          setLoadingStatus(LOADING_CONFIG.statusMessages.reconnecting);
          break;
        default:
          break;
      }
    });

    stream.on('queue', ({ position }) => setQueuePosition(position));

    /* ─── Session end — code + endKind tell you what to say ──────────── */
    stream.on('ended', ({ code, reason, endKind }) => {
      setIsLoading(true);
      setLoadingProgress(0);
      setQueuePosition(null);
      setAfkWarning(false);
      if (endKind === 'afk') {
        setLoadingTitle('Session Ended');
        setLoadingSubtitle(LOADING_CONFIG.disconnectedSubtitle);
        setLoadingStatus('You were disconnected due to inactivity.');
      } else if (code === 4007) {
        setLoadingTitle(LOADING_CONFIG.reconnectFailedTitle);
        setLoadingSubtitle(LOADING_CONFIG.reconnectFailedSubtitle);
        setLoadingStatus(LOADING_CONFIG.statusMessages.failed);
      } else if (endKind === 'network-blocked') {
        setLoadingTitle('Network Blocked');
        setLoadingSubtitle(reason);
        setLoadingStatus(LOADING_CONFIG.statusMessages.failed);
      } else {
        setLoadingTitle('Disconnected');
        setLoadingSubtitle(reason || LOADING_CONFIG.disconnectedSubtitle);
        setLoadingStatus(`${LOADING_CONFIG.statusMessages.disconnected} (code ${code})`);
      }
    });

    /* ─── Live stats (1s cadence) — rendered when the popup is open ──── */
    stream.on('stats', (s) => {
      latestStats.current = {
        FPS: s.fps,
        'Latency (ms)': s.latencyMs,
        Resolution: s.resolution ?? '—',
        Codec: s.codec ?? '—',
        'Bitrate (kbps)': s.bitrateKbps ?? '—',
        'Frames Decoded': s.framesDecoded,
        'Frames Dropped': s.framesDropped,
        Relay: s.relayTransport || 'direct',
      };
    });

    /* ─── AFK countdown ──────────────────────────────────────────────── */
    stream.on('afkWarning', (w) => {
      if (w.kind === 'countdown') {
        setAfkWarning(true);
        setAfkCountdown(w.secondsRemaining);
        dismissAfkRef.current = w.dismiss;
      } else {
        setAfkWarning(false);
        dismissAfkRef.current = null;
      }
    });

    /* ─── On-screen keyboard: UE focused a text field ────────────────── */
    stream.on('osk', ({ contents }) => setOskText(contents ?? ''));

    /* ─── UE → Web messages ──────────────────────────────────────────── */
    stream.on('ueMessage', (message) => {
      // Handle custom UE → Web messages here
      // const data = JSON.parse(message);
    });
  }, []);

  useEffect(() => {
    if (!projectId) return;
    startStream(projectId);
    return () => streamRef.current?.disconnect();
  }, [projectId, startStream]);

  /* =====================================================================
     Event Handlers
     ===================================================================== */

  const handlePasswordSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (!password) return;
      startStream(projectId, { mode: 'password', password });
    },
    [projectId, password, startStream]
  );

  const handleDismissAfk = useCallback(() => {
    dismissAfkRef.current?.();
  }, []);

  const submitOsk = useCallback(() => {
    if (oskText !== null) streamRef.current?.sendTextboxEntry(oskText);
    setOskText(null);
  }, [oskText]);

  /* ─── Chat: lazy-join the project room on first open ────────────────── */
  const openChat = useCallback(async () => {
    setChatOpen(true);
    if (chatRef.current || !streamRef.current) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const chat = VoiceChat.for(streamRef.current, {
        userName: `Guest-${Math.floor(Math.random() * 1000)}`,
        voice: false, // join muted; mic is opt-in below
        platformHost:
          params.get('platform') === 'staging' ? 'https://platform.staging.streampixel.io' : undefined,
      });
      chat.on('message', (m) =>
        setChatMessages((prev) => [...prev.slice(-99), { ...m, ts: Date.now() }])
      );
      chat.on('roster', setRoster);
      chat.on('typing', () => {
        setSomeoneTyping(true);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setSomeoneTyping(false), 2500);
      });
      chat.on('deviceError', (e) => console.warn('[chat]', e.message));
      await chat.join();
      chatRef.current = chat;
      setChatJoined(true);
    } catch (err) {
      console.error('Chat join failed:', err.message);
      setChatMessages((prev) => [...prev, { from: 'system', text: `Chat unavailable: ${err.message}`, ts: Date.now() }]);
    }
  }, []);

  const sendChat = useCallback(() => {
    const text = chatInput.trim();
    if (!text) return;
    chatRef.current?.sendMessage(text);
    setChatInput('');
  }, [chatInput]);

  const toggleChatMic = useCallback(async () => {
    const next = !micOn;
    const ok = await chatRef.current?.toggleMic(next);
    setMicOn(next && ok !== false);
  }, [micOn]);

  useEffect(() => () => { chatRef.current?.leave(); clearTimeout(typingTimer.current); }, []);

  const toggleMute = useCallback(() => {
    const audible = streamRef.current?.toggleAudio();
    setIsMuted(!audible);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // While the stats popup is open, refresh from the 1s stats feed.
  useEffect(() => {
    if (!showStats) return undefined;
    setStatsData(latestStats.current);
    const id = setInterval(() => setStatsData({ ...(latestStats.current || {}) }), 1000);
    return () => clearInterval(id);
  }, [showStats]);

  const toggleStats = useCallback(() => setShowStats((prev) => !prev), []);
  const toggleSettings = useCallback(() => setShowSettings((prev) => !prev), []);

  const handleResolutionChange = useCallback((option) => {
    if (option.value) {
      const match = option.value.match(/\((\d+)x(\d+)\)/);
      if (match) streamRef.current?.setResolution(Number(match[1]), Number(match[2]));
    }
    setCurrentResolution(option.label);
    setShowSettings(false);
  }, []);

  /* ─── Developer Tools Handlers ───────────────────────────────────── */

  const handleConsoleCommand = useCallback((cmd) => {
    streamRef.current?.consoleCommand(cmd);
  }, []);

  const handleSendToUE = useCallback((jsonStr) => {
    try {
      streamRef.current?.send(JSON.parse(jsonStr));
    } catch (e) {
      console.error('Invalid JSON:', e.message);
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    streamRef.current?.disconnect();
  }, []);

  const handleScreenshot = useCallback(() => {
    const png = streamRef.current?.captureScreenshot();
    if (!png) return;
    const a = document.createElement('a');
    a.href = png;
    a.download = 'streampixel-screenshot.png';
    a.click();
  }, []);

  const handleDiagnostics = useCallback(async () => {
    const diag = await streamRef.current?.getDiagnostics();
    console.log('[diagnostics]', diag);
    if (diag) window.alert(`Connection: ${diag.verdict}`);
  }, []);

  /* =====================================================================
     Render — everything below is EXAMPLE UI. Core paints none of it.
     ===================================================================== */
  return (
    <div className="containMain">

      {/* Password Gate */}
      {needsPassword && (
        <div className="loading-overlay" style={{ backgroundColor: LOADING_CONFIG.backgroundColor }}>
          {LOADING_CONFIG.logoUrl && (
            <img src={LOADING_CONFIG.logoUrl} alt="Logo" className="loading-logo" />
          )}
          <h2 className="loading-title">Password Required</h2>
          <p className="loading-subtitle">This stream is protected.</p>
          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input
              type="password"
              value={password}
              autoFocus
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #333', background: '#101012', color: '#eee' }}
            />
            <button
              type="submit"
              style={{ padding: '10px 16px', borderRadius: 6, border: 'none', background: LOADING_CONFIG.accentColor, color: '#fff', cursor: 'pointer' }}
            >
              Join
            </button>
          </form>
          {passwordError && <p className="loading-status" style={{ color: '#ff7b7b' }}>{passwordError}</p>}
        </div>
      )}

      {/* Loading / Disconnected Screen */}
      {isLoading && !needsPassword && (
        <div className="loading-overlay" style={{ backgroundColor: LOADING_CONFIG.backgroundColor }}>
          {LOADING_CONFIG.logoUrl && (
            <img src={LOADING_CONFIG.logoUrl} alt="Logo" className="loading-logo" />
          )}
          {LOADING_CONFIG.showSpinner && loadingProgress > 0 && (
            <div className="loading-spinner" style={{ borderTopColor: LOADING_CONFIG.accentColor }} />
          )}
          <h2 className="loading-title">{loadingTitle}</h2>
          <p className="loading-subtitle">{loadingSubtitle}</p>
          {loadingProgress > 0 && (
            <div className="loading-progress-track">
              <div
                className="loading-progress-fill"
                style={{ width: `${loadingProgress}%`, backgroundColor: LOADING_CONFIG.accentColor }}
              />
            </div>
          )}
          <p className="loading-status">{loadingStatus}</p>
          {queuePosition !== null && (
            <div className="loading-queue">
              <p className="loading-queue-text">{LOADING_CONFIG.queueMessage(queuePosition)}</p>
              <div className="loading-queue-badge" style={{ backgroundColor: LOADING_CONFIG.accentColor }}>
                #{queuePosition}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Video Container — core attaches its <video> in here */}
      <div id="videoElement" ref={videoRef} />

      {/* AFK Warning Overlay */}
      {afkWarning && (
        <div className="afk-overlay" onClick={handleDismissAfk}>
          <div className="afk-card">
            <div className="afk-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h2 className="afk-title">Are you still there?</h2>
            <p className="afk-subtitle">No activity detected</p>
            <div className="afk-countdown" style={{ color: LOADING_CONFIG.accentColor }}>
              {afkCountdown}s
            </div>
            <p className="afk-hint">Disconnecting due to inactivity</p>
            <button
              className="afk-btn"
              style={{ backgroundColor: LOADING_CONFIG.accentColor }}
              onClick={handleDismissAfk}
            >
              I'm still here
            </button>
          </div>
        </div>
      )}

      {/* Chat (voice/text) — shown when the project has chat enabled */}
      {chatAvailable && !isLoading && (
        <button
          onClick={() => (chatOpen ? setChatOpen(false) : openChat())}
          title="Chat"
          style={{
            position: 'fixed', bottom: 20, left: 20, zIndex: 10010,
            width: 44, height: 44, borderRadius: 22, border: 'none', cursor: 'pointer',
            background: chatOpen ? LOADING_CONFIG.accentColor : 'rgba(20,20,26,.85)',
            color: '#fff', fontSize: 20,
          }}
        >
          💬
        </button>
      )}
      {chatOpen && (
        <div
          style={{
            position: 'fixed', bottom: 74, left: 20, zIndex: 10010, width: 300,
            maxHeight: '55vh', display: 'flex', flexDirection: 'column',
            background: 'rgba(16,16,20,.95)', border: '1px solid #2c2c34',
            borderRadius: 12, color: '#e8e8ec', font: '13px/1.5 system-ui, sans-serif',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid #26262e' }}>
            <strong style={{ flex: 1 }}>
              Chat {chatJoined ? `· ${1 + roster.remoteParticipants.length} online` : '· joining…'}
            </strong>
            <button
              onClick={toggleChatMic}
              title={micOn ? 'Mute mic' : 'Unmute mic'}
              style={{ border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
                background: micOn ? LOADING_CONFIG.accentColor : '#3a3a42', color: '#fff' }}
            >
              {micOn ? '🎙' : '🔇'}
            </button>
            <button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 16 }}>×</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {chatMessages.length === 0 && <span style={{ opacity: .5 }}>No messages yet.</span>}
            {chatMessages.map((m, i) => (
              <div key={i}>
                <span style={{ color: m.from === 'You' ? LOADING_CONFIG.accentColor : '#9ab', fontWeight: 600 }}>{m.from}</span>{' '}
                <span>{m.text}</span>
              </div>
            ))}
            {someoneTyping && <span style={{ opacity: .5, fontStyle: 'italic' }}>someone is typing…</span>}
          </div>
          <div style={{ display: 'flex', gap: 6, padding: 10, borderTop: '1px solid #26262e' }}>
            <input
              value={chatInput}
              onChange={(e) => { setChatInput(e.target.value); chatRef.current?.sendTyping(); }}
              onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') sendChat(); }}
              placeholder="Message…"
              style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #3a3a42', background: '#101014', color: '#eee', outline: 'none' }}
            />
            <button onClick={sendChat} style={{ border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', background: LOADING_CONFIG.accentColor, color: '#fff' }}>Send</button>
          </div>
        </div>
      )}

      {/* On-screen keyboard modal — UE requested text input */}
      {oskText !== null && (
        <div className="afk-overlay" onClick={() => setOskText(null)}>
          <div className="afk-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="afk-title">Enter text</h2>
            <p className="afk-subtitle">The application is asking for input</p>
            <input
              type="text"
              value={oskText}
              autoFocus
              onChange={(e) => setOskText(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') submitOsk();
                if (e.key === 'Escape') setOskText(null);
              }}
              style={{
                width: '100%', boxSizing: 'border-box', margin: '12px 0',
                padding: '12px 14px', borderRadius: 8, border: '1px solid #3a3a3e',
                background: '#101012', color: '#eee', fontSize: 15, outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button
                className="afk-btn"
                style={{ backgroundColor: LOADING_CONFIG.accentColor }}
                onClick={submitOsk}
              >
                Send
              </button>
              <button
                className="afk-btn"
                style={{ backgroundColor: '#3a3a3e' }}
                onClick={() => setOskText(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stream Controls */}
      {!isLoading && (
        <div className="stream-controls">
          <button className="control-btn" onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
            {isMuted ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>

          <button className="control-btn" onClick={toggleFullscreen} title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            {isFullscreen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 14 10 14 10 20" />
                <polyline points="20 10 14 10 14 4" />
                <line x1="14" y1="10" x2="21" y2="3" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            )}
          </button>

          <button className={`control-btn ${showStats ? 'control-btn-active' : ''}`} onClick={toggleStats} title="Stream Info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </button>

          {resolutionOptions.length > 1 && (
            <button className={`control-btn ${showSettings ? 'control-btn-active' : ''}`} onClick={toggleSettings} title="Settings">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          )}

          {SHOW_DEV_TOOLS && (
            <button className={`control-btn ${showDevTools ? 'control-btn-active' : ''}`} onClick={() => setShowDevTools((prev) => !prev)} title="Developer Tools">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 17 10 11 4 5" />
                <line x1="12" y1="19" x2="20" y2="19" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Stats Popup — live data from the SDK's `stats` event */}
      {showStats && (
        <div className="stats-popup">
          <div className="stats-popup-header">
            <span className="stats-popup-title">Stream Info</span>
            <button className="stats-popup-close" onClick={() => setShowStats(false)}>&times;</button>
          </div>
          <div className="stats-popup-body">
            {statsData && Object.keys(statsData).length > 0 ? (
              Object.entries(statsData).map(([key, val]) => (
                <div className="stats-row" key={key}>
                  <span className="stats-label">{key}</span>
                  <span className="stats-value">{String(val)}</span>
                </div>
              ))
            ) : (
              <p className="stats-empty">Waiting for stream statistics...</p>
            )}
          </div>
        </div>
      )}

      {/* Settings Popup (Resolution — options come from stream.allowedResolutions) */}
      {showSettings && (
        <div className="settings-popup">
          <div className="stats-popup-header">
            <span className="stats-popup-title">Quality</span>
            <button className="stats-popup-close" onClick={() => setShowSettings(false)}>&times;</button>
          </div>
          <div className="settings-popup-body">
            {resolutionOptions.map((option) => (
              <button
                key={option.label}
                className={`settings-option ${currentResolution === option.label ? 'settings-option-active' : ''}`}
                onClick={() => handleResolutionChange(option)}
              >
                <span>{option.label}</span>
                {currentResolution === option.label && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Developer Tools Panel */}
      {SHOW_DEV_TOOLS && showDevTools && (
        <div className="dev-tools-popup">
          <div className="stats-popup-header">
            <span className="stats-popup-title">Developer Tools (SDK {SDK_VERSION})</span>
            <button className="stats-popup-close" onClick={() => setShowDevTools(false)}>&times;</button>
          </div>
          <div className="stats-popup-body">
            <div className="dev-tools-section">
              <label className="dev-tools-label">Console Command</label>
              <div className="dev-tools-row">
                <input className="dev-tools-input" type="text" value={consoleCmd} onChange={(e) => setConsoleCmd(e.target.value)} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') handleConsoleCommand(consoleCmd); }} placeholder="e.g. stat fps" />
                <button className="dev-tools-btn" onClick={() => handleConsoleCommand(consoleCmd)}>Send</button>
              </div>
            </div>
            <div className="dev-tools-section">
              <label className="dev-tools-label">UI Interaction (JSON)</label>
              <div className="dev-tools-row">
                <input className="dev-tools-input" type="text" value={uiInteractionJson} onChange={(e) => setUiInteractionJson(e.target.value)} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') handleSendToUE(uiInteractionJson); }} placeholder='{"type":"action","value":"..."}' />
                <button className="dev-tools-btn" onClick={() => handleSendToUE(uiInteractionJson)}>Send</button>
              </div>
            </div>
            <div className="dev-tools-section">
              <label className="dev-tools-label">Diagnostics & Capture</label>
              <div className="dev-tools-row">
                <button className="dev-tools-btn" onClick={handleDiagnostics}>Diagnostics</button>
                <button className="dev-tools-btn" onClick={handleScreenshot}>Screenshot</button>
              </div>
            </div>
            <div className="dev-tools-section">
              <label className="dev-tools-label">Hovering Mouse</label>
              <div className="dev-tools-row">
                <button className="dev-tools-btn" onClick={() => streamRef.current?.setHoverMouse(true)}>Enable</button>
                <button className="dev-tools-btn" onClick={() => streamRef.current?.setHoverMouse(false)}>Disable</button>
              </div>
            </div>
            <div className="dev-tools-section">
              <label className="dev-tools-label">Connection</label>
              <div className="dev-tools-row">
                <button className="dev-tools-btn dev-tools-btn-danger" onClick={handleDisconnect}>Disconnect</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
