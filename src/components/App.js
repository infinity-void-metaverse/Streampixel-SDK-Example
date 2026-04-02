import React, { useEffect, useRef, useState, useCallback } from 'react';
import { StreamPixelApplication } from 'streampixelsdk';

/* =========================================================================
   FEATURE TOGGLES
   =========================================================================
   Set SHOW_DEV_TOOLS to true to display the Developer Tools panel
   (console commands, UI interaction, disconnect, resolution, mic, etc.).
   Set to false to hide it entirely in production.
   ========================================================================= */
const SHOW_DEV_TOOLS = true;


/* =========================================================================
   CUSTOMIZATION: Loading Screen Configuration
   =========================================================================
   Modify these values to customize the loading screen that appears
   while the stream is connecting.
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
    initializing:    'Initializing...',
    connecting:      'Connecting to server...',
    webRtcConnecting:'Establishing WebRTC connection...',
    sdpNegotiation:  'Negotiating stream parameters...',
    webRtcConnected: 'WebRTC connected, loading stream...',
    streamLoading:   'Stream is loading...',
    playingStream:   'Starting video playback...',
    inQueue:         'Waiting in queue...',
    failed:          'Connection failed. Please try again.',
    disconnected:    'Disconnected from stream.',
    reconnecting:    'Reconnecting to stream...',
    retrying:        'Retrying connection...',
    reconnected:     'Reconnected! Loading stream...',
    reconnectFailed: 'Unable to reconnect. Please refresh the page.',
  },

  reconnectingTitle:       'Reconnecting',
  reconnectingSubtitle:    'Please wait while we restore your session...',
  reconnectedTitle:        'Reconnected',
  reconnectFailedTitle:    'Reconnection Failed',
  reconnectFailedSubtitle: 'We were unable to restore your session.',
};


const App = () => {
  // SDK refs (stable across renders, not React state)
  const pixelStreamingRef = useRef(null);
  const appStreamRef = useRef(null);
  const uiControlRef = useRef(null);

  // URL-derived config
  const [projectId, setProjectId] = useState(null);
  const [sfuHost, setSfuHost] = useState('false');
  const [sfuPlayer, setSfuPlayer] = useState('false');
  const [streamerId, setStreamerId] = useState(undefined);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [loadingTitle, setLoadingTitle] = useState(LOADING_CONFIG.title);
  const [loadingSubtitle, setLoadingSubtitle] = useState(LOADING_CONFIG.subtitle);
  const [queuePosition, setQueuePosition] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(LOADING_CONFIG.statusMessages.initializing);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const isReconnecting = useRef(false);

  // Controls state
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [statsData, setStatsData] = useState(null);

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [currentResolution, setCurrentResolution] = useState('Auto (Dashboard)');

  // AFK state
  const [afkWarning, setAfkWarning] = useState(false);
  const [afkCountdown, setAfkCountdown] = useState(0);
  const dismissAfkRef = useRef(null);

  // Developer Tools state
  const [showDevTools, setShowDevTools] = useState(false);
  const [consoleCmd, setConsoleCmd] = useState('stat fps');
  const [uiInteractionJson, setUiInteractionJson] = useState('{"type":"setColor","value":"red"}');

  const videoRef = useRef(null);

  /* =====================================================================
     Parse project ID and query params from URL
     ===================================================================== */
  useEffect(() => {
    const urlPart = window.location.href.split('/').pop();
    if (!urlPart) return;

    const baseId = urlPart.split('?')[0];
    setProjectId(baseId);

    const params = new URLSearchParams(window.location.search);
    if (params.has('streamerId')) setStreamerId(params.get('streamerId'));
    if (params.has('sfuHost')) setSfuHost(params.get('sfuHost'));
    if (params.has('sfuPlayer')) setSfuPlayer(params.get('sfuPlayer'));
  }, []);

  /* =====================================================================
     Initialize SDK when projectId is ready
     ===================================================================== */
  useEffect(() => {
    if (!projectId) return;

    let mounted = true;

    const startPlay = async () => {
      setLoadingStatus(LOADING_CONFIG.statusMessages.connecting);
      setLoadingProgress(10);

      /* ─────────────────────────────────────────────────────────────────
         StreamPixelApplication() — Initialize the SDK.

         The appId is your project ID from the StreamPixel dashboard.
         It resolves all server-side config automatically (signaling URL,
         TURN credentials, UE instance pool, auth tokens).

         Everything else below is optional. If omitted, settings default
         to your StreamPixel dashboard configuration.
         ───────────────────────────────────────────────────────────────── */
      const { appStream, pixelStreaming, queueHandler, UIControl, reconnectStream } = await StreamPixelApplication({

        // ── Required ──────────────────────────────────────────────────
        appId: projectId,

        // ── Connection ────────────────────────────────────────────────
        AutoConnect: true,
        streamerId,
        sfuHost,
        sfuPlayer,
        forceTurn: true,

        // ── The settings below are OPTIONAL overrides. ────────────────
        // ── If omitted, they default to your StreamPixel dashboard. ───

        // ── Codec (defaults from dashboard) ───────────────────────────
        // primaryCodec: "AV1",        // 'AV1' | 'H264' | 'VP9' | 'VP8'
        // fallBackCodec: "H264",

        // ── Resolution (defaults from dashboard) ──────────────────────
        // maxStreamQuality: '1080p (1920x1080)',
        // startResolution: "1080p (1920x1080)",
        // startResolutionMobile: "480p (854x480)",
        // startResolutionTab: "720p (1280x720)",
        // resolutionMode: "Fixed Resolution Mode",

        // ── Bitrate / Quality (defaults from dashboard) ───────────────
        // minBitrate: 1,
        // maxBitrate: 100,
        // minQP: 20,
        // maxQP: -1,

        // ── Input (defaults from dashboard) ───────────────────────────
        // mouseInput: true,
        // keyBoardInput: true,
        // touchInput: true,
        // hoverMouse: true,
        // gamepadInput: true,
        // xrInput: true,
        // fakeMouseWithTouches: false,

        // ── Audio (defaults from dashboard) ───────────────────────────
        // useMic: true,

        // ── AFK / Timeout (defaults from dashboard) ───────────────────
        // afktimeout: 120,
      });

      if (!mounted) return;

      // Store SDK refs
      pixelStreamingRef.current = pixelStreaming;
      appStreamRef.current = appStream;
      uiControlRef.current = UIControl;

      /* ─── Reconnection Lifecycle ─────────────────────────────────── */
      reconnectStream.on('state', (data) => {
        switch (data.status) {
          case 'connecting':
          case 'reconnecting':
            setIsLoading(true);
            setIsMuted(true);
            setLoadingTitle(LOADING_CONFIG.reconnectingTitle);
            setLoadingSubtitle(LOADING_CONFIG.reconnectingSubtitle);
            setLoadingStatus(LOADING_CONFIG.statusMessages.reconnecting);
            setLoadingProgress(20);
            isReconnecting.current = true;
            break;

          case 'connected':
            setLoadingTitle(LOADING_CONFIG.reconnectedTitle);
            setLoadingSubtitle(LOADING_CONFIG.subtitle);
            setLoadingStatus(LOADING_CONFIG.statusMessages.reconnected);
            setLoadingProgress(70);
            break;

          case 'disconnected':
            setIsLoading(true);
            if (!isReconnecting.current) {
              setLoadingTitle('Disconnected');
              setLoadingSubtitle(LOADING_CONFIG.disconnectedSubtitle);
              setLoadingStatus(LOADING_CONFIG.statusMessages.disconnected);
              setLoadingProgress(0);
            }
            break;

          case 'failed':
            setIsLoading(true);
            setLoadingTitle(LOADING_CONFIG.reconnectFailedTitle);
            setLoadingSubtitle(LOADING_CONFIG.reconnectFailedSubtitle);
            setLoadingStatus(LOADING_CONFIG.statusMessages.reconnectFailed);
            setLoadingProgress(0);
            break;

          default:
            break;
        }
      });

      /* ─── Hide default Pixel Streaming UI ────────────────────────── */
      const uiFeaturesEl = appStream.uiFeaturesElement
        || appStream.rootElement?.querySelector('#uiFeatures');
      if (uiFeaturesEl) uiFeaturesEl.style.display = 'none';

      /* ─── WebRTC Lifecycle Events → Loading Progress ─────────────── */
      pixelStreaming.addEventListener('webRtcAutoConnect', () => {
        setLoadingStatus(LOADING_CONFIG.statusMessages.connecting);
        setLoadingProgress(15);
      });

      pixelStreaming.addEventListener('webRtcConnecting', () => {
        setLoadingStatus(LOADING_CONFIG.statusMessages.webRtcConnecting);
        setLoadingProgress(30);
      });

      pixelStreaming.addEventListener('webRtcSdp', () => {
        setLoadingStatus(LOADING_CONFIG.statusMessages.sdpNegotiation);
        setLoadingProgress(50);
      });

      pixelStreaming.addEventListener('webRtcConnected', () => {
        setLoadingStatus(LOADING_CONFIG.statusMessages.webRtcConnected);
        setLoadingProgress(70);
      });

      pixelStreaming.addEventListener('streamLoading', () => {
        setLoadingStatus(LOADING_CONFIG.statusMessages.streamLoading);
        setLoadingProgress(80);
      });

      pixelStreaming.addEventListener('playStream', () => {
        setLoadingStatus(LOADING_CONFIG.statusMessages.playingStream);
        setLoadingProgress(90);
      });

      pixelStreaming.addEventListener('webRtcFailed', () => {
        setLoadingTitle('Connection Failed');
        setLoadingSubtitle(LOADING_CONFIG.disconnectedSubtitle);
        setLoadingStatus(LOADING_CONFIG.statusMessages.failed);
        setLoadingProgress(0);
      });

      pixelStreaming.addEventListener('webRtcDisconnected', () => {
        if (!isReconnecting.current) {
          setLoadingTitle('Disconnected');
          setLoadingSubtitle(LOADING_CONFIG.disconnectedSubtitle);
          setLoadingStatus(LOADING_CONFIG.statusMessages.disconnected);
          setIsLoading(true);
          setLoadingProgress(0);
        }
      });

      /* ─── AFK Warning ───────────────────────────────────────────── */
      pixelStreaming.addEventListener('afkWarningActivate', (e) => {
        setAfkWarning(true);
        setAfkCountdown(e.data.countDown);
        dismissAfkRef.current = e.data.dismissAfk;
      });

      pixelStreaming.addEventListener('afkWarningUpdate', (e) => {
        setAfkCountdown(e.data.countDown);
      });

      pixelStreaming.addEventListener('afkWarningDeactivate', () => {
        setAfkWarning(false);
        dismissAfkRef.current = null;
      });

      pixelStreaming.addEventListener('afkTimedOut', () => {
        setAfkWarning(false);
        dismissAfkRef.current = null;
        setLoadingTitle('Session Ended');
        setLoadingSubtitle(LOADING_CONFIG.disconnectedSubtitle);
        setLoadingStatus('You were disconnected due to inactivity.');
        setIsLoading(true);
        setLoadingProgress(0);
      });

      /* ─── Video Initialized ──────────────────────────────────────── */
      appStream.onVideoInitialized = () => {
        videoRef.current.append(appStream.rootElement);

        // Hide default UI after DOM mount
        const uiEl = appStream.rootElement?.querySelector('#uiFeatures');
        if (uiEl) uiEl.style.display = 'none';

        const videoElement = appStream.stream.videoElementParent.querySelector('video');
        if (videoElement) {
          videoElement.muted = true;
          videoElement.focus();
          videoElement.autoplay = true;
          videoElement.tabIndex = 0;
        }

        // Mute the separate audio element the SDK creates
        const audioEl = appStream.stream._webRtcController?.streamController?.audioElement;
        if (audioEl) audioEl.muted = true;

        // Dismiss loading screen
        setLoadingProgress(100);
        setTimeout(() => {
          setIsLoading(false);
          setQueuePosition(null);
          setLoadingTitle(LOADING_CONFIG.title);
          setLoadingSubtitle(LOADING_CONFIG.subtitle);
        }, 300);
      };

      appStream.onDisconnect = () => {};

      /* ─── Queue ──────────────────────────────────────────────────── */
      queueHandler((msg) => {
        setQueuePosition(msg.position);
        setLoadingStatus(LOADING_CONFIG.statusMessages.inQueue);
      });

      /* ─── UE Response Listener ───────────────────────────────────── */
      pixelStreaming.addResponseEventListener('handle_responses', () => {
        // Handle custom UE → Web messages here
        // const data = JSON.parse(response);
      });
    };

    startPlay();

    return () => { mounted = false; };
  }, [projectId, streamerId, sfuHost, sfuPlayer]);


  /* =====================================================================
     Event Handlers
     ===================================================================== */

  const handleDismissAfk = useCallback(() => {
    dismissAfkRef.current?.();
  }, []);

  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;

    const videoElement = appStreamRef.current?.stream?.videoElementParent?.querySelector('video');
    if (videoElement) videoElement.muted = newMuted;

    const audioEl = appStreamRef.current?.stream?._webRtcController?.streamController?.audioElement;
    if (audioEl) {
      audioEl.muted = newMuted;
      if (!newMuted && audioEl.paused) audioEl.play().catch(() => {});
    }

    setIsMuted(newMuted);
  }, [isMuted]);

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

  const toggleStats = useCallback(() => {
    if (!showStats) {
      const data = uiControlRef.current?.getStreamStats();
      if (data) setStatsData(data);
    }
    setShowStats((prev) => !prev);
  }, [showStats]);
  const toggleSettings = useCallback(() => setShowSettings((prev) => !prev), []);

  const RESOLUTION_OPTIONS = [
    { label: 'Auto (Dashboard)', value: null },
    { label: '480p', value: '854x480' },
    { label: '720p', value: '1280x720' },
    { label: '1080p', value: '1920x1080' },
    { label: '1440p', value: '2560x1440' },
    { label: '4K', value: '3840x2160' },
  ];

  const handleResolutionChange = useCallback((option) => {
    if (option.value) {
      uiControlRef.current?.handleResMax(option.value);
    }
    setCurrentResolution(option.label);
    setShowSettings(false);
  }, []);

  /* ─── Developer Tools Handlers ───────────────────────────────────── */

  const handleConsoleCommand = useCallback((cmd) => {
    pixelStreamingRef.current?.emitConsoleCommand(cmd);
  }, []);

  const handleSendToUE = useCallback((jsonStr) => {
    try {
      const descriptor = JSON.parse(jsonStr);
      appStreamRef.current?.stream?.emitUIInteraction(descriptor);
    } catch (e) {
      console.error('Invalid JSON:', e.message);
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    pixelStreamingRef.current?.disconnect();
  }, []);

  const handleMicrophone = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      pixelStreamingRef.current?.unmuteMicrophone(true);
    } catch (err) {
      console.error('Microphone access denied:', err.message);
    }
  }, []);


  /* =====================================================================
     Render
     ===================================================================== */
  return (
    <div className="containMain">

      {/* Loading / Disconnected Screen */}
      {isLoading && (
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

      {/* Video Container */}
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

          <button className={`control-btn ${showSettings ? 'control-btn-active' : ''}`} onClick={toggleSettings} title="Settings">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

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

      {/* Stats Popup — data from UIControl.getStreamStats() */}
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
                  <span className="stats-value">{val}</span>
                </div>
              ))
            ) : (
              <p className="stats-empty">Waiting for stream statistics...</p>
            )}
          </div>
        </div>
      )}

      {/* Settings Popup (Resolution) */}
      {showSettings && (
        <div className="settings-popup">
          <div className="stats-popup-header">
            <span className="stats-popup-title">Quality</span>
            <button className="stats-popup-close" onClick={() => setShowSettings(false)}>&times;</button>
          </div>
          <div className="settings-popup-body">
            {RESOLUTION_OPTIONS.map((option) => (
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
            <span className="stats-popup-title">Developer Tools</span>
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
              <label className="dev-tools-label">Connection</label>
              <div className="dev-tools-row">
                <button className="dev-tools-btn dev-tools-btn-danger" onClick={handleDisconnect}>Disconnect</button>
              </div>
            </div>
            <div className="dev-tools-section">
              <label className="dev-tools-label">Microphone</label>
              <div className="dev-tools-row">
                <button className="dev-tools-btn" onClick={handleMicrophone}>Enable Mic</button>
              </div>
            </div>

            <div className="dev-tools-section">
              <label className="dev-tools-label">Hovering Mouse</label>
              <div className="dev-tools-row">
                <button className="dev-tools-btn" onClick={() => uiControlRef.current?.toggleHoveringMouse(true)}>Enable</button>
                <button className="dev-tools-btn" onClick={() => uiControlRef.current?.toggleHoveringMouse(false)}>Disable</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
